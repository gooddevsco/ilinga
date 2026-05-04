import { Link } from 'react-router-dom';
import { Button, Card, Eyebrow, IconLogo, Icons, Kbd, Tag } from '@ilinga/ui';

const proofLogos = [
  'NORTHWIND',
  'HALCYON LABS',
  'FIELDPOINT',
  'UMBRA / OS',
  'PRIMER & CO.',
  'RIVERSTONE',
];

const loopSteps = [
  {
    n: '01',
    title: 'Brief',
    body: 'Drop a paragraph. Optional: competitor URLs. We let AI infer the industry — or pick yourself.',
  },
  {
    n: '02',
    title: 'Interview',
    body: "Structured Q&A across 8 design clusters. Skip what doesn't apply, expand what matters.",
  },
  {
    n: '03',
    title: 'Synthesise',
    body: 'n8n agent fans out, fills your prompt graph, writes module outputs you can review and edit.',
  },
  {
    n: '04',
    title: 'Report',
    body: 'Pick a template (or upload yours). Render to hi-fi HTML or PDF. Pay only for what you ship.',
  },
];

const reportPreviews = [
  {
    name: 'Venture Snapshot',
    desc: 'One-page summary of positioning, market and risks.',
    cost: 0,
    pages: 4,
    locked: false,
    tier: 'Free',
  },
  {
    name: 'Market Deep-Dive',
    desc: 'TAM/SAM/SOM, segmentation, growth vectors, geographic heatmap.',
    cost: 40,
    pages: 22,
    locked: true,
    tier: 'Pro',
  },
  {
    name: 'Competitive Landscape',
    desc: 'Feature parity, pricing matrix, narrative map, defensibility.',
    cost: 35,
    pages: 18,
    locked: true,
    tier: 'Pro',
  },
];

const pricingTiers = [
  {
    code: 'solo',
    name: 'Solo',
    price: '$0',
    credits: '50',
    features: ['1 venture', 'Snapshot reports', 'Community templates'],
    recommended: false,
  },
  {
    code: 'studio',
    name: 'Studio',
    price: '$49',
    credits: '500',
    features: ['5 ventures', 'All Pro reports', 'Custom templates', 'Private AI endpoint'],
    recommended: true,
  },
  {
    code: 'firm',
    name: 'Firm',
    price: '$149',
    credits: '1,800',
    features: ['Unlimited ventures', 'All Premium reports', 'Tenant-level theming', 'Audit log'],
    recommended: false,
  },
  {
    code: 'byo',
    name: 'Bring-your-own',
    price: '$—',
    credits: 'Variable',
    features: ['Use your AI keys', 'Costed at compute', 'Volume pricing', 'SLA'],
    recommended: false,
  },
] as const;

const heroClusters = [
  { num: '01', label: 'Positioning', done: 6, qs: 6, p: 100 },
  { num: '02', label: 'Market & TAM', done: 8, qs: 8, p: 100 },
  { num: '03', label: 'Competition', done: 5, qs: 7, p: 71, active: true },
  { num: '04', label: 'Go-to-Market', done: 0, qs: 9, p: 0 },
  { num: '05', label: 'Product Strategy', done: 0, qs: 7, p: 0 },
  { num: '06', label: 'Unit Economics', done: 0, qs: 6, p: 0 },
];

