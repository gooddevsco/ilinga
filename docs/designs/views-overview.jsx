/* global React, I, useApp, CLUSTERS, REPORTS, ACTIVITY */
const { I, Icon, CLUSTERS, REPORTS, ACTIVITY, AppCtx, AppProvider, useApp } = window;
const { useState, useEffect, useMemo, useRef, createContext, useContext, Fragment } = React;

function Dashboard() {
  const { setAppView, credits, planCredits, tenant } = useApp();
  const overall = Math.round(
    (window.CLUSTERS.reduce((a, c) => a + c.done, 0) /
      window.CLUSTERS.reduce((a, c) => a + c.qs, 0)) *
      100,
  );
  return (
    <div
      className="r-pad"
      style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Hero strip */}
      <div
        className="card r-2col"
        style={{
          padding: 28,
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 28,
          alignItems: 'center',
        }}
      >
        <div>
          <div className="eyebrow">ACTIVE VENTURE</div>
          <h1
            style={{
              fontSize: 38,
              letterSpacing: '-0.02em',
              fontWeight: 500,
              margin: '10px 0 6px',
            }}
          >
            Northwind Cargo
          </h1>
          <div className="mono" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
            LOGISTICS SAAS · FLEET OPS · CYCLE 02 OF 03
          </div>
          <p
            style={{
              color: 'var(--ink)',
              fontSize: 14,
              lineHeight: 1.6,
              marginTop: 16,
              maxWidth: 560,
            }}
          >
            Dispatch + compliance for solo and small‑fleet owner‑operators. The agent is
            mid‑interview on Competition; two reports unlocked, four awaiting credits.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn primary" onClick={() => setAppView('questions')}>
              Resume interview {I.arrow}
            </button>
            <button className="btn" onClick={() => setAppView('outputs')}>
              Review outputs
            </button>
            <button className="btn ghost" onClick={() => setAppView('reports')}>
              Reports
            </button>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="eyebrow">CYCLE PROGRESS</span>
            <span className="mono" style={{ fontSize: 26, letterSpacing: '-0.02em' }}>
              {overall}
              <span style={{ fontSize: 14, color: 'var(--ink-faint)' }}>%</span>
            </span>
          </div>
          <div className="bar" style={{ marginTop: 10 }}>
            <i style={{ width: `${overall}%` }} />
          </div>
          <div
            className="r-2col"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}
          >
            {window.CLUSTERS.slice(0, 8).map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  padding: '6px 0',
                  borderBottom: '1px dashed var(--line)',
                }}
              >
                <span style={{ color: 'var(--ink-faint)' }}>{c.label}</span>
                <span
                  className="mono"
                  style={{ color: c.done === c.qs ? 'var(--signal)' : 'var(--paper)' }}
                >
                  {c.done}/{c.qs}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KPI
          label="Credits remaining"
          v={credits}
          sub={`OF ${planCredits} · RESETS MAY 1`}
          accent
        />
        <KPI label="Modules generated" v="14" sub="OF 24 · 58%" />
        <KPI label="Reports rendered" v="2" sub="SNAPSHOT · COMPETITIVE" />
        <KPI label="Pending credits cost" v="265" sub="ACROSS 4 LOCKED REPORTS" />
      </div>

      {/* Two-up: clusters + activity */}
      <div
        className="r-2col"
        style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}
      >
        <div className="card" style={{ padding: 0 }}>
          <div
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid var(--line)',
            }}
          >
            <span style={{ fontWeight: 500 }}>Clusters</span>
            <span
              className="mono"
              style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-faint)' }}
            >
              52 QUESTIONS · 24 MODULES
            </span>
          </div>
          <table className="cmp">
            <thead>
              <tr>
                <th style={{ width: 30 }}>#</th>
                <th>Cluster</th>
                <th>Modules</th>
                <th>Progress</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {window.CLUSTERS.map((c, i) => {
                const p = Math.round((c.done / c.qs) * 100);
                return (
                  <tr
                    key={c.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setAppView('outputs')}
                  >
                    <td className="mono" style={{ color: 'var(--ink-faint)' }}>
                      0{i + 1}
                    </td>
                    <td style={{ fontWeight: 500 }}>{c.label}</td>
                    <td style={{ color: 'var(--ink-faint)' }}>{c.modules.join(' · ')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="bar" style={{ flex: 1, maxWidth: 160 }}>
                          <i style={{ width: `${p}%` }} />
                        </div>
                        <span
                          className="mono"
                          style={{
                            fontSize: 11,
                            color: p === 100 ? 'var(--signal)' : 'var(--ink-faint)',
                          }}
                        >
                          {p}%
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--ink-faint)', textAlign: 'right' }}>{I.arrow}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontWeight: 500 }}>Activity</span>
          </div>
          <div style={{ padding: 10 }}>
            {window.ACTIVITY.map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 8px',
                  borderBottom: '1px dashed var(--line)',
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--ink-faint)', width: 60 }}
                >
                  {a.t.toUpperCase()}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: a.tone === 'signal' ? 'var(--signal)' : 'var(--paper)',
                    }}
                  >
                    {a.what}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}
                  >
                    {a.who.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reports preview */}
      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <span style={{ fontWeight: 500 }}>Reports</span>
          <span
            className="mono"
            style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-faint)' }}
          >
            2 RENDERED · 4 LOCKED
          </span>
          <button
            className="btn sm"
            style={{ marginLeft: 12 }}
            onClick={() => setAppView('reports')}
          >
            View all {I.arrow}
          </button>
        </div>
        <div
          className="r-cards-3"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}
        >
          {window.REPORTS.slice(0, 3).map((r, i) => (
            <div
              key={r.id}
              style={{ padding: 18, borderRight: i < 2 ? '1px solid var(--line)' : 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className={`tag ${r.locked ? '' : 'signal'}`}>
                  {r.locked ? I.lock : <span className="dot" />} {r.tier}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                  {r.cost === 0 ? 'INCLUDED' : `${r.cost} CR`}
                </span>
              </div>
              <div style={{ fontWeight: 500, fontSize: 15, marginTop: 12 }}>{r.name}</div>
              <div style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 4 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, v, sub, accent }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div
        className="mono"
        style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.10em' }}
      >
        {label.toUpperCase()}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 32,
          marginTop: 10,
          letterSpacing: '-0.02em',
          color: accent ? 'var(--signal)' : 'var(--paper)',
        }}
      >
        {v}
      </div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 6 }}>
        {sub}
      </div>
    </div>
  );
}

