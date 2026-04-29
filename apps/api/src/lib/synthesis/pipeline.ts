import { eq, and, isNull } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { sseHub } from '../sse/hub.js';
import { ulid } from 'ulid';
import type { AiProvider } from '../ai/types.js';

interface ModuleSeed {
  code: string;
  cluster: string;
  label: string;
  promptTemplate: string;
  aiWorkload: 'reasoning' | 'narrative' | 'classification' | 'embeddings';
  outputKeys: string[];
  creditCost: number;
}

const DEFAULT_MODULES: ModuleSeed[] = [
  {
    code: 'narrative.summary',
    cluster: 'Narrative',
    label: 'Executive narrative',
    promptTemplate:
      'You are summarising a venture brief. Produce a 3-paragraph narrative that an investor could read in 60 seconds. Brief: {{brief}}',
    aiWorkload: 'narrative',
    outputKeys: ['narrative.summary'],
    creditCost: 2,
  },
  {
    code: 'risk.top',
    cluster: 'Risk',
    label: 'Top risks',
    promptTemplate:
      'List the 5 highest-impact risks for this venture as a JSON array of strings. Brief: {{brief}}',
    aiWorkload: 'reasoning',
    outputKeys: ['risk.top'],
    creditCost: 2,
  },
  {
    code: 'gtm.icp',
    cluster: 'GTM',
    label: 'Ideal customer profile',
    promptTemplate:
      'Describe the ideal customer profile in one paragraph. Brief: {{brief}}',
    aiWorkload: 'narrative',
    outputKeys: ['gtm.icp'],
    creditCost: 1,
  },
];

export const seedModules = async (
  tenantId: string,
  cycleId: string,
): Promise<void> => {
  const db = getDb();
  for (const m of DEFAULT_MODULES) {
    await db
      .insert(schema.modules)
      .values({
        tenantId,
        cycleId,
        code: m.code,
        cluster: m.cluster,
        label: m.label,
        status: 'queued',
        aiWorkload: m.aiWorkload,
        promptTemplate: m.promptTemplate,
        outputKeys: m.outputKeys,
        creditCost: m.creditCost,
        queuedAt: new Date(),
      })
      .onConflictDoNothing();
  }
};

export interface RunModuleInput {
  tenantId: string;
  cycleId: string;
  moduleId: string;
  briefText: string;
  provider: AiProvider;
  modelId: string;
  signal: AbortSignal;
}

