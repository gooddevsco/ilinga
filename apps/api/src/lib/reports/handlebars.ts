/**
 * Tiny, sandboxed Handlebars-like renderer.
 *
 * Supports {{path.to.value}} and {{#each items}}…{{this}}…{{/each}}.
 * Deliberately minimal so we never execute arbitrary code from a template.
 */

const get = (root: unknown, path: string): unknown => {
  const segments = path.split('.');
  let cur: unknown = root;
  for (const seg of segments) {
    if (cur && typeof cur === 'object' && seg in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[seg];
    } else {
      return '';
    }
  }
  return cur ?? '';
};

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const renderTemplate = (template: string, data: Record<string, unknown>): string => {
  let out = template;
  // {{#each items}}…{{this}}…{{/each}}
  out = out.replace(
    /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_match, path: string, body: string) => {
      const items = get(data, path);
      if (!Array.isArray(items)) return '';
      return items
        .map((item) =>
          body
            .replace(/\{\{this\.([\w.]+)\}\}/g, (_m, p2: string) => escapeHtml(String(get(item, p2))))
            .replace(/\{\{this\}\}/g, () =>
              typeof item === 'string' ? escapeHtml(item) : escapeHtml(JSON.stringify(item)),
            ),
        )
        .join('');
    },
  );
  // {{path.to.value}}
  out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    const v = get(data, path);
    return escapeHtml(typeof v === 'string' ? v : v === null || v === undefined ? '' : JSON.stringify(v));
  });
  return out;
};
