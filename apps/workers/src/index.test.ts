import { describe, it, expect } from 'vitest';
import { phase } from './index.js';

describe('workers stub', () => {
  it('loads', () => {
    expect(phase).toBe(17);
  });
});