// VENTURE — overview of cycles + brief
function Venture() {
  const { setAppView } = useApp();
  return (
    <div
      className="r-pad"
      style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      <div className="r-2col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow">BRIEF · LOCKED</div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              margin: '8px 0 12px',
            }}
          >
            Northwind Cargo
          </h2>
          <p style={{ color: 'var(--ink)', fontSize: 14, lineHeight: 1.65 }}>
            Dispatch + compliance app for solo and small‑fleet owner‑operators (1–8 trucks). We
            replace the dispatcher‑shaped hole that incumbents like KeepTruckin assume already
            exists, by automating load matching, IFTA filings, and DOT compliance from a single
            mobile inbox.
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
            {['B2B SaaS', 'Fleet Ops', 'Compliance · Trucking', 'SMB tools'].map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
          <div className="divider" style={{ margin: '20px 0' }} />
          <div className="eyebrow">COMPETITORS · 3</div>
          <div
            className="r-cards-3"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}
          >
            {[
              { d: 'keeptruckin.com', n: 'KeepTruckin', t: 'Direct · upmarket' },
              { d: 'samsara.com', n: 'Samsara', t: 'Direct · enterprise' },
              { d: 'truckingoffice.com', n: 'TruckingOffice', t: 'Substitute' },
            ].map((c) => (
              <div
                key={c.d}
                style={{ padding: 12, border: '1px solid var(--line)', borderRadius: 6 }}
              >
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                  {c.d.toUpperCase()}
                </div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{c.n}</div>
                <span className="tag" style={{ marginTop: 8 }}>
                  {c.t}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <div className="eyebrow">VENTURE CYCLES</div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { n: 'Cycle 03', s: 'Live · Investor‑ready', state: 'active' },
                { n: 'Cycle 02', s: 'Locked · Mar 14', state: 'done' },
                { n: 'Cycle 01', s: 'Locked · Feb 02', state: 'done' },
              ].map((c, i) => (
                <div
                  key={c.n}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: i < 2 ? '1px dashed var(--line)' : 'none',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: c.state === 'active' ? 'var(--signal)' : 'var(--ink-faint)',
                    }}
                    className={c.state === 'active' ? 'pulse' : ''}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{c.n}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                      {c.s.toUpperCase()}
                    </div>
                  </div>
                  <button className="btn sm">{i === 0 ? 'Open' : 'View'}</button>
                </div>
              ))}
              <button className="btn sm" style={{ marginTop: 12 }}>
                {I.plus} New cycle
              </button>
            </div>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div className="eyebrow">QUICK ACTIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={() => setAppView('questions')}>
                Resume interview
              </button>
              <button className="btn" onClick={() => setAppView('outputs')}>
                Review module outputs
              </button>
              <button className="btn" onClick={() => setAppView('reports')}>
                Browse reports
              </button>
              <button className="btn ghost">Export workspace</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
window.Venture = Venture;
Object.assign(window, { Dashboard, Venture });
