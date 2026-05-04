/* global React, I, useApp, REPORTS */
const { I, Icon, CLUSTERS, REPORTS, ACTIVITY, AppCtx, AppProvider, useApp } = window;
const { useState, useEffect, useMemo, useRef, createContext, useContext, Fragment } = React;

function Outputs() {
  const { setAppView, setActiveReport } = useApp();
  const [activeMod, setActiveMod] = React.useState('competition.direct');

  const MODULES = [
    {
      id: 'positioning.audience',
      cluster: 'Positioning',
      name: 'Audience',
      state: 'ready',
      q: 6,
      conf: 92,
    },
    {
      id: 'positioning.promise',
      cluster: 'Positioning',
      name: 'Promise',
      state: 'ready',
      q: 4,
      conf: 88,
    },
    {
      id: 'positioning.proof',
      cluster: 'Positioning',
      name: 'Proof',
      state: 'ready',
      q: 3,
      conf: 81,
    },
    {
      id: 'market.sizing',
      cluster: 'Market & TAM',
      name: 'Sizing',
      state: 'ready',
      q: 5,
      conf: 76,
    },
    {
      id: 'market.segments',
      cluster: 'Market & TAM',
      name: 'Segments',
      state: 'ready',
      q: 4,
      conf: 84,
    },
    {
      id: 'market.geo',
      cluster: 'Market & TAM',
      name: 'Geography',
      state: 'ready',
      q: 3,
      conf: 79,
    },
    {
      id: 'competition.direct',
      cluster: 'Competition',
      name: 'Direct',
      state: 'ready',
      q: 4,
      conf: 90,
    },
    {
      id: 'competition.indirect',
      cluster: 'Competition',
      name: 'Indirect',
      state: 'partial',
      q: 2,
      conf: 58,
    },
    {
      id: 'competition.subs',
      cluster: 'Competition',
      name: 'Substitutes',
      state: 'pending',
      q: 0,
      conf: 0,
    },
    { id: 'gtm.channels', cluster: 'GTM', name: 'Channels', state: 'pending', q: 0, conf: 0 },
  ];

  return (
    <div
      className="r-outputs-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        minHeight: '100%',
        maxHeight: 'calc(100vh - 53px)',
      }}
    >
      {/* Module list */}
      <aside style={{ borderRight: '1px solid var(--line)', overflow: 'auto', padding: 14 }}>
        <div className="eyebrow" style={{ padding: '4px 6px' }}>
          MODULES · 24
        </div>
        <div style={{ marginTop: 6 }}>
          {MODULES.map((m) => {
            const on = m.id === activeMod;
            return (
              <div
                key={m.id}
                onClick={() => setActiveMod(m.id)}
                style={{
                  padding: 10,
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: on ? 'var(--bg-2)' : 'transparent',
                  border: `1px solid ${on ? 'var(--line-2)' : 'transparent'}`,
                  marginBottom: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background:
                        m.state === 'ready'
                          ? 'var(--signal)'
                          : m.state === 'partial'
                            ? 'var(--warn)'
                            : 'var(--ink-faint)',
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: on ? 500 : 400 }}>{m.name}</span>
                  <span
                    className="mono"
                    style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ink-faint)' }}
                  >
                    {m.state === 'ready'
                      ? `${m.conf}%`
                      : m.state === 'partial'
                        ? 'PARTIAL'
                        : 'PENDING'}
                  </span>
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 4, paddingLeft: 16 }}
                >
                  {m.cluster.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Module detail */}
      <main style={{ overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="tag signal">
            <span className="dot" /> COMPETITION
          </span>
          <span className="tag">DIRECT</span>
          <span className="tag">90% CONFIDENCE</span>
          <div style={{ flex: 1 }} />
          <button className="btn sm">Re‑synthesize · 8 cr</button>
          <button className="btn sm">Edit prompts</button>
          <button
            className="btn primary sm"
            onClick={() => {
              setActiveReport('competitive');
              setAppView('report-detail');
            }}
          >
            Use in report {I.arrow}
          </button>
        </div>

        <h1
          style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', margin: '20px 0 6px' }}
        >
          Direct competitor analysis
        </h1>
        <p style={{ color: 'var(--ink-faint)', margin: 0, maxWidth: 720 }}>
          Synthesized from 4 answers + 3 competitor URLs. Numeric scores are normalized; narrative
          quotes are verbatim from your interview.
        </p>

        {/* synthesized panels */}
        <div
          className="r-2col"
          style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginTop: 28 }}
        >
          <div className="card" style={{ padding: 22 }}>
            <div className="eyebrow">NARRATIVE</div>
            <p style={{ fontSize: 15, lineHeight: 1.6, marginTop: 10 }}>
              The leading incumbent (
              <span className="mono" style={{ color: 'var(--signal)' }}>
                KeepTruckin
              </span>
              ) optimizes for fleets above 80 vehicles where a dispatcher role exists. Below that
              threshold, its workflow demands a coordinator the operator must impersonate — a hidden
              tax of an estimated
              <span className="mono" style={{ color: 'var(--signal)' }}>
                {' '}
                11 days
              </span>{' '}
              to first useful dispatch. Northwind&apos;s wedge is to remove that role entirely by
              collapsing dispatch, IFTA, and DOT compliance into a single mobile inbox.
            </p>
            <div className="divider" style={{ margin: '16px 0' }} />
            <div className="eyebrow">SOURCE QUOTES</div>
            <ol
              style={{ paddingLeft: 18, color: 'var(--ink-faint)', fontSize: 13, lineHeight: 1.6 }}
            >
              <li>
                &ldquo;Onboarding takes 11 days&rdquo;{' '}
                <span className="mono" style={{ marginLeft: 6, color: 'var(--ink-faint)' }}>
                  · Q3.4
                </span>
              </li>
              <li>
                &ldquo;Solo owner‑operators have to fake a dispatcher&rdquo;{' '}
                <span className="mono" style={{ marginLeft: 6, color: 'var(--ink-faint)' }}>
                  · Q3.4
                </span>
              </li>
              <li>
                &ldquo;Pricing tiers start at $39/truck&rdquo;{' '}
                <span className="mono" style={{ marginLeft: 6, color: 'var(--ink-faint)' }}>
                  · KT pricing page
                </span>
              </li>
            </ol>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div className="eyebrow">PARITY MATRIX</div>
            <table className="cmp" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Axis</th>
                  <th>NW</th>
                  <th>KT</th>
                  <th>SAM</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Mobile UX', 5, 3, 2],
                  ['Onboarding', 5, 2, 1],
                  ['Pricing', 4, 3, 2],
                  ['IFTA auto', 4, 2, 1],
                  ['Support', 3, 4, 5],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    {row.slice(1).map((v, i) => (
                      <td key={i} className="mono">
                        <span
                          style={{
                            color:
                              v >= 4 ? 'var(--signal)' : v <= 2 ? 'var(--warn)' : 'var(--paper)',
                          }}
                        >
                          {v}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* prompt fill */}
        <div className="card" style={{ padding: 22, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="eyebrow">FILLED PROMPT KEYS</span>
            <span
              className="mono"
              style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-faint)' }}
            >
              14 KEYS · USED IN 4 REPORTS
            </span>
          </div>
          <div
            className="r-2col"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              marginTop: 14,
            }}
          >
            {[
              ['{{competitor.lead}}', 'KeepTruckin'],
              ['{{competitor.lead.tier}}', '$39/truck/mo'],
              ['{{incumbent.gap}}', 'no‑dispatcher workflow'],
              ['{{onboarding.days}}', '11'],
              ['{{wedge.fleet_size}}', '1–8 trucks'],
              ['{{parity.us.mobile_ux}}', '5/5'],
              ['{{parity.kt.mobile_ux}}', '3/5'],
              ['{{narrative.style}}', 'mckinsey · contrarian'],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '8px 10px',
                  background: 'var(--bg-2)',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                <span className="mono" style={{ color: 'var(--signal)', minWidth: 200 }}>
                  {k}
                </span>
                <span className="mono" style={{ color: 'var(--ink)', flex: 1, textAlign: 'right' }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

window.Outputs = Outputs;
Object.assign(window, { Outputs });
