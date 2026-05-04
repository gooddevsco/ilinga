import { Link } from 'react-router-dom';
import { Button, Card, Eyebrow, Icons, Tag } from '@ilinga/ui';

const templates = [
  {
    code: 'investor_pulse',
    name: 'Investor Pulse',
    desc: 'One-pager investor narrative with traction signal and risks.',
    pages: 4,
    cost: 0,
    tier: 'Free',
    locked: false,
  },
  {
    code: 'market_deep_dive',
    name: 'Market Deep-Dive',
    desc: 'TAM/SAM/SOM, segmentation, growth vectors, geographic heatmap.',
    pages: 22,
    cost: 40,
    tier: 'Pro',
    locked: true,
  },
  {
    code: 'competitive_landscape',
    name: 'Competitive Landscape',
    desc: 'Feature parity, pricing matrix, narrative map, defensibility.',
    pages: 18,
    cost: 35,
    tier: 'Pro',
    locked: true,
  },
  {
    code: 'gtm_playbook',
    name: 'GTM Playbook',
    desc: 'Channel mix, ICP, funnel maths, messaging hierarchy.',
    pages: 28,
    cost: 60,
    tier: 'Pro',
    locked: true,
  },
  {
    code: 'investor_memo',
    name: 'Investor Memo',
    desc: 'Narrative + financials, risks, asks. Editor-tuned tone.',
    pages: 14,
    cost: 90,
    tier: 'Premium',
    locked: true,
  },
  {
    code: 'unit_economics',
    name: 'Unit Economics Model',
    desc: 'CAC/LTV scenarios, payback curves, sensitivity grid.',
    pages: 12,
    cost: 75,
    tier: 'Premium',
    locked: true,
  },
];

const filters = ['ALL', 'FREE', 'PRO', 'PREMIUM'];

export const Reports = (): JSX.Element => (
  <div className="flex flex-col gap-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <Eyebrow>Reports</Eyebrow>
        <h1
          className="serif mt-1 text-[28px] tracking-tight"
          style={{ fontWeight: 500, letterSpacing: '-0.02em' }}
        >
          Source-ready, render on demand.
        </h1>
        <p className="mt-1.5 text-[13px] text-[color:var(--ink-mute)]" style={{ maxWidth: 560 }}>
          Pick a venture cycle to render against. Free templates are included with every workspace.
          Pro and Premium templates spend credits per render.
        </p>
      </div>
      <Link to="/ventures">
        <Button variant="primary" type="button">
          Pick a venture <Icons.arrow />
        </Button>
      </Link>
    </header>

    <div className="r-nav-row flex flex-wrap items-center gap-2">
      <Eyebrow>Filter</Eyebrow>
      {filters.map((f, i) => (
        <button
          key={f}
          type="button"
          className="btn sm"
          aria-pressed={i === 0}
          style={
            i === 0
              ? {
                  borderColor: 'var(--signal)',
                  background: 'var(--signal-soft)',
                  color: 'var(--signal)',
                }
              : undefined
          }
        >
          {f}
        </button>
      ))}
    </div>

    <section className="r-cards-3 grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
      {templates.map((t) => (
        <Card key={t.code} className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <Tag tone={t.locked ? 'neutral' : 'signal'}>
              {t.locked && <Icons.lock />} {t.tier}
            </Tag>
            <span
              className="mono text-[11px]"
              style={{
                color: t.cost === 0 ? 'var(--signal)' : 'var(--ink-faint)',
              }}
            >
              {t.cost === 0 ? 'INCLUDED' : `${t.cost} CR`}
            </span>
          </div>
          <div className="text-[16px]" style={{ fontWeight: 500 }}>
            {t.name}
          </div>
          <p className="text-[12px] text-[color:var(--ink-mute)]" style={{ minHeight: 60 }}>
            {t.desc}
          </p>
          <div className="mono mt-auto text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
            ~{t.pages} PAGES · HTML / PDF
          </div>
          <Link to="/ventures">
            <Button
              variant={t.locked ? 'secondary' : 'primary'}
              size="sm"
              type="button"
              className="w-full"
            >
              {t.locked ? `Render · ${t.cost} CR` : 'Render free'}
            </Button>
          </Link>
        </Card>
      ))}
    </section>
  </div>
);
