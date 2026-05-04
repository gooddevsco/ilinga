/* global React, I, useApp, REPORTS */
const { I, Icon, CLUSTERS, REPORTS, ACTIVITY, AppCtx, AppProvider, useApp } = window;
const { useState, useEffect, useMemo, useRef, createContext, useContext, Fragment } = React;

function Reports() {
  const { setActiveReport, setAppView, credits } = useApp();
  const [filter, setFilter] = React.useState('all');

  const TEMPLATES = [
    { id: 'mck', name: 'Consulting deliverable', sub: 'McKinsey‑ish · 2 col grid', system: true },
    { id: 'pitch', name: 'Pitch deck', sub: 'Slide‑per‑theme · 16:9', system: true },
    { id: 'editorial', name: 'Editorial brief', sub: 'Magazine layout · serif', system: true },
    { id: 'custom', name: 'Northwind house', sub: 'Uploaded · 2 weeks ago', system: false },
  ];

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <div>
          <div className="eyebrow">REPORTS · CYCLE 02</div>
          <h1
            style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', margin: '8px 0 0' }}
          >
            Render. Ship. Spend wisely.
          </h1>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {['all', 'free', 'pro', 'premium', 'rendered'].map((f) => (
            <button
              key={f}
              className="btn sm"
              onClick={() => setFilter(f)}
              style={{
                borderColor: filter === f ? 'var(--signal)' : 'var(--line)',
                background: filter === f ? 'var(--signal-soft)' : 'var(--bg-2)',
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <span style={{ fontWeight: 500 }}>Templates</span>
          <span
            className="mono"
            style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-faint)' }}
          >
            3 SYSTEM · 1 CUSTOM
          </span>
          <button className="btn sm" style={{ marginLeft: 12 }}>
            {I.upload} Upload
          </button>
        </div>
        <div
          className="r-cards-4"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}
        >
          {TEMPLATES.map((t, i) => (
            <div
              key={t.id}
              style={{ padding: 18, borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}
            >
              <div className="placeholder" style={{ height: 90, marginBottom: 12 }}>
                {t.name.toUpperCase()}
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</span>
                <span className="tag">{t.system ? 'SYSTEM' : 'CUSTOM'}</span>
              </div>
              <div
                className="mono"
                style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}
              >
                {t.sub.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reports grid */}
      <div
        className="r-cards-3"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
      >
        {window.REPORTS.map((r) => (
          <div
            key={r.id}
            className="card"
            style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {/* Preview */}
            <div style={{ position: 'relative', borderBottom: '1px solid var(--line)' }}>
              <div className="placeholder" style={{ height: 180, borderRadius: 0, border: 'none' }}>
                {r.name.toUpperCase()} · PREVIEW
              </div>
              {r.locked && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(31,27,22,0.55)',
                    backdropFilter: 'blur(2px)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ color: 'var(--signal)' }}>{I.lock}</span>
                    <span
                      className="mono"
                      style={{ fontSize: 11, color: 'var(--ink)', letterSpacing: '0.10em' }}
                    >
                      {r.cost} CR TO UNLOCK
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div
              style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className={`tag ${r.locked ? '' : 'signal'}`}>
                  {r.locked ? I.lock : <span className="dot" />} {r.tier}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                  {r.pages}P · HTML/PDF
                </span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em' }}>
                {r.name}
              </div>
              <div style={{ color: 'var(--ink-faint)', fontSize: 13, lineHeight: 1.5, flex: 1 }}>
                {r.desc}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                {r.locked ? (
                  <button
                    className="btn primary sm"
                    disabled={credits < r.cost}
                    onClick={() => {
                      setActiveReport(r.id);
                      setAppView('report-detail');
                    }}
                  >
                    {I.unlock} Render · {r.cost} cr
                  </button>
                ) : (
                  <button
                    className="btn sm"
                    onClick={() => {
                      setActiveReport(r.id);
                      setAppView('report-detail');
                    }}
                  >
                    Open {I.arrow}
                  </button>
                )}
                <button className="btn sm">{I.doc} Preview</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Report detail — paper view
function ReportDetail() {
  const { activeReport, setAppView, credits, setCredits, toast } = useApp();
  const r = window.REPORTS.find((x) => x.id === activeReport) || window.REPORTS[0];
  const [rendered, setRendered] = React.useState(!r.locked);
  const [rendering, setRendering] = React.useState(false);

  const render = () => {
    if (credits < r.cost) {
      toast('Top up — credits below cost');
      return;
    }
    setRendering(true);
    setTimeout(() => {
      setCredits(credits - r.cost);
      setRendering(false);
      setRendered(true);
      toast(`${r.name} rendered · ${r.cost} cr deducted`);
    }, 1600);
  };

  return (
    <div
      className="r-reports-detail"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        minHeight: '100%',
        maxHeight: 'calc(100vh - 53px)',
      }}
    >
      {/* Paper */}
      <main style={{ overflow: 'auto', background: '#1A1A1D', padding: 28 }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }} className="on-paper-scroll">
          <div
            className="card paper"
            style={{ padding: 0, overflow: 'hidden', position: 'relative' }}
          >
            {/* paper header */}
            <div style={{ padding: '36px 56px', borderBottom: '1px solid var(--line-paper)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--ink)' }}>{I.logo(20)}</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Ilinga</span>
                <span
                  className="mono"
                  style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-mute)' }}
                >
                  NORTHWIND CARGO · APR 2026 · CYCLE 02
                </span>
              </div>
              <div style={{ marginTop: 28 }}>
                <div className="eyebrow on-paper">
                  {r.tier.toUpperCase()} · {r.pages} PAGES
                </div>
                <h1
                  style={{
                    fontSize: 56,
                    lineHeight: 1.0,
                    letterSpacing: '-0.03em',
                    fontWeight: 500,
                    color: 'var(--ink)',
                    margin: '14px 0 12px',
                  }}
                >
                  {r.name}.
                </h1>
                <p
                  style={{
                    color: 'var(--ink-mute)',
                    fontSize: 16,
                    maxWidth: 560,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {r.desc}
                </p>
              </div>
            </div>

            {/* paper body — preview if locked */}
            {!rendered ? (
              <div
                style={{
                  padding: '56px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 20,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    border: '1.5px solid var(--ink)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--ink)',
                  }}
                >
                  {I.lock}
                </div>
                <div style={{ color: 'var(--ink)', fontSize: 22, fontWeight: 500 }}>
                  Render this report
                </div>
                <div
                  style={{
                    color: 'var(--ink-mute)',
                    fontSize: 14,
                    textAlign: 'center',
                    maxWidth: 420,
                    lineHeight: 1.5,
                  }}
                >
                  Costs{' '}
                  <span className="mono" style={{ color: 'var(--ink)' }}>
                    {r.cost} credits
                  </span>
                  . Includes editable HTML, print PDF, and prompt‑graph receipts. Re‑renders in this
                  cycle are free.
                </div>
                <button className="btn primary on-paper lg" onClick={render} disabled={rendering}>
                  {rendering ? (
                    'Rendering…'
                  ) : (
                    <>
                      Render report · {r.cost} cr {I.arrow}
                    </>
                  )}
                </button>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                  BALANCE AFTER · {credits - r.cost} CR
                </span>
              </div>
            ) : (
              <div
                style={{
                  padding: '40px 56px 56px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 28,
                }}
              >
                {/* TOC */}
                <div>
                  <div className="eyebrow on-paper">CONTENTS</div>
                  <ol
                    className="r-2col"
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '12px 0 0',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px 24px',
                    }}
                  >
                    {[
                      'Executive summary',
                      'Direct landscape',
                      'Indirect & substitutes',
                      'Pricing matrix',
                      'Narrative map',
                      'Defensibility',
                      'Risks',
                      'Appendix · sources',
                    ].map((s, i) => (
                      <li
                        key={s}
                        style={{
                          display: 'flex',
                          gap: 10,
                          color: 'var(--ink)',
                          fontSize: 14,
                          paddingBottom: 6,
                          borderBottom: '1px dashed var(--line-paper)',
                        }}
                      >
                        <span className="mono" style={{ color: 'var(--ink-mute)', width: 24 }}>
                          0{i + 1}
                        </span>
                        <span style={{ flex: 1 }}>{s}</span>
                        <span className="mono" style={{ color: 'var(--ink-mute)' }}>
                          {(i * 2 + 3).toString().padStart(2, '0')}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Section */}
                <div>
                  <div className="eyebrow on-paper">01 · EXECUTIVE SUMMARY</div>
                  <h2
                    style={{
                      fontSize: 30,
                      color: 'var(--ink)',
                      letterSpacing: '-0.02em',
                      fontWeight: 500,
                      margin: '10px 0 14px',
                      lineHeight: 1.15,
                    }}
                  >
                    Below 10 trucks, no software actually fits.
                  </h2>
                  <div
                    style={{
                      columnCount: 2,
                      columnGap: 28,
                      color: 'var(--ink)',
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    <p>
                      The fleet management category is structurally mis‑built for owner‑operators.
                      KeepTruckin and Samsara optimize for organizations with a dispatcher role;
                      below 10 trucks, that role doesn’t exist, and operators must impersonate it —
                      an estimated 11‑day setup tax.
                    </p>
                    <p>
                      Northwind&apos;s wedge collapses dispatch, IFTA, and DOT compliance into a
                      single mobile inbox. The parity matrix shows clear leadership in mobile UX (5
                      vs 3) and onboarding speed (5 vs 2), trailing only in support coverage where
                      incumbents have invested for a decade.
                    </p>
                  </div>
                </div>

                {/* Pull quote */}
                <div
                  style={{ padding: 28, borderLeft: '4px solid var(--ink)', background: '#F0F0EB' }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      lineHeight: 1.3,
                      letterSpacing: '-0.01em',
                      color: 'var(--ink)',
                    }}
                  >
                    &ldquo;Below 80, the workflow assumes a dispatcher exists — solo operators have
                    to fake one.&rdquo;
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 12 }}
                  >
                    FOUNDER INTERVIEW · Q3.4
                  </div>
                </div>

                {/* Parity matrix */}
                <div>
                  <div className="eyebrow on-paper">02 · PARITY MATRIX</div>
                  <table className="cmp paper" style={{ marginTop: 10 }}>
                    <thead>
                      <tr>
                        <th>Axis</th>
                        <th>Northwind</th>
                        <th>KeepTruckin</th>
                        <th>Samsara</th>
                        <th>Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Mobile UX', '5', '3', '2', 'Lead'],
                        ['Onboarding speed', '5', '2', '1', 'Lead'],
                        ['Pricing transparency', '4', '3', '2', 'Lead'],
                        ['IFTA automation', '4', '2', '1', 'Lead'],
                        ['Customer support', '3', '4', '5', 'Trail'],
                      ].map((row) => (
                        <tr key={row[0]}>
                          <td style={{ color: 'var(--ink)' }}>{row[0]}</td>
                          <td className="mono" style={{ color: 'var(--ink)' }}>
                            {row[1]}
                          </td>
                          <td className="mono" style={{ color: 'var(--ink-mute)' }}>
                            {row[2]}
                          </td>
                          <td className="mono" style={{ color: 'var(--ink-mute)' }}>
                            {row[3]}
                          </td>
                          <td
                            className="mono"
                            style={{
                              color: row[4] === 'Lead' ? 'var(--signal-ink)' : 'var(--ink-mute)',
                            }}
                          >
                            {row[4].toUpperCase()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="placeholder on-paper" style={{ height: 220 }}>
                  NARRATIVE MAP · 2D PERCEPTUAL CHART
                </div>

                <div
                  style={{
                    padding: 22,
                    border: '1px solid var(--line-paper)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      color: 'var(--ink-mute)',
                      letterSpacing: '0.10em',
                      minWidth: 100,
                    }}
                  >
                    NEXT
                  </span>
                  <div style={{ flex: 1, color: 'var(--ink)' }}>
                    Continue to <strong>03 · INDIRECT &amp; SUBSTITUTES</strong> — Excel + WhatsApp
                    combinations, broker tools, and owner‑operator forums.
                  </div>
                  <button className="btn on-paper">Read on {I.arrow}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right rail */}
      <aside style={{ borderLeft: '1px solid var(--line)', overflow: 'auto', padding: 18 }}>
        <button className="btn sm" onClick={() => setAppView('reports')}>
          {I.arrowLeft} All reports
        </button>
        <div style={{ marginTop: 18 }}>
          <div className="eyebrow">META</div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Meta k="STATUS" v={rendered ? 'Rendered' : 'Locked'} signal={rendered} />
            <Meta k="TEMPLATE" v="Consulting · McKinsey" />
            <Meta k="LENGTH" v={`${r.pages} pages`} />
            <Meta k="COST" v={r.cost === 0 ? 'Included' : `${r.cost} cr`} />
            <Meta k="LAST RENDERED" v={rendered ? '2 minutes ago' : '—'} />
          </div>
        </div>
        {rendered && (
          <>
            <div className="divider" style={{ margin: '20px 0' }} />
            <div className="eyebrow">EXPORT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              <button className="btn sm">{I.download} Download PDF</button>
              <button className="btn sm">{I.doc} Copy HTML link</button>
              <button className="btn sm">{I.external} Share read‑only</button>
            </div>
          </>
        )}
        <div className="divider" style={{ margin: '20px 0' }} />
        <div className="eyebrow">PROMPT GRAPH</div>
        <div
          style={{
            marginTop: 10,
            padding: 12,
            background: 'var(--bg-2)',
            borderRadius: 6,
            fontSize: 11,
            fontFamily: 'var(--mono)',
            color: 'var(--ink-faint)',
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: 'var(--signal)' }}>v2026.04 · competitive</span>
          <br />→ fill {`{{competitor.lead}}`}
          <br />→ fill {`{{incumbent.gap}}`}
          <br />→ fill {`{{parity.matrix}}`}
          <br />
          → render template · mck
          <br />→ emit · html · pdf
        </div>
      </aside>
    </div>
  );
}

function Meta({ k, v, signal }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        borderBottom: '1px dashed var(--line)',
      }}
    >
      <span
        className="mono"
        style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.10em' }}
      >
        {k}
      </span>
      <span
        className="mono"
        style={{ fontSize: 11, color: signal ? 'var(--signal)' : 'var(--paper)' }}
      >
        {v.toString().toUpperCase()}
      </span>
    </div>
  );
}

window.Reports = Reports;
window.ReportDetail = ReportDetail;
Object.assign(window, { Reports, ReportDetail });
