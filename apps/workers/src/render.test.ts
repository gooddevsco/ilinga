import { describe, expect, it } from 'vitest';
import { __testing } from './render.js';

const { countPdfPages, renderTemplate } = __testing;

describe('renderTemplate', () => {
  it('substitutes simple placeholders', () => {
    const out = renderTemplate('Hello {{name}}', { name: 'world' });
    expect(out).toBe('Hello world');
  });

  it('escapes HTML in interpolated values', () => {
    const out = renderTemplate('<p>{{x}}</p>', { x: '<script>' });
    expect(out).toBe('<p>&lt;script&gt;</p>');
  });

  it('walks dotted paths', () => {
    const out = renderTemplate('{{venture.name}}', { venture: { name: 'Northwind' } });
    expect(out).toBe('Northwind');
  });

  it('iterates {{#each}} blocks with {{this.X}} access', () => {
    const out = renderTemplate('<ul>{{#each items}}<li>{{this.title}}</li>{{/each}}</ul>', {
      items: [{ title: 'a' }, { title: 'b' }],
    });
    expect(out).toBe('<ul><li>a</li><li>b</li></ul>');
  });

  it('iterates {{#each}} with a primitive list', () => {
    const out = renderTemplate('{{#each xs}}{{this}};{{/each}}', { xs: ['a', 'b'] });
    expect(out).toBe('a;b;');
  });
});

describe('countPdfPages', () => {
  it('counts /Type /Page markers and ignores /Pages', () => {
    // Synthetic minimal PDF body with 3 page nodes + 1 /Pages parent.
    const body = Buffer.from('/Type /Pages /Type /Page /Foo /Type /Page /Type /Page x', 'latin1');
    expect(countPdfPages(body)).toBe(3);
  });

  it('returns 1 for a buffer with no markers (best-effort fallback)', () => {
    expect(countPdfPages(Buffer.from('garbage'))).toBe(1);
  });
});
