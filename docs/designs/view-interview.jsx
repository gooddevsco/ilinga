/* global React, I, useApp, CLUSTERS */
const { I, Icon, CLUSTERS, REPORTS, ACTIVITY, AppCtx, AppProvider, useApp } = window;
const { useState, useEffect, useMemo, useRef, createContext, useContext, Fragment } = React;

const QUESTIONS = [
  {
    cluster: 'competition',
    module: 'Direct',
    title: 'Where does the leading incumbent break for your wedge user?',
    sub: "Be specific. We'll cite this verbatim in the Competitive Landscape report.",
    type: 'long',
    placeholder:
      'e.g., Their workflow assumes a dispatcher exists — solo operators have to fake one…',
    suggestions: [
      'Onboarding friction',
      'Pricing floor too high',
      'Mobile UX gaps',
      'Compliance not bundled',
    ],
  },
  {
    cluster: 'competition',
    module: 'Direct',
    title: 'Pick the closest competitor by GTM motion.',
    sub: 'Drives the GTM Playbook prompt graph.',
    type: 'choice',
    options: [
      { v: 'kt', l: 'KeepTruckin', d: 'PLG → outbound, fleet ≥10' },
      { v: 'sm', l: 'Samsara', d: 'Enterprise sales, hardware bundle' },
      { v: 'to', l: 'TruckingOffice', d: 'SMB self‑serve, no hardware' },
    ],
  },
  {
    cluster: 'competition',
    module: 'Direct',
    title: 'Rate where you out‑perform on each axis.',
    sub: 'Used in the parity matrix. 1 = behind · 5 = best‑in‑class.',
    type: 'matrix',
    rows: [
      'Mobile UX',
      'Onboarding speed',
      'Pricing transparency',
      'IFTA automation',
      'Customer support',
    ],
  },
];

