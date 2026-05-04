/* global React, I, useApp */
const { I, Icon, CLUSTERS, REPORTS, ACTIVITY, AppCtx, AppProvider, useApp } = window;
const { useState, useEffect, useMemo, useRef, createContext, useContext, Fragment } = React;

function Signup() {
  const { setRoute, toast } = useApp();
  const [step, setStep] = React.useState(0); // 0 acct, 1 workspace, 2 plan
  const [acct, setAcct] = React.useState({ name: '', email: '', work: 'Founder' });
  const [ws, setWs] = React.useState({ name: '', slug: '', size: 'Solo' });
  const [plan, setPlan] = React.useState('studio');

  const finish = () => {
    toast('Workspace created · 50 trial credits added');
    setRoute('onboarding');
  };

  return (
    <div
      className="r-split"
      style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}
    >
      {/* Left: form */}
      <div
        className="r-pad-lg"
        style={{
          padding: '32px 56px',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          borderRight: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a
            onClick={() => setRoute('landing')}
            style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}
          >
            <span style={{ color: 'var(--signal)' }}>{I.logo(20)}</span>
            <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Ilinga</span>
          </a>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
            STEP {step + 1} / 3
          </span>
        </div>

        {/* Steps strip */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['Account', 'Workspace', 'Plan'].map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div className="bar">
                <i style={{ width: i <= step ? '100%' : '0%', transition: 'width 320ms ease' }} />
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: i === step ? 'var(--signal)' : 'var(--ink-faint)',
                  marginTop: 8,
                  letterSpacing: '0.10em',
                }}
              >
                0{i + 1} · {s.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            maxWidth: 460,
          }}
        >
          {step === 0 && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h1
                className="r-h-1"
                style={{ fontSize: 36, letterSpacing: '-0.02em', fontWeight: 500, margin: 0 }}
              >
                Create your account.
              </h1>
              <p style={{ color: 'var(--ink-faint)', margin: 0 }}>
                50 credits free. No card. Single sign‑on if you’d rather skip the typing.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ flex: 1 }}>
                  Continue with Google
                </button>
                <button className="btn" style={{ flex: 1 }}>
                  SSO
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: 'var(--ink-faint)',
                  fontSize: 12,
                }}
              >
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} /> OR{' '}
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>
              <div>
                <label className="field-label">Full name</label>
                <input
                  className="input"
                  placeholder="Ada Okonkwo"
                  value={acct.name}
                  onChange={(e) => setAcct({ ...acct, name: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Work email</label>
                <input
                  className="input"
                  placeholder="ada@northwind.co"
                  value={acct.email}
                  onChange={(e) => setAcct({ ...acct, email: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Your role</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Founder', 'Operator', 'Consultant', 'PM', 'Investor'].map((r) => (
                    <button
                      key={r}
                      className="btn sm"
                      onClick={() => setAcct({ ...acct, work: r })}
                      style={{
                        borderColor: acct.work === r ? 'var(--signal)' : 'var(--line)',
                        background: acct.work === r ? 'var(--signal-soft)' : 'var(--bg-2)',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn primary lg" onClick={() => setStep(1)}>
                Continue {I.arrow}
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h1
                className="r-h-1"
                style={{ fontSize: 36, letterSpacing: '-0.02em', fontWeight: 500, margin: 0 }}
              >
                Name your workspace.
              </h1>
              <p style={{ color: 'var(--ink-faint)', margin: 0 }}>
                One workspace per tenant. You can rename later — the slug is permanent.
              </p>
              <div>
                <label className="field-label">Workspace name</label>
                <input
                  className="input"
                  placeholder="Northwind Labs"
                  value={ws.name}
                  onChange={(e) =>
                    setWs({
                      ...ws,
                      name: e.target.value,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''),
                    })
                  }
                />
              </div>
              <div>
                <label className="field-label">Workspace URL</label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    background: 'var(--bg-2)',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      padding: '10px 12px',
                      color: 'var(--ink-faint)',
                      fontSize: 13,
                      borderRight: '1px solid var(--line)',
                    }}
                  >
                    ilinga.studio/
                  </span>
                  <input
                    className="input"
                    style={{ border: 'none', borderRadius: 0, background: 'transparent' }}
                    placeholder="northwind"
                    value={ws.slug}
                    onChange={(e) => setWs({ ...ws, slug: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Team size</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Solo', '2–5', '6–20', '21+'].map((r) => (
                    <button
                      key={r}
                      className="btn sm"
                      onClick={() => setWs({ ...ws, size: r })}
                      style={{
                        flex: 1,
                        borderColor: ws.size === r ? 'var(--signal)' : 'var(--line)',
                        background: ws.size === r ? 'var(--signal-soft)' : 'var(--bg-2)',
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn lg" onClick={() => setStep(0)}>
                  {I.arrowLeft} Back
                </button>
                <button className="btn primary lg" style={{ flex: 1 }} onClick={() => setStep(2)}>
                  Continue {I.arrow}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h1
                className="r-h-1"
                style={{ fontSize: 36, letterSpacing: '-0.02em', fontWeight: 500, margin: 0 }}
              >
                Pick a plan.
              </h1>
              <p style={{ color: 'var(--ink-faint)', margin: 0 }}>
                Switch any time. Annual billing rolls credits over.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  {
                    id: 'solo',
                    name: 'Solo',
                    price: '$0',
                    credits: '50 cr / mo',
                    d: 'Snapshot reports only',
                  },
                  {
                    id: 'studio',
                    name: 'Studio',
                    price: '$49',
                    credits: '500 cr / mo',
                    d: 'All Pro reports · custom templates · private endpoint',
                    tag: 'Recommended',
                  },
                  {
                    id: 'firm',
                    name: 'Firm',
                    price: '$149',
                    credits: '1,800 cr / mo',
                    d: 'All Premium · audit log · tenant theming',
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    className="card"
                    style={{
                      textAlign: 'left',
                      padding: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      borderColor: plan === p.id ? 'var(--signal)' : 'var(--line)',
                      background: plan === p.id ? 'var(--signal-soft)' : 'var(--bg-1)',
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: `1.5px solid ${plan === p.id ? 'var(--signal)' : 'var(--ink-faint)'}`,
                        background: plan === p.id ? 'var(--signal)' : 'transparent',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 500, fontSize: 15 }}>{p.name}</span>
                        {p.tag && (
                          <span className="tag signal">
                            <span className="dot" /> {p.tag}
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 4 }}>
                        {p.d}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: 16 }}>
                        {p.price}
                        <span style={{ color: 'var(--ink-faint)', fontSize: 11 }}> /MO</span>
                      </div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--signal)' }}>
                        {p.credits.toUpperCase()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn lg" onClick={() => setStep(1)}>
                  {I.arrowLeft} Back
                </button>
                <button className="btn primary lg" style={{ flex: 1 }} onClick={finish}>
                  Create workspace {I.arrow}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: live workspace preview */}
      <div
        className="r-mobile-hide"
        style={{ position: 'relative', overflow: 'hidden', background: 'var(--bg-1)' }}
      >
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
        <div
          style={{
            position: 'absolute',
            top: 56,
            left: 56,
            right: 56,
            bottom: 56,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div className="card" style={{ padding: 20 }}>
            <div className="eyebrow">WORKSPACE PREVIEW</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'var(--signal)',
                  color: 'var(--signal-ink)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 600,
                  fontSize: 18,
                  letterSpacing: '-0.02em',
                }}
              >
                {(ws.name || 'NW').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 16 }}>{ws.name || 'Northwind Labs'}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                  ilinga.studio/{ws.slug || 'northwind'}
                </div>
              </div>
            </div>
            <div className="divider" style={{ margin: '16px 0' }} />
            <div
              className="r-2col-stat"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
            >
              <Stat
                label="Plan"
                v={plan === 'solo' ? 'Solo' : plan === 'studio' ? 'Studio' : 'Firm'}
              />
              <Stat
                label="Credits / mo"
                v={plan === 'solo' ? '50' : plan === 'studio' ? '500' : '1,800'}
              />
              <Stat label="Owner" v={acct.name || '—'} />
              <Stat label="Role" v={acct.work} />
            </div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div className="eyebrow">WHAT HAPPENS NEXT</div>
            <ol
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '14px 0 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {[
                'Brief your first venture (2 min).',
                'Answer cluster interview (~12 min).',
                'Pick a report template — yours or ours.',
                'Spend credits to render the final PDF.',
              ].map((t, i) => (
                <li key={i} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                  <span className="mono" style={{ width: 22, color: 'var(--signal)' }}>
                    0{i + 1}
                  </span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, v }) {
  return (
    <div>
      <div
        className="mono"
        style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.10em' }}
      >
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 14, marginTop: 4 }}>{v}</div>
    </div>
  );
}

window.Signup = Signup;
Object.assign(window, { Signup });
