import { describe, expect, it } from 'vitest';
import { extractFromBuffer } from './extract.js';

describe('extractFromBuffer', () => {
  it('reads plain text/* directly', async () => {
    const out = await extractFromBuffer('text/markdown', Buffer.from('# hi\n\nbody.'));
    expect(out.meta['kind']).toBe('text');
    expect(out.text).toContain('hi');
  });

  it('falls back to plain UTF-8 for unknown mimetypes', async () => {
    const out = await extractFromBuffer('application/octet-stream', Buffer.from('abc'));
    expect(out.text).toBe('abc');
  });

  it('handles application/json as plain text', async () => {
    const out = await extractFromBuffer('application/json', Buffer.from('{"k": "v"}'));
    expect(out.text).toBe('{"k": "v"}');
  });
});
