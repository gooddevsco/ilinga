import { describe, it, expect } from 'vitest';
import { renderTemplate } from './handlebars.js';

describe('renderTemplate', () => {
  it('replaces simple paths', () => {
    expect(renderTemplate('Hello {{user.name}}', { user: { name: 'Alice' } })).toBe(
      'Hello Alice',
    );
  });
  it('escapes HTML', () => {
    expect(renderTemplate('<p>{{x}}</p>', { x: '<script>alert(1)</script>' })).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    );
  });
  it('iterates over a string array with {{this}}', () => {
    expect(renderTemplate('<ul>{{#each items}}<li>{{this}}</li>{{/each}}</ul>', { items: ['a', 'b'] })).toBe(
      '<ul><li>a</li><li>b</li></ul>',
    );
  });
  it('iterates over an object array with {{this.field}}', () => {
    expect(
      renderTemplate(
        '{{#each rows}}{{this.label}}={{this.value}};{{/each}}',
        { rows: [{ label: 'a', value: 1 }, { label: 'b', value: 2 }] },
      ),
    ).toBe('a=1;b=2;');
  });
  it('renders empty for missing paths', () => {
    expect(renderTemplate('{{nope}}', {})).toBe('');
  });
});
