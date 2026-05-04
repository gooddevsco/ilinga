/* global React, I, useApp */
const { I, Icon, CLUSTERS, REPORTS, ACTIVITY, AppCtx, AppProvider, useApp } = window;
const { useState, useEffect, useMemo, useRef, createContext, useContext, Fragment } = React;

function Synthesis() {
  const { setAppView } = useApp();
  const [running, setRunning] = React.useState(true);
  const [stage, setStage] = React.useState(2);

  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, 5)), 1400);
    return () => clearInterval(t);
  }, [running]);

  const STAGES = [
    {
      id: 'memory',
      t: 'n8n memory',
      d: 'Conversation log + extracted facts loaded from interview',
      cost: '—',
    },
    {
      id: 'route',
      t: 'Prompt router',
      d: 'Classifies which prompt graphs to fan out (8 clusters → 24 modules)',
      cost: '—',
    },
    {
      id: 'fill',
      t: 'Key extraction',
      d: 'Pulls 142 content keys from answers + uploaded artifacts',
      cost: '12 cr',
    },
    {
      id: 'synth',
      t: 'Module synthesis',
      d: 'Each module runs a pre‑built prompt with key replacements',
      cost: '46 cr',
    },
    {
      id: 'reduce',
      t: 'Cross‑module reducer',
      d: 'Resolves conflicts; promotes winning narratives to report keys',
      cost: '8 cr',
    },
    {
      id: 'render',
      t: 'Report renderer',
      d: 'Templates fill from final keys → HTML → PDF',
      cost: 'on demand',
    },
  ];

  return (
    <div
      style={{
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        maxHeight: 'calc(100vh - 53px)',
        overflow: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div>
          <div className="eyebrow">SYNTHESIS PIPELINE · CYCLE 02</div>
          <h1
            style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', margin: '6px 0 0' }}
          >
            Answers → keys → reports.
          </h1>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="tag signal">
            <span className="dot pulse" /> RUNNING · STAGE {stage + 1} / 6
          </span>
          <button className="btn sm" onClick={() => setRunning(!running)}>
            {running ? 'Pause' : 'Resume'}
          </button>
          <button className="btn sm" onClick={() => setAppView('reports')}>
            Reports {I.arrow}
          </button>
        </div>
      </div>

      {/* Pipeline */}
      <div className="card" style={{ padding: 0 }}>
        <div className="r-synth-stages">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', minWidth: 720 }}>
            {STAGES.map((s, i) => {
              const state = i < stage ? 'done' : i === stage ? 'active' : 'pending';
              return (
                <div
                  key={s.id}
                  style={{
                    padding: 18,
                    borderRight: i < 5 ? '1px solid var(--line)' : 'none',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: `1.5px solid ${state === 'pending' ? 'var(--line-2)' : 'var(--signal)'}`,
                        background: state === 'done' ? 'var(--signal)' : 'transparent',
                        color: state === 'done' ? 'var(--signal-ink)' : 'var(--signal)',
                        display: 'grid',
                        placeItems: 'center',
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                      }}
                      className={state === 'active' ? 'pulse' : ''}
                    >
                      {state === 'done' ? '✓' : `0${i + 1}`}
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.10em' }}
                    >
                      {state === 'done' ? 'DONE' : state === 'active' ? 'RUNNING' : 'QUEUED'}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 12 }}>{s.t}</div>
                  <div
                    style={{
                      color: 'var(--ink-faint)',
                      fontSize: 12,
                      marginTop: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    {s.d}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 11,
                      color: state === 'active' ? 'var(--signal)' : 'var(--ink-faint)',
                      marginTop: 10,
                    }}
                  >
                    {s.cost.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Three-up: prompt template / key resolution / fanout */}
      <div
        className="r-3col"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}
      >
        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column' }}>
          <div className="eyebrow">PRE‑SET PROMPT · COMPETITION/DIRECT</div>
          <div
            style={{
              marginTop: 12,
              padding: 14,
              background: 'var(--bg-2)',
              borderRadius: 6,
              fontFamily: 'var(--mono)',
              fontSize: 11,
              lineHeight: 1.7,
              color: 'var(--ink-faint)',
            }}
          >
            You are an opinionated strategist.
            <br />
            Given <span style={{ color: 'var(--signal)' }}>{`{{venture.name}}`}</span> operating in{' '}
            <span style={{ color: 'var(--signal)' }}>{`{{geo.primary}}`}</span>,<br />
            compare against <span
              style={{ color: 'var(--signal)' }}
            >{`{{competitor.lead}}`}</span>{' '}
            on <span style={{ color: 'var(--signal)' }}>{`{{parity.axes}}`}</span>.<br />
            Cite founder quote: &ldquo;
            <span style={{ color: 'var(--signal)' }}>{`{{founder.quote.gap}}`}</span>&rdquo;
            <br />
            Output keys:{' '}
            <span
              style={{ color: 'var(--signal)' }}
            >{`narrative.competitive, parity.matrix, verdict.lead`}</span>
            <br />
            Style = <span style={{ color: 'var(--signal)' }}>{`{{tenant.tone}}`}</span> · cap 380
            words.
          </div>
          <span
            className="mono"
            style={{ marginTop: 'auto', paddingTop: 14, fontSize: 11, color: 'var(--ink-faint)' }}
          >
            VERSION 2026.04 · TENANT‑EDITABLE
          </span>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="eyebrow">CONTENT KEY RESOLUTION</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { k: '{{venture.name}}', v: 'Northwind Cargo', src: 'BRIEF' },
              { k: '{{geo.primary}}', v: 'United States', src: 'GEO' },
              { k: '{{competitor.lead}}', v: 'KeepTruckin', src: 'INTERVIEW Q3.2' },
              { k: '{{founder.quote.gap}}', v: '11‑day onboarding tax', src: 'INTERVIEW Q3.4' },
              { k: '{{parity.matrix}}', v: '5 axes · 3 firms', src: 'INTERVIEW Q3.5' },
              { k: '{{tenant.tone}}', v: 'McKinsey · contrarian', src: 'SETTINGS' },
              { k: '{{narrative.competitive}}', v: 'pending', src: 'DERIVED', pending: true },
              { k: '{{verdict.lead}}', v: 'pending', src: 'DERIVED', pending: true },
            ].map((kv) => (
              <div
                key={kv.k}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr auto',
                  gap: 8,
                  alignItems: 'center',
                  padding: '6px 8px',
                  background: 'var(--bg-2)',
                  borderRadius: 4,
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 11, color: kv.pending ? 'var(--ink-faint)' : 'var(--signal)' }}
                >
                  {kv.k}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: kv.pending ? 'var(--warn)' : 'var(--paper)',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {kv.v}
                </span>
                <span className="mono" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>
                  {kv.src}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="eyebrow">MODULE FANOUT · 24</div>
          <div
            style={{
              marginTop: 12,
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 4,
            }}
          >
            {Array.from({ length: 24 }).map((_, i) => {
              const s = i < stage * 5 ? 'done' : i < stage * 5 + 3 ? 'active' : 'pending';
              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 3,
                    background:
                      s === 'done'
                        ? 'var(--signal)'
                        : s === 'active'
                          ? 'var(--signal-soft)'
                          : 'var(--bg-2)',
                    border: `1px solid ${s === 'pending' ? 'var(--line)' : 'var(--signal)'}`,
                  }}
                  className={s === 'active' ? 'pulse' : ''}
                />
              );
            })}
          </div>
          <div className="divider" style={{ margin: '14px 0' }} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              padding: '4px 0',
            }}
          >
            <span style={{ color: 'var(--ink-faint)' }}>Modules complete</span>
            <span className="mono">{Math.min(stage * 5, 24)}/24</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              padding: '4px 0',
            }}
          >
            <span style={{ color: 'var(--ink-faint)' }}>Tokens consumed</span>
            <span className="mono">142,308</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              padding: '4px 0',
            }}
          >
            <span style={{ color: 'var(--ink-faint)' }}>Endpoint</span>
            <span className="mono" style={{ color: 'var(--signal)' }}>
              TENANT · AZURE
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              padding: '4px 0',
            }}
          >
            <span style={{ color: 'var(--ink-faint)' }}>Credits used</span>
            <span className="mono">66 / 500</span>
          </div>
        </div>
      </div>

      {/* Stream */}
      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 500 }}>Agent stream</span>
          <span
            className="mono"
            style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--signal)' }}
          >
            <span
              className="dot pulse"
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--signal)',
                marginRight: 6,
              }}
            />{' '}
            LIVE
          </span>
        </div>
        <div
          style={{
            padding: 14,
            fontFamily: 'var(--mono)',
            fontSize: 11,
            lineHeight: 1.85,
            color: 'var(--ink-faint)',
            maxHeight: 220,
            overflow: 'auto',
          }}
        >
          {[
            ['00:00', 'memory.load', 'loaded 52 answers, 3 artifacts (signals=53)'],
            ['00:01', 'router.classify', '→ 8 clusters, 24 modules, 6 reports'],
            ['00:03', 'keys.extract', '142 keys identified · 138 resolved · 4 pending'],
            ['00:05', 'module.synth', 'positioning.audience → narrative ✓'],
            ['00:06', 'module.synth', 'positioning.promise → narrative ✓'],
            ['00:08', 'module.synth', 'competition.direct → parity.matrix ✓'],
            ['00:09', 'module.synth', 'competition.direct → narrative.competitive ✓'],
            ['00:11', 'reducer.merge', 'verdict.lead = "Northwind"', 'signal'],
            ['00:13', 'render.queue', 'competitive (35 cr) · gtm (60 cr) · investor (90 cr)'],
          ].map((row, i) => (
            <div
              key={i}
              style={{ display: 'grid', gridTemplateColumns: '60px 180px 1fr', gap: 14 }}
            >
              <span>{row[0]}</span>
              <span style={{ color: 'var(--ink)' }}>{row[1]}</span>
              <span style={{ color: row[3] === 'signal' ? 'var(--signal)' : 'var(--ink-faint)' }}>
                {row[2]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.Synthesis = Synthesis;
Object.assign(window, { Synthesis });
