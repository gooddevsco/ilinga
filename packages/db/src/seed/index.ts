/* eslint-disable no-console */
import { closeDb, getDb } from '../client.js';
import * as schema from '../schema/index.js';
import { planSeeds, creditPackSeeds } from './data/plans.js';
import { aiModelSeeds } from './data/ai-models.js';
import { questionSeeds } from './data/questions.js';
import { reportTemplateSeeds } from './data/templates.js';

const upsertPlans = async (db: ReturnType<typeof getDb>) => {
  for (const p of planSeeds) {
    await db
      .insert(schema.plans)
      .values(p)
      .onConflictDoUpdate({
        target: schema.plans.code,
        set: {
          displayName: p.displayName,
          monthlyUsdCents: p.monthlyUsdCents,
          monthlyCredits: p.monthlyCredits,
          seats: p.seats,
        },
      });
  }
};

const upsertPacks = async (db: ReturnType<typeof getDb>) => {
  for (const c of creditPackSeeds) {
    await db
      .insert(schema.creditPacks)
      .values(c)
      .onConflictDoUpdate({
        target: schema.creditPacks.code,
        set: { credits: c.credits, usdCents: c.usdCents },
      });
  }
};

const upsertAiModels = async (db: ReturnType<typeof getDb>) => {
  for (const m of aiModelSeeds) {
    await db
      .insert(schema.aiModels)
      .values({ ...m, capabilities: [...m.capabilities] })
      .onConflictDoNothing();
  }
};

const upsertQuestions = async (db: ReturnType<typeof getDb>) => {
  for (const q of questionSeeds) {
    await db.insert(schema.questions).values(q).onConflictDoNothing();
  }
};

const upsertTemplates = async (db: ReturnType<typeof getDb>) => {
  for (const t of reportTemplateSeeds) {
    await db
      .insert(schema.reportTemplates)
      .values({ ...t, requiredKeys: [...t.requiredKeys] })
      .onConflictDoNothing();
  }
};

export const runSeed = async (): Promise<void> => {
  const db = getDb();
  console.log('Seeding plans + credit packs');
  await upsertPlans(db);
  await upsertPacks(db);
  console.log('Seeding AI catalog');
  await upsertAiModels(db);
  console.log('Seeding interview questions');
  await upsertQuestions(db);
  console.log('Seeding report templates');
  await upsertTemplates(db);
  console.log('Seed complete.');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  runSeed()
    .then(() => closeDb())
    .catch(async (err) => {
      console.error(err);
      await closeDb();
      process.exit(1);
    });
}
