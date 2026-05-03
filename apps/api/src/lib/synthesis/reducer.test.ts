import { describe, it, expect } from 'vitest';
import { reduce } from './reducer.js';

describe('reducer', () => {
  it('picks the highest-confidence candidate', () => {
    const result = reduce([
      { source: 'a', value: 'A', confidence: 60, createdAt: '2026-01-01T00:00:00Z' },
      { source: 'b', value: 'B', confidence: 80, createdAt: '2026-01-01T00:00:00Z' },
    ]);
    expect(result.chosen.source).toBe('b');
    expect(result.alternates).toHaveLength(1);
  });

  it('breaks ties by most-recent createdAt', () => {
    const result = reduce([
      { source: 'older', value: 'O', confidence: 70, createdAt: '2026-01-01T00:00:00Z' },
      { source: 'newer', value: 'N', confidence: 70, createdAt: '2026-02-01T00:00:00Z' },
    ]);
    expect(result.chosen.source).toBe('newer');
  });

  it('records single-candidate rationale', () => {
    const result = reduce([{ source: 'only', value: 1, confidence: 50, createdAt: new Date() }]);
    expect(result.rationale).toBe('single candidate');
    expect(result.alternates).toEqual([]);
  });

  it('throws on empty input', () => {
    expect(() => reduce([])).toThrow();
  });
});