export const runModule = async (input: RunModuleInput): Promise<void> => {
  const db = getDb();
  const m = await db
    .select()
    .from(schema.modules)
    .where(eq(schema.modules.id, input.moduleId))
    .limit(1)
    .then((rows) => rows[0]);
  if (!m) return;

  const promptText = m.promptTemplate.replace('{{brief}}', input.briefText);
  const runKey = `cycle:${input.cycleId}:module:${input.moduleId}`;
  const cycleKey = `cycle:${input.cycleId}`;

  await db
    .update(schema.modules)
    .set({ status: 'running', startedAt: new Date() })
    .where(eq(schema.modules.id, m.id));
  await sseHub.publish(runKey, {
    id: ulid(),
    event: 'module.running',
    data: { moduleId: m.id, code: m.code },
  });
  await sseHub.publish(cycleKey, {
    id: ulid(),
    event: 'stage.started',
    data: { stage: m.cluster, code: m.code },
  });

  const [run] = await db
    .insert(schema.promptRuns)
    .values({
      tenantId: input.tenantId,
      cycleId: input.cycleId,
      moduleId: m.id,
      workload: m.aiWorkload,
      promptHash: hashOf(promptText),
      promptText,
      status: 'running',
      creditsCharged: m.creditCost,
    })
    .returning({ id: schema.promptRuns.id });

  let completion = '';
  try {
    const stream = input.provider.stream({
      model: input.modelId,
      messages: [{ role: 'user', content: promptText }],
      signal: input.signal,
    });
    for await (const chunk of stream) {
      if (input.signal.aborted) throw new Error('cancelled');
      completion += chunk.delta;
      await sseHub.publish(runKey, {
        id: ulid(),
        event: 'prompt.token',
        data: { runId: run!.id, delta: chunk.delta },
      });
    }
  } catch (err) {
    if (input.signal.aborted) {
      await db
        .update(schema.promptRuns)
        .set({ status: 'cancelled', cancelledAt: new Date(), completionText: completion })
        .where(eq(schema.promptRuns.id, run!.id));
      await db
        .update(schema.modules)
        .set({ status: 'queued' })
        .where(eq(schema.modules.id, m.id));
      await sseHub.publish(runKey, {
        id: ulid(),
        event: 'stream.cancelled',
        data: { moduleId: m.id, runId: run!.id },
      });
      return;
    }
    await db
      .update(schema.promptRuns)
      .set({ status: 'failed', errorMessage: (err as Error).message })
      .where(eq(schema.promptRuns.id, run!.id));
    await db
      .update(schema.modules)
      .set({
        status: 'failed',
        failedAt: new Date(),
        failureReason: (err as Error).message,
      })
      .where(eq(schema.modules.id, m.id));
    await sseHub.publish(runKey, {
      id: ulid(),
      event: 'module.failed',
      data: { moduleId: m.id, reason: (err as Error).message },
    });
    return;
  }

  await db
    .update(schema.promptRuns)
    .set({
      status: 'complete',
      completedAt: new Date(),
      completionText: completion,
    })
    .where(eq(schema.promptRuns.id, run!.id));
  await db
    .update(schema.modules)
    .set({ status: 'complete', completedAt: new Date() })
    .where(eq(schema.modules.id, m.id));

  for (const code of m.outputKeys as string[]) {
    await db.insert(schema.contentKeys).values({
      tenantId: input.tenantId,
      cycleId: input.cycleId,
      code,
      version: 1,
      value: { text: completion },
      confidence: 80,
      source: 'module',
      sourceModuleId: m.id,
      sourcePromptRunId: run!.id,
    });
  }

  await sseHub.publish(runKey, {
    id: ulid(),
    event: 'prompt.complete',
    data: { runId: run!.id },
  });
  await sseHub.publish(runKey, {
    id: ulid(),
    event: 'module.complete',
    data: { moduleId: m.id, code: m.code },
  });
  await sseHub.publish(`cycle:${input.cycleId}`, {
    id: ulid(),
    event: 'stage.complete',
    data: { code: m.code },
  });
};

const hashOf = (s: string): string => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h.toString(36);
};

interface ActiveRun {
  controller: AbortController;
}
const activeCycles = new Map<string, ActiveRun>();

export const cancelCycle = async (cycleId: string): Promise<void> => {
  const a = activeCycles.get(cycleId);
  if (a) a.controller.abort();
  const db = getDb();
  await db
    .update(schema.modules)
    .set({ status: 'queued' })
    .where(and(eq(schema.modules.cycleId, cycleId), eq(schema.modules.status, 'running')));
  await sseHub.publish(`cycle:${cycleId}`, {
    id: ulid(),
    event: 'stream.cancelled',
    data: { cycleId },
  });
};

export const startCycleSynthesis = async (
  tenantId: string,
  cycleId: string,
  briefText: string,
  provider: AiProvider,
  modelId: string,
): Promise<void> => {
  const db = getDb();
  await seedModules(tenantId, cycleId);
  const modules = await db
    .select({ id: schema.modules.id })
    .from(schema.modules)
    .where(
      and(
        eq(schema.modules.cycleId, cycleId),
        eq(schema.modules.status, 'queued'),
        isNull(schema.modules.completedAt),
      ),
    );
  const controller = new AbortController();
  activeCycles.set(cycleId, { controller });
  try {
    for (const m of modules) {
      if (controller.signal.aborted) break;
      await runModule({
        tenantId,
        cycleId,
        moduleId: m.id,
        briefText,
        provider,
        modelId,
        signal: controller.signal,
      });
    }
  } finally {
    activeCycles.delete(cycleId);
  }
};