const HeroArtifact = (): JSX.Element => (
  <Card className="overflow-hidden" style={{ minHeight: 360 }}>
    <div className="grid" style={{ gridTemplateColumns: '260px 1fr 320px', minHeight: 360 }}>
      {/* Cluster progress map */}
      <div className="border-r border-[color:var(--line)] p-4">
        <Eyebrow>Clusters · 8</Eyebrow>
        <div className="mt-3 flex flex-col gap-1">
          {heroClusters.map((c) => (
            <div
              key={c.num}
              className={`cluster-row${c.active ? ' active' : ''}${c.p === 100 ? ' done' : ''}`}
            >
              <span className="num">{c.num}</span>
              <span className="ring" style={{ ['--p' as never]: c.p } as React.CSSProperties} />
              <span className="flex-1 text-[12px]">{c.label}</span>
              <span
                className="mono text-[11px]"
                style={{ color: c.p === 100 ? 'var(--signal)' : 'var(--ink-faint)' }}
              >
                {c.done}/{c.qs}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Active question */}
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2.5">
          <Tag tone="signal" dot>
            03 · COMPETITION
          </Tag>
          <span className="mono text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
            QUESTION 4 / 7
          </span>
          <span className="ml-auto">
            <Kbd>⌘ ↵ NEXT</Kbd>
          </span>
        </div>
        <h3
          className="text-[26px]"
          style={{ fontWeight: 500, lineHeight: 1.25, letterSpacing: '-0.01em' }}
        >
          Where does the leading incumbent break for your wedge user?
        </h3>
        <p className="text-[14px] text-[color:var(--ink-mute)]">
          Be specific. We&apos;ll cite this verbatim in the Competitive Landscape report.
        </p>
        <textarea
          className="textarea"
          rows={3}
          defaultValue="They built for fleet ops at >500 vehicles. Below 80, the workflow assumes a dispatcher exists — solo owner-operators have to fake one. Onboarding takes 11 days."
        />
        <div className="mt-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" type="button">
            Skip
          </Button>
          <Button variant="secondary" size="sm" type="button">
            Save draft
          </Button>
          <span className="flex-1" />
          <Button variant="primary" size="sm" type="button">
            Next <Icons.arrow />
          </Button>
        </div>
      </div>
      {/* Agent stream */}
      <div
        className="border-l border-[color:var(--line)] p-4"
        style={{ background: 'var(--bg-1)' }}
      >
        <Eyebrow>Agent · n8n</Eyebrow>
        <div className="mt-3 flex flex-col">
          {[
            ['now', 'Inferred persona: solo owner-operator (1–3 trucks).'],
            ['12s', 'Generated follow-up: pricing sensitivity at <$80/mo.'],
            ['34s', 'Cluster Market & TAM marked complete.'],
            ['1m', 'Pulled 6 competitor data points from supplied URLs.'],
          ].map(([t, msg]) => (
            <div
              key={t}
              className="border-b border-dashed py-2.5 last:border-b-0"
              style={{ borderColor: 'var(--line)' }}
            >
              <span className="mono text-[11px] uppercase text-[color:var(--ink-faint)]">{t}</span>
              <span className="ml-2 text-[12px] text-[color:var(--ink)]">{msg}</span>
            </div>
          ))}
        </div>
        <Card className="mt-4 p-3" style={{ background: 'var(--bg-2)' }}>
          <Eyebrow style={{ color: 'var(--signal)' }}>Next report · Competitive</Eyebrow>
          <p className="mt-1 text-[12px] text-[color:var(--ink)]">
            Estimated cost <span className="mono">35 CR</span> · 18 pages
          </p>
        </Card>
      </div>
    </div>
  </Card>
);

export const Home = (): JSX.Element => (
  <div>
    {/* Hero */}
    <section
      className="relative border-b border-[color:var(--line)]"
      style={{ padding: '92px 28px 80px' }}
    >
      <div
        className="grid-bg pointer-events-none absolute inset-0"
        style={{
          opacity: 0.35,
          maskImage: 'linear-gradient(180deg, black 30%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, black 30%, transparent 100%)',
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto" style={{ maxWidth: 1280 }}>
        <Tag tone="signal" dot>
          n8n-powered research agent · live
        </Tag>
        <h1
          className="r-h-display mt-7"
          style={{
            fontSize: 'clamp(48px, 6vw, 84px)',
            lineHeight: 1.0,
            letterSpacing: '-0.035em',
            fontWeight: 500,
            maxWidth: 1100,
          }}
        >
          Pressure-test a business
          <br />
          <span className="serif italic" style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>
            in the time it takes to write a brief.
          </span>
        </h1>
        <p
          className="mt-7 text-[18px] text-[color:var(--ink-mute)]"
          style={{ maxWidth: 620, lineHeight: 1.5 }}
        >
          Drop in a paragraph and a few competitor links. Ilinga interviews you with structured
          questions, then ships a hi-fi, source-ready report — billed by the credit, opinionated by
          design.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link to="/sign-up">
            <Button variant="primary" size="lg" type="button">
              Start your first venture <Icons.arrow />
            </Button>
          </Link>
          <Link to="/help">
            <Button variant="secondary" size="lg" type="button">
              See it working <Icons.external />
            </Button>
          </Link>
          <span className="mono text-[12px] text-[color:var(--ink-faint)]">
            50 credits free · no card
          </span>
        </div>
        <div className="mt-16">
          <HeroArtifact />
        </div>
      </div>
    </section>

    {/* Logos / proof */}
    <section className="border-b border-[color:var(--line)]" style={{ padding: '22px 28px' }}>
      <div className="mx-auto flex flex-wrap items-center gap-7" style={{ maxWidth: 1280 }}>
        <Eyebrow>Trusted by builders at</Eyebrow>
        <div className="flex flex-wrap gap-7">
          {proofLogos.map((logo) => (
            <span
              key={logo}
              className="mono text-[13px] uppercase tracking-[0.02em] text-[color:var(--ink-faint)]"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>

    {/* The loop */}
    <section className="border-b border-[color:var(--line)]" style={{ padding: '80px 28px' }}>
      <div
        className="r-2col mx-auto grid gap-14"
        style={{ maxWidth: 1280, gridTemplateColumns: '1fr 2fr' }}
      >
        <div>
          <Eyebrow>01 · The loop</Eyebrow>
          <h2
            className="r-h-1 mt-3"
            style={{
              fontSize: 42,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              fontWeight: 500,
            }}
          >
            Four steps. No deck-making. No hand-waving.
          </h2>
          <p className="mt-5 text-[15px] text-[color:var(--ink-mute)]" style={{ maxWidth: 380 }}>
            Each cluster fans out into modules. The agent reads your answers, fills the prompt
            graph, and renders a final HTML-to-PDF report that actually looks like consulting work.
          </p>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {loopSteps.map((s) => (
            <Card key={s.n} className="p-5">
              <div className="mono text-[11px]" style={{ color: 'var(--signal)' }}>
                {s.n}
              </div>
              <div className="mt-2.5 text-[16px]" style={{ fontWeight: 500 }}>
                {s.title}
              </div>
              <p className="mt-2 text-[13px] text-[color:var(--ink-mute)]">{s.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* Reports preview */}
    <section className="border-b border-[color:var(--line)]" style={{ padding: '80px 28px' }}>
      <div className="mx-auto" style={{ maxWidth: 1280 }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>02 · Reports</Eyebrow>
            <h2
              className="r-h-1 mt-3"
              style={{
                fontSize: 42,
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                fontWeight: 500,
              }}
            >
              Free where it counts.
              <br />
              <span style={{ color: 'var(--ink-faint)' }}>Paid where it matters.</span>
            </h2>
          </div>
          <Eyebrow>credits = USD ÷ 100 · rollover on annual</Eyebrow>
        </div>
        <div
          className="r-cards-3 mt-9 grid gap-4"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
        >
          {reportPreviews.map((r) => (
            <Card key={r.name} className="p-5">
              <div className="flex items-center justify-between">
                <Tag tone={r.locked ? 'neutral' : 'signal'}>
                  {r.locked && <Icons.lock />} {r.tier}
                </Tag>
                <span className="mono text-[11px] text-[color:var(--ink-faint)]">
                  {r.cost === 0 ? 'INCLUDED' : `${r.cost} CR`}
                </span>
              </div>
              <div className="mt-3 text-[18px]" style={{ fontWeight: 500 }}>
                {r.name}
              </div>
              <p
                className="mt-2 text-[13px] text-[color:var(--ink-mute)]"
                style={{ minHeight: 60 }}
              >
                {r.desc}
              </p>
              <div className="mt-4 mono text-[11px] text-[color:var(--ink-faint)]">
                ~{r.pages} pages · HTML / PDF
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing strip */}
    <section className="border-b border-[color:var(--line)]" style={{ padding: '80px 28px' }}>
      <div className="mx-auto" style={{ maxWidth: 1280 }}>
        <Eyebrow>03 · Pricing</Eyebrow>
        <h2
          className="r-h-1 mt-3"
          style={{
            fontSize: 42,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            fontWeight: 500,
          }}
        >
          One workspace. Four ways to pay.
        </h2>
        <div
          className="r-pricing-grid mt-9 grid border border-[color:var(--line)]"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          {pricingTiers.map((tier, i) => (
            <div
              key={tier.code}
              className="relative p-7"
              style={{
                background: tier.recommended ? 'var(--bg-1)' : 'transparent',
                borderRight: i < pricingTiers.length - 1 ? '1px solid var(--line)' : undefined,
              }}
            >
              {tier.recommended && (
                <span
                  className="mono absolute right-3 top-3 text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: 'var(--signal)' }}
                >
                  RECOMMENDED
                </span>
              )}
              <div className="text-[18px]" style={{ fontWeight: 500 }}>
                {tier.name}
              </div>
              <div className="mt-1.5 text-[28px] mono">{tier.price}</div>
              <div className="mt-2 mono text-[11px]" style={{ color: 'var(--signal)' }}>
                {tier.credits === 'Variable'
                  ? 'VARIABLE CREDITS'
                  : `${tier.credits} CREDITS / MONTH`}
              </div>
              <ul className="mt-5 space-y-2 text-[13px]">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span style={{ color: 'var(--signal)' }} aria-hidden="true">
                      <Icons.check />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/sign-up" className="mt-5 inline-flex">
                <Button
                  variant={tier.recommended ? 'primary' : 'secondary'}
                  size="sm"
                  type="button"
                >
                  Choose {tier.name}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="px-7 py-7" style={{ background: 'var(--bg)' }}>
      <div
        className="mx-auto flex flex-wrap items-center justify-between gap-4"
        style={{ maxWidth: 1280 }}
      >
        <div className="flex items-center gap-2.5">
          <span style={{ color: 'var(--signal)' }}>
            <IconLogo size={18} />
          </span>
          <span className="mono text-[12px] uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">
            ILINGA · ©2026
          </span>
        </div>
        <div className="mono flex flex-wrap gap-5 text-[12px] uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">
          <Link to="/legal/security" className="hover:text-[color:var(--ink)]">
            SECURITY
          </Link>
          <Link to="/status" className="hover:text-[color:var(--ink)]">
            STATUS · 99.97
          </Link>
          <Link to="/legal/terms" className="hover:text-[color:var(--ink)]">
            TERMS
          </Link>
          <Link to="/legal/privacy" className="hover:text-[color:var(--ink)]">
            PRIVACY
          </Link>
        </div>
      </div>
    </footer>
  </div>
);
