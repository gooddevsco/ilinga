import { describe, it, expect } from 'vitest';
import { inMemoryProvider } from './registry.js';

describe('in-memory provider', () => {
  it('streams sequence chunks in order', async () => {
    const p = inMemoryProvider(['the ', 'quick ', 'brown ', 'fox']);
    const out: string[] = [];
    for await (const chunk of p.stream({ model: 'mock', messages: [] })) {
      out.push(chunk.delta);
    }
    expect(out).toEqual(['the ', 'quick ', 'brown ', 'fox']);
  });

  it('completes by concatenating sequence', async () => {
    const p = inMemoryProvider(['a', 'b', 'c']);
    const c = await p.complete({ model: 'mock', messages: [] });
    expect(c.content).toBe('abc');
  });
});
