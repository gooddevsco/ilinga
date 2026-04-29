import { openAiProvider } from './openai.js';
import { anthropicProvider } from './anthropic.js';
import type { AiProvider } from './types.js';

export interface ProviderResolver {
  pick(workload: string): { provider: AiProvider; model: string } | null;
}

export const buildSystemRegistry = (): ProviderResolver => {
  const openaiKey = process.env.IL_SYSTEM_OPENAI_KEY ?? '';
  return {
    pick(workload) {
      if (workload === 'embeddings') {
        return openaiKey
          ? { provider: openAiProvider(openaiKey), model: 'text-embedding-3-large' }
          : null;
      }
      // Default narrative + reasoning pick.
      if (openaiKey) {
        return {
          provider: openAiProvider(openaiKey),
          model: process.env.IL_SYSTEM_OPENAI_MODEL ?? 'gpt-4o-mini',
        };
      }
      return null;
    },
  };
};

export const inMemoryProvider = (sequence: string[]): AiProvider => ({
  name: 'in-memory',
  async complete() {
    return {
      content: sequence.join(''),
      usage: { inputTokens: 1, outputTokens: sequence.length },
      model: 'mock',
      provider: 'in-memory',
      latencyMs: 0,
    };
  },
  async *stream() {
    for (const part of sequence) {
      yield { delta: part };
    }
  },
});
