/* global React, I, useApp */
const { I, Icon, CLUSTERS, REPORTS, ACTIVITY, AppCtx, AppProvider, useApp } = window;
const { useState, useEffect, useMemo, useRef, createContext, useContext, Fragment } = React;

function Landing() {
  const { setRoute } = useApp();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      {/* Top bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(250,246,239,0.78)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '14px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <a
            onClick={() => setRoute('landing')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <span style={{ color: 'var(--signal)' }}>{I.logo(20)}</span>
            <span style={{ fontWeight: 600, letterSpacing: '-0.01em', fontSize: 15 }}>Ilinga</span>
            <span className="tag" style={{ marginLeft: 4 }}>
              v0.9 · beta
            </span>
          </a>
          <nav
            className="r-mobile-hide"
            style={{
              display: 'flex',
              gap: 22,
              marginLeft: 28,
              fontSize: 13,
              color: 'var(--ink-faint)',
            }}
          >
            <a style={{ cursor: 'pointer' }}>Product</a>
            <a style={{ cursor: 'pointer' }}>Reports</a>
            <a style={{ cursor: 'pointer' }}>Pricing</a>
            <a style={{ cursor: 'pointer' }}>Changelog</a>
            <a style={{ cursor: 'pointer' }}>Docs</a>
          </nav>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn ghost sm" onClick={() => setRoute('signin')}>
              Sign in
            </button>
            <button className="btn primary sm" onClick={() => setRoute('signup')}>
              Start a venture {I.arrow}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        style={{ borderBottom: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}
      >
        <div
          className="grid-bg"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.35,
            maskImage: 'linear-gradient(180deg, black 30%, transparent 100%)',
          }}
        />
        <div
          className="r-pad-xl"
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '92px 28px 80px',
            position: 'relative',
          }}
        >
          <div className="tag" style={{ marginBottom: 28 }}>
            <span className="dot" style={{ background: 'var(--signal)' }} />
            n8n‑powered research agent · live
          </div>
          <h1
            style={{
              fontSize: 'clamp(48px, 6vw, 84px)',
              lineHeight: 1.0,
              letterSpacing: '-0.035em',
              fontWeight: 500,
              margin: 0,
              maxWidth: 1100,
            }}
          >
            Pressure‑test a business
            <br />
            <span
              style={{
                color: 'var(--ink-mute)',
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontWeight: 400,
              }}
            >
              in the time it takes to write a brief.
            </span>
          </h1>
          <p
            style={{
              fontSize: 18,
              color: 'var(--ink-faint)',
              maxWidth: 620,
              marginTop: 28,
              lineHeight: 1.5,
            }}
          >
            Drop in a paragraph and a few competitor links. Ilinga interviews you with structured
            questions, then ships a hi‑fi, source‑ready report — billed by the credit, opinionated
            by design.
          </p>
          <div
            style={{
              marginTop: 36,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button className="btn primary lg" onClick={() => setRoute('signup')}>
              Start your first venture {I.arrow}
            </button>
            <button className="btn lg" onClick={() => setRoute('app')}>
              See it working {I.external}
            </button>
            <span
              className="mono"
              style={{ fontSize: 12, color: 'var(--ink-faint)', marginLeft: 8 }}
            >
              50 credits free · no card
            </span>
          </div>

          {/* Hero artifact */}
          <div style={{ marginTop: 64 }}>
            <HeroArtifact />
          </div>
        </div>
      </section>

      {/* Logos / proof strip */}
      <section style={{ borderBottom: '1px solid var(--line)', padding: '22px 28px' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            flexWrap: 'wrap',
          }}
        >
          <span className="eyebrow">Trusted by builders at</span>
          <div
            style={{
              display: 'flex',
              gap: 36,
              alignItems: 'center',
              flexWrap: 'wrap',
              color: 'var(--ink-faint)',
              fontFamily: 'var(--mono)',
              fontSize: 13,
              letterSpacing: '0.02em',
            }}
          >
            <span>NORTHWIND</span>
            <span>HALCYON LABS</span>
            <span>FIELDPOINT</span>
            <span>UMBRA / OS</span>
            <span>PRIMER &amp; CO.</span>
            <span>RIVERSTONE</span>
          </div>
        </div>
      </section>

      {/* The loop */}
      <section style={{ borderBottom: '1px solid var(--line)' }}>
        <div
          className="r-pad-xl"
          style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 28px' }}
        >
          <div
            className="r-2col"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr',
              gap: 56,
              alignItems: 'start',
            }}
          >
            <div>
              <div className="eyebrow">01 · The loop</div>
              <h2
                style={{
                  fontSize: 42,
                  lineHeight: 1.05,
                  letterSpacing: '-0.025em',
                  fontWeight: 500,
                  margin: '12px 0 18px',
                }}
              >
                Four steps. No deck‑making. No hand‑waving.
              </h2>
              <p
                style={{ color: 'var(--ink-faint)', fontSize: 15, lineHeight: 1.6, maxWidth: 380 }}
              >
                Each cluster fans out into modules. The agent reads your answers, fills the prompt
                graph, and renders a final HTML‑to‑PDF report that actually looks like consulting
                work.
              </p>
            </div>
            <div
              className="r-2col"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            >
              {[
                {
                  n: '01',
                  t: 'Brief',
                  d: 'Drop a paragraph. Optional: competitor URLs. We let AI infer the industry — or pick yourself.',
                },
                {
                  n: '02',
                  t: 'Interview',
                  d: "Structured Q&A across 8 design clusters. Skip what doesn't apply, expand what matters.",
                },
                {
                  n: '03',
                  t: 'Synthesise',
                  d: 'n8n agent fans out, fills your prompt graph, writes module outputs you can review and edit.',
                },
                {
                  n: '04',
                  t: 'Report',
                  d: 'Pick a template (or upload yours). Render to hi‑fi HTML or PDF. Pay only for what you ship.',
                },
              ].map((s) => (
                <div key={s.n} className="card" style={{ padding: 22 }}>
                  <div
                    className="mono"
                    style={{ fontSize: 11, color: 'var(--signal)', letterSpacing: '0.10em' }}
                  >
                    {s.n}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 500,
                      marginTop: 10,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {s.t}
                  </div>
                  <div
                    style={{
                      color: 'var(--ink-faint)',
                      fontSize: 13,
                      lineHeight: 1.55,
                      marginTop: 8,
                    }}
                  >
                    {s.d}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Reports preview */}
      <section style={{ borderBottom: '1px solid var(--line)' }}>
        <div
          className="r-pad-xl"
          style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 28px' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'end',
              justifyContent: 'space-between',
              marginBottom: 28,
            }}
          >
            <div>
              <div className="eyebrow">02 · Reports</div>
              <h2
                style={{
                  fontSize: 42,
                  lineHeight: 1.05,
                  letterSpacing: '-0.025em',
                  fontWeight: 500,
                  margin: '12px 0 0',
                }}
              >
                Free where it counts.
                <br />
                <span style={{ color: 'var(--ink-faint)' }}>Paid where it matters.</span>
              </h2>
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
              CREDITS = USD ÷ 100 · ROLLOVER ON ANNUAL
            </div>
          </div>
          <div
            className="r-cards-3"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
          >
            {window.REPORTS.slice(0, 6).map((r) => (
              <div
                key={r.id}
                className="card"
                style={{ padding: 20, position: 'relative', overflow: 'hidden' }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}
                >
                  <span className={`tag ${r.locked ? '' : 'signal'}`}>
                    {r.locked ? <>{I.lock}</> : <span className="dot" />} {r.tier}
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                    {r.cost === 0 ? 'INCLUDED' : `${r.cost} CR`}
                  </span>
                </div>
                <div
                  style={{ fontSize: 18, fontWeight: 500, marginTop: 14, letterSpacing: '-0.01em' }}
                >
                  {r.name}
                </div>
                <div
                  style={{
                    color: 'var(--ink-faint)',
                    fontSize: 13,
                    lineHeight: 1.55,
                    marginTop: 6,
                    minHeight: 60,
                  }}
                >
                  {r.desc}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 14 }}
                >
                  ~{r.pages} PAGES · HTML / PDF
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing strip */}
      <section style={{ borderBottom: '1px solid var(--line)' }}>
        <div
          className="r-pad-xl"
          style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 28px' }}
        >
          <div
            className="r-pricing-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}
          >
            {[
              {
                name: 'Solo',
                price: '0',
                credits: '50',
                f: ['1 venture', 'Snapshot reports', 'Community templates'],
              },
              {
                name: 'Studio',
                price: '49',
                credits: '500',
                f: ['5 ventures', 'All Pro reports', 'Custom templates', 'Private AI endpoint'],
                highlight: true,
              },
              {
                name: 'Firm',
                price: '149',
                credits: '1,800',
                f: [
                  'Unlimited ventures',
                  'All Premium reports',
                  'Tenant‑level theming',
                  'Audit log',
                ],
              },
              {
                name: 'Bring‑your‑own',
                price: '—',
                credits: 'Variable',
                f: ['Use your AI keys', 'Costed at compute', 'Volume pricing', 'SLA'],
              },
            ].map((p) => (
              <div
                key={p.name}
                style={{
                  padding: 28,
                  borderRight: '1px solid var(--line)',
                  position: 'relative',
                  background: p.highlight ? 'var(--bg-1)' : 'transparent',
                }}
              >
                {p.highlight && (
                  <div
                    className="mono"
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      fontSize: 10,
                      color: 'var(--signal)',
                      letterSpacing: '0.10em',
                    }}
                  >
                    RECOMMENDED
                  </div>
                )}
                <div className="eyebrow">{p.name}</div>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 42, fontWeight: 500, letterSpacing: '-0.02em' }}>
                    ${p.price}
                  </span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                    /MO
                  </span>
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 12, color: 'var(--signal)', marginTop: 4 }}
                >
                  {p.credits} CREDITS / MONTH
                </div>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '20px 0 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {p.f.map((x, i) => (
                    <li
                      key={i}
                      style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--ink-2)' }}
                    >
                      <span style={{ color: 'var(--signal)' }}>{I.check}</span>
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '28px' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'var(--ink-faint)',
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ color: 'var(--signal)' }}>{I.logo(14)}</span>
            <span className="mono">ILINGA · ©2026</span>
          </div>
          <div style={{ display: 'flex', gap: 22 }} className="mono">
            <a>SECURITY</a>
            <a>STATUS · 99.97</a>
            <a>TERMS</a>
            <a>PRIVACY</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroArtifact() {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      <div
        className="r-hero-artifact"
        style={{ display: 'grid', gridTemplateColumns: '260px 1fr 320px', minHeight: 360 }}
      >
        {/* progress map */}
        <div style={{ borderRight: '1px solid var(--line)', padding: 18 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Clusters · 8
          </div>
          {window.CLUSTERS.slice(0, 6).map((c, i) => (
            <div
              key={c.id}
              className={`cluster-row ${i === 2 ? 'active' : i < 2 ? 'done' : ''}`}
              style={{ '--p': i < 2 ? 100 : i === 2 ? 70 : 0 }}
            >
              <span className="num">0{i + 1}</span>
              <span className="ring" style={{ '--p': i < 2 ? 100 : i === 2 ? 70 : 0 }} />
              <span style={{ fontSize: 13, flex: 1 }}>{c.label}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                {c.done}/{c.qs}
              </span>
            </div>
          ))}
        </div>

        {/* active question */}
        <div
          style={{
            padding: 28,
            borderRight: '1px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="tag signal">
              <span className="dot" /> 03 · COMPETITION
            </span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              QUESTION 4 / 7
            </span>
            <span className="kbd" style={{ marginLeft: 'auto' }}>
              ⌘ ↵ NEXT
            </span>
          </div>
          <h3
            style={{
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: '-0.015em',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            Where does the leading incumbent break for your wedge user?
          </h3>
          <p style={{ color: 'var(--ink-faint)', margin: 0, fontSize: 14 }}>
            Be specific. We&rsquo;ll cite this verbatim in the Competitive Landscape report.
          </p>
          <textarea
            className="textarea"
            style={{ minHeight: 120 }}
            defaultValue="They built for fleet ops at &gt;500 vehicles. Below 80, the workflow assumes a dispatcher exists — solo owner‑operators have to fake one. Onboarding takes 11 days."
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            <button className="btn sm">Skip</button>
            <button className="btn sm">Save draft</button>
            <div style={{ flex: 1 }} />
            <button className="btn primary sm">Next {I.arrow}</button>
          </div>
        </div>

        {/* agent stream */}
        <div style={{ padding: 18, background: 'var(--bg-1)' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Agent · n8n
          </div>
          {[
            { t: 'now', s: 'Inferred persona: solo owner‑operator (1–3 trucks).' },
            { t: '12s', s: 'Generated follow‑up: pricing sensitivity at <$80/mo.' },
            { t: '34s', s: 'Cluster Market & TAM marked complete.' },
            { t: '1m', s: 'Pulled 6 competitor data points from supplied URLs.' },
          ].map((e, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px dashed var(--line)',
              }}
            >
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', width: 36 }}>
                {e.t}
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>{e.s}</span>
            </div>
          ))}
          <div
            style={{
              marginTop: 14,
              padding: 12,
              border: '1px solid var(--line-2)',
              borderRadius: 6,
              background: 'var(--bg-2)',
            }}
          >
            <div className="mono" style={{ fontSize: 11, color: 'var(--signal)', marginBottom: 6 }}>
              NEXT REPORT · COMPETITIVE
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
              Estimated cost{' '}
              <span className="mono" style={{ color: 'var(--ink)' }}>
                35 CR
              </span>{' '}
              · 18 pages
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Landing = Landing;
Object.assign(window, { Landing });