function Interview() {
  const { credits, toast, setAppView } = useApp();
  const [activeCluster, setActiveCluster] = React.useState('competition');
  const [qi, setQi] = React.useState(0);
  const [answers, setAnswers] = React.useState({
    0: 'They built for fleet ops at >500 vehicles. Below 80, the workflow assumes a dispatcher exists — solo owner‑operators have to fake one. Onboarding takes 11 days.',
    1: 'kt',
    2: {
      'Mobile UX': 5,
      'Onboarding speed': 5,
      'Pricing transparency': 4,
      'IFTA automation': 4,
      'Customer support': 3,
    },
  });
  const q = QUESTIONS[qi];

  const next = () => {
    if (qi < QUESTIONS.length - 1) setQi(qi + 1);
    else {
      toast('Cluster complete · 3 modules synthesized');
      setAppView('outputs');
    }
  };

  const totalQ = window.CLUSTERS.reduce((a, c) => a + c.qs, 0);
  const doneQ = window.CLUSTERS.reduce((a, c) => a + c.done, 0);
  const overall = Math.round((doneQ / totalQ) * 100);

  return (
    <div
      className="r-interview-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr 360px',
        minHeight: '100%',
        maxHeight: 'calc(100vh - 53px)',
      }}
    >
      {/* LEFT — progress map */}
      <aside style={{ borderRight: '1px solid var(--line)', overflow: 'auto', padding: 18 }}>
        <div className="eyebrow">PROGRESS MAP</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
          <span className="mono" style={{ fontSize: 32, letterSpacing: '-0.02em' }}>
            {overall}
            <span style={{ fontSize: 14, color: 'var(--ink-faint)' }}>%</span>
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
            {doneQ}/{totalQ} ANSWERED
          </span>
        </div>
        <div className="bar" style={{ marginTop: 8 }}>
          <i style={{ width: `${overall}%` }} />
        </div>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {window.CLUSTERS.map((c, i) => {
            const p = Math.round((c.done / c.qs) * 100);
            const isActive = c.id === activeCluster;
            const isDone = p === 100;
            return (
              <div
                key={c.id}
                className={`cluster-row ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                style={{ '--p': p }}
                onClick={() => setActiveCluster(c.id)}
              >
                <span className="num">0{i + 1}</span>
                <span className="ring" style={{ '--p': p }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: isActive ? 500 : 400 }}>{c.label}</div>
                  <div
                    className="mono"
                    style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}
                  >
                    {c.modules.join(' · ').toUpperCase()}
                  </div>
                </div>
                <span
                  className="mono"
                  style={{ fontSize: 11, color: isDone ? 'var(--signal)' : 'var(--ink-faint)' }}
                >
                  {c.done}/{c.qs}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 22 }} className="card">
          <div style={{ padding: 14 }}>
            <div className="eyebrow">YOUR CADENCE</div>
            <div style={{ display: 'flex', alignItems: 'end', gap: 16, marginTop: 10 }}>
              <div>
                <div className="mono" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
                  14<span style={{ fontSize: 12, color: 'var(--ink-faint)' }}> Q/SESSION</span>
                </div>
              </div>
              <div className="bars" style={{ flex: 1 }}>
                {[5, 8, 6, 11, 14, 9, 14, 12, 14].map((v, i) => (
                  <i
                    key={i}
                    className={i === 4 || i === 6 || i === 8 ? 'hi' : ''}
                    style={{ height: `${v * 6}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER — active question */}
      <main style={{ overflow: 'auto', padding: '36px 56px', position: 'relative' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="tag signal">
              <span className="dot" /> 03 · COMPETITION
            </span>
            <span className="tag">MODULE · DIRECT</span>
            <span
              className="mono"
              style={{ fontSize: 11, color: 'var(--ink-faint)', marginLeft: 'auto' }}
            >
              QUESTION {qi + 1} / {QUESTIONS.length}
            </span>
          </div>

          <h1
            className="fade-up"
            key={qi}
            style={{
              fontSize: 38,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              fontWeight: 500,
              margin: '32px 0 10px',
            }}
          >
            {q.title}
          </h1>
          <p
            className="fade-up"
            key={`s-${qi}`}
            style={{ color: 'var(--ink-faint)', margin: 0, fontSize: 15 }}
          >
            {q.sub}
          </p>

          {/* Answer surfaces */}
          <div style={{ marginTop: 28 }} className="fade-up" key={`a-${qi}`}>
            {q.type === 'long' && (
              <>
                <textarea
                  className="textarea"
                  style={{ minHeight: 160, fontSize: 15 }}
                  placeholder={q.placeholder}
                  value={answers[qi] || ''}
                  onChange={(e) => setAnswers({ ...answers, [qi]: e.target.value })}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      color: 'var(--ink-faint)',
                      alignSelf: 'center',
                      marginRight: 4,
                    }}
                  >
                    HINTS:
                  </span>
                  {q.suggestions.map((s) => (
                    <button
                      key={s}
                      className="btn sm"
                      onClick={() =>
                        setAnswers({ ...answers, [qi]: (answers[qi] || '') + ' · ' + s })
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
            {q.type === 'choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setAnswers({ ...answers, [qi]: o.v })}
                    className="card"
                    style={{
                      textAlign: 'left',
                      padding: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      borderColor: answers[qi] === o.v ? 'var(--signal)' : 'var(--line)',
                      background: answers[qi] === o.v ? 'var(--signal-soft)' : 'var(--bg-1)',
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: `1.5px solid ${answers[qi] === o.v ? 'var(--signal)' : 'var(--ink-faint)'}`,
                        background: answers[qi] === o.v ? 'var(--signal)' : 'transparent',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{o.l}</div>
                      <div style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 2 }}>
                        {o.d}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {q.type === 'matrix' && (
              <div className="card" style={{ padding: 0 }}>
                {q.rows.map((row, ri) => (
                  <div
                    key={row}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 16,
                      padding: '12px 16px',
                      borderBottom: ri < q.rows.length - 1 ? '1px solid var(--line)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: 13 }}>{row}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((n) => {
                        const cur = (answers[qi] || {})[row];
                        const on = cur >= n;
                        return (
                          <button
                            key={n}
                            onClick={() =>
                              setAnswers({ ...answers, [qi]: { ...(answers[qi] || {}), [row]: n } })
                            }
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 5,
                              border: `1px solid ${on ? 'var(--signal)' : 'var(--line)'}`,
                              background: on ? 'var(--signal)' : 'var(--bg-2)',
                              color: on ? 'var(--signal-ink)' : 'var(--ink-faint)',
                              fontFamily: 'var(--mono)',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 36 }}>
            <button
              className="btn"
              onClick={() => setQi(Math.max(0, qi - 1))}
              disabled={qi === 0}
              style={{ opacity: qi === 0 ? 0.5 : 1 }}
            >
              {I.arrowLeft} Back
            </button>
            <button className="btn ghost">Skip</button>
            <button className="btn ghost">Save draft</button>
            <div style={{ flex: 1 }} />
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: 'var(--ink-faint)',
                alignSelf: 'center',
                marginRight: 4,
              }}
            >
              ⌘ ↵
            </span>
            <button className="btn primary" onClick={next}>
              {qi === QUESTIONS.length - 1 ? 'Finish cluster' : 'Next'} {I.arrow}
            </button>
          </div>
        </div>
      </main>

      {/* RIGHT — agent panel */}
      <aside
        style={{
          borderLeft: '1px solid var(--line)',
          overflow: 'auto',
          padding: 18,
          background: 'var(--bg-1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="pulse"
            style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--signal)' }}
          />
          <span className="eyebrow" style={{ color: 'var(--signal)' }}>
            AGENT · LISTENING
          </span>
        </div>
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--ink)', lineHeight: 1.55 }}>
          Your draft references{' '}
          <span className="mono" style={{ color: 'var(--signal)' }}>
            11‑day onboarding
          </span>
          . I&rsquo;ll add a follow‑up about activation metrics if that&rsquo;s a wedge worth
          quantifying.
        </div>
        <div
          style={{
            marginTop: 16,
            padding: 14,
            border: '1px dashed var(--line-2)',
            borderRadius: 8,
          }}
        >
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
            QUEUED FOLLOW‑UPS · 2
          </div>
          <div style={{ marginTop: 8, fontSize: 13 }}>
            · What activation metric would you target instead?
          </div>
          <div style={{ marginTop: 6, fontSize: 13 }}>
            · Is the 11‑day figure self‑reported or measured?
          </div>
        </div>

        <div className="divider" style={{ margin: '24px 0' }} />
        <div className="eyebrow">PROMPT GRAPH KEYS · LIVE</div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { k: '{{venture.wedge}}', v: 'solo & micro‑fleet operators' },
            { k: '{{competitor.lead}}', v: 'KeepTruckin' },
            { k: '{{incumbent.gap}}', v: 'no‑dispatcher workflow' },
            { k: '{{onboarding.days}}', v: '11' },
            { k: '{{cluster.competition.score}}', v: '4.2 / 5' },
          ].map((kv) => (
            <div
              key={kv.k}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                padding: '6px 8px',
                background: 'var(--bg-2)',
                borderRadius: 4,
              }}
            >
              <span className="mono" style={{ fontSize: 11, color: 'var(--signal)' }}>
                {kv.k}
              </span>
              <span
                className="mono"
                style={{ fontSize: 11, color: 'var(--ink)', textAlign: 'right' }}
              >
                {kv.v}
              </span>
            </div>
          ))}
        </div>

        <div className="divider" style={{ margin: '24px 0' }} />
        <div className="eyebrow">ESTIMATED COST IF RENDERED NOW</div>
        <div style={{ marginTop: 10 }}>
          {[
            { n: 'Snapshot', c: 0 },
            { n: 'Competitive Landscape', c: 35 },
            { n: 'GTM Playbook', c: 60 },
          ].map((r) => (
            <div
              key={r.n}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px dashed var(--line)',
                fontSize: 12,
              }}
            >
              <span>{r.n}</span>
              <span
                className="mono"
                style={{ color: r.c === 0 ? 'var(--signal)' : 'var(--paper)' }}
              >
                {r.c === 0 ? 'INCLUDED' : `${r.c} CR`}
              </span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

window.Interview = Interview;
Object.assign(window, { Interview });
