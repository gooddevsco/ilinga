export const reportTemplateSeeds = [
  {
    code: 'investor_pulse',
    version: 1,
    displayName: 'Investor Pulse',
    description: 'One-page investor narrative with traction signal and risks.',
    creditCost: 0,
    pricingTier: 'free',
    requiredKeys: ['narrative.summary', 'risk.top'],
    handlebarsHtml: `<!doctype html><html><head><meta charset="utf-8"><title>{{ venture.name }} — Investor Pulse</title>
<style>body{font-family:Inter,sans-serif;max-width:800px;margin:40px auto;color:#0f172a}h1{font-size:32px}h2{margin-top:32px}</style></head>
<body><h1>{{ venture.name }} — Investor Pulse</h1>
<p>{{ narrative.summary }}</p>
<h2>Top risks</h2><ol>{{#each risk.top}}<li>{{this}}</li>{{/each}}</ol></body></html>`,
  },
  {
    code: 'gtm_snapshot',
    version: 1,
    displayName: 'GTM Snapshot',
    description: 'Go-to-market plan: ICP, channels, motion, CAC.',
    creditCost: 5,
    pricingTier: 'paid',
    requiredKeys: ['gtm.icp', 'gtm.channel', 'gtm.cac'],
    handlebarsHtml: `<!doctype html><html><head><meta charset="utf-8"><title>GTM Snapshot</title></head>
<body><h1>{{ venture.name }} — GTM Snapshot</h1>
<h2>ICP</h2><p>{{ gtm.icp }}</p>
<h2>Channel</h2><p>{{ gtm.channel }}</p>
<h2>CAC</h2><p>{{ gtm.cac }}</p></body></html>`,
  },
  {
    code: 'risk_map',
    version: 1,
    displayName: 'Risk Map',
    description: '3x3 risk-impact matrix with mitigation actions.',
    creditCost: 5,
    pricingTier: 'paid',
    requiredKeys: ['risk.matrix'],
    handlebarsHtml: `<!doctype html><html><head><meta charset="utf-8"><title>Risk Map</title></head>
<body><h1>{{ venture.name }} — Risk Map</h1>
<table><thead><tr><th>Risk</th><th>Likelihood</th><th>Impact</th><th>Mitigation</th></tr></thead>
<tbody>{{#each risk.matrix}}<tr><td>{{ this.name }}</td><td>{{ this.likelihood }}</td><td>{{ this.impact }}</td><td>{{ this.mitigation }}</td></tr>{{/each}}</tbody></table></body></html>`,
  },
  {
    code: 'board_brief',
    version: 1,
    displayName: 'Board Brief',
    description: 'Quarterly board-ready 2-page brief.',
    creditCost: 8,
    pricingTier: 'premium',
    requiredKeys: ['narrative.summary', 'metrics.kpi', 'risk.top'],
    handlebarsHtml: `<!doctype html><html><head><meta charset="utf-8"><title>Board Brief</title></head>
<body><h1>{{ venture.name }} — Board Brief</h1>
<p>{{ narrative.summary }}</p>
<h2>KPIs</h2><ul>{{#each metrics.kpi}}<li>{{ this.label }}: {{ this.value }}</li>{{/each}}</ul>
<h2>Risks</h2><ol>{{#each risk.top}}<li>{{this}}</li>{{/each}}</ol></body></html>`,
  },
] as const;
