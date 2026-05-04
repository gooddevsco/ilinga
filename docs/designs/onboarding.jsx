/* global React, I, useApp */
const { I, Icon, CLUSTERS, REPORTS, ACTIVITY, AppCtx, AppProvider, useApp } = window;
const { useState, useEffect, useMemo, useRef, createContext, useContext, Fragment } = React;

function Onboarding() {
  const { setRoute, toast } = useApp();
  const [step, setStep] = React.useState(0); // 0 brief, 1 geography, 2 artifacts, 3 competitors, 4 industry, 5 confirm
  const [name, setName] = React.useState('Northwind Cargo');
  const [brief, setBrief] = React.useState(
    'Northwind Cargo is a dispatch + compliance app for solo and small‑fleet owner‑operators (1–8 trucks). We replace the dispatcher‑shaped hole that incumbents like KeepTruckin assume already exists, by automating load matching, IFTA filings, and DOT compliance from a single mobile inbox.',
  );
  const [scope, setScope] = React.useState('multi'); // local | national | multi | global
  const [regions, setRegions] = React.useState(['North America']);
  const [primary, setPrimary] = React.useState('United States');
  const [secondary, setSecondary] = React.useState(['Canada', 'Mexico']);
  const [files, setFiles] = React.useState([
    { name: 'pitch-v3.pdf', kind: 'PDF', size: '2.4 MB', state: 'parsed', sigs: 18 },
    { name: 'ifta-deck.key', kind: 'KEYNOTE', size: '14.1 MB', state: 'parsed', sigs: 11 },
    { name: 'customer-interviews.docx', kind: 'DOCX', size: '380 KB', state: 'parsed', sigs: 24 },
  ]);
  const [competitors, setCompetitors] = React.useState([
    'https://keeptruckin.com',
    'https://samsara.com',
    'https://truckingoffice.com',
  ]);
  const [newComp, setNewComp] = React.useState('');
  const [industry, setIndustry] = React.useState('auto');
  const [picked, setPicked] = React.useState('Logistics SaaS · Fleet Ops');
  const [analyzing, setAnalyzing] = React.useState(false);

  const next = () => {
    if (step === 3) {
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        setStep(4);
      }, 1400);
    } else if (step === 5) {
      toast('Venture brief locked · agent warming up');
      setRoute('app');
    } else {
      setStep(step + 1);
    }
  };
  const back = () => setStep(Math.max(0, step - 1));

  const STEPS = ['Brief', 'Geography', 'Artifacts', 'Competitors', 'Industry', 'Confirm'];

  const onPickFiles = (e) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    const additions = list.map((f) => ({
      name: f.name,
      kind: (f.name.split('.').pop() || 'FILE').toUpperCase(),
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      state: 'uploading',
      sigs: 0,
    }));
    setFiles((cur) => [...cur, ...additions]);
    setTimeout(() => {
      setFiles((cur) =>
        cur.map((f) =>
          f.state === 'uploading'
            ? { ...f, state: 'parsed', sigs: 6 + Math.floor(Math.random() * 18) }
            : f,
        ),
      );
    }, 1100);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr' }}>
      {/* Top bar */}
      <header
        style={{
          borderBottom: '1px solid var(--line)',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <a
          onClick={() => setRoute('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <span style={{ color: 'var(--signal)' }}>{I.logo(18)}</span>
          <span style={{ fontWeight: 600 }}>Ilinga</span>
        </a>
        <span style={{ color: 'var(--ink-faint)' }}>/</span>
        <span style={{ fontSize: 13 }}>Northwind Labs</span>
        <span className="tag" style={{ marginLeft: 4 }}>
          NEW VENTURE
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: i <= step ? 'var(--signal)' : 'var(--ink-faint)',
                  letterSpacing: '0.10em',
                }}
              >
                0{i + 1}
              </span>
              <span
                style={{ fontSize: 12, color: i === step ? 'var(--paper)' : 'var(--ink-faint)' }}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <span style={{ width: 16, height: 1, background: 'var(--line)' }} />
              )}
            </div>
          ))}
        </div>
        <button className="btn sm ghost" onClick={() => setRoute('app')} style={{ marginLeft: 14 }}>
          Save & exit
        </button>
      </header>

      {/* Body */}
      <div
        className="r-onboard-body"
        style={{ display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}
      >
        <main className="r-pad-lg" style={{ padding: '48px 80px', overflow: 'auto' }}>
          <div style={{ maxWidth: 760 }}>
            {step === 0 && (
              <div
                className="fade-up"
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                <div>
                  <div className="eyebrow">01 · BRIEF</div>
                  <h1
                    className="r-h-display"
                    style={{
                      fontSize: 44,
                      letterSpacing: '-0.025em',
                      fontWeight: 500,
                      margin: '12px 0 8px',
                      lineHeight: 1.05,
                    }}
                  >
                    Tell us what you’re building.
                  </h1>
                  <p style={{ color: 'var(--ink-faint)', maxWidth: 560, margin: 0 }}>
                    Give it a name and a paragraph. The agent treats this as ground truth — we cite
                    it in every report.
                  </p>
                </div>
                <div>
                  <label className="field-label">Venture name</label>
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Northwind Cargo"
                  />
                  <div
                    className="mono"
                    style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 6 }}
                  >
                    SLUG ·{' '}
                    {name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '') || 'untitled'}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <label className="field-label">Brief description</label>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                      {brief.length} / 1500
                    </span>
                  </div>
                  <textarea
                    className="textarea"
                    style={{ minHeight: 200 }}
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="Who is it for, what does it do, why does it have to exist now?"
                  />
                </div>
                <div
                  className="card"
                  style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'start' }}
                >
                  <span style={{ color: 'var(--signal)', marginTop: 2 }}>{I.spark}</span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>Want a tighter brief?</div>
                    <div style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 4 }}>
                      The agent can rewrite this in our house style. 5 credits, undoable.
                    </div>
                  </div>
                  <button className="btn sm" style={{ marginLeft: 'auto' }}>
                    Rewrite · 5 cr
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div
                className="fade-up"
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                <div>
                  <div className="eyebrow">02 · GEOGRAPHY</div>
                  <h1
                    className="r-h-display"
                    style={{
                      fontSize: 44,
                      letterSpacing: '-0.025em',
                      fontWeight: 500,
                      margin: '12px 0 8px',
                      lineHeight: 1.05,
                    }}
                  >
                    Where will this venture operate?
                  </h1>
                  <p style={{ color: 'var(--ink-faint)', margin: 0 }}>
                    Geography drives TAM sizing, regulatory clusters, and which datasets the agent
                    pulls. Set the primary market first; add secondary markets if you have them.
                  </p>
                </div>

                <div>
                  <label className="field-label">Operational scope</label>
                  <div
                    className="r-cards-4"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}
                  >
                    {[
                      { id: 'local', t: 'Local', d: 'City / metro' },
                      { id: 'national', t: 'National', d: 'Single country' },
                      { id: 'multi', t: 'Multi‑country', d: 'Region or 2–5 markets' },
                      { id: 'global', t: 'Global', d: 'No regional limit' },
                    ].map((o) => (
                      <button
                        key={o.id}
                        className="card"
                        onClick={() => setScope(o.id)}
                        style={{
                          padding: 14,
                          textAlign: 'left',
                          borderColor: scope === o.id ? 'var(--signal)' : 'var(--line)',
                          background: scope === o.id ? 'var(--signal-soft)' : 'var(--bg-1)',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{o.t}</div>
                        <div
                          className="mono"
                          style={{
                            fontSize: 10,
                            color: 'var(--ink-faint)',
                            marginTop: 4,
                            letterSpacing: '0.06em',
                          }}
                        >
                          {o.d.toUpperCase()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="field-label">Primary market</label>
                  <input
                    className="input"
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    placeholder="Country or metro"
                  />
                </div>

                <div>
                  <label className="field-label">Secondary markets</label>
                  <div
                    className="card"
                    style={{
                      padding: 12,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    {secondary.map((c, i) => (
                      <span key={c} className="tag signal" style={{ paddingRight: 6 }}>
                        <span className="dot" /> {c}
                        <button
                          onClick={() => setSecondary(secondary.filter((_, j) => j !== i))}
                          style={{ marginLeft: 4, color: 'inherit', cursor: 'pointer' }}
                        >
                          {I.x}
                        </button>
                      </span>
                    ))}
                    <input
                      className="input"
                      placeholder="Add a market and press Enter"
                      style={{
                        flex: 1,
                        minWidth: 200,
                        border: 'none',
                        background: 'transparent',
                        padding: '4px 6px',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          setSecondary([...secondary, e.target.value.trim()]);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
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
                      SUGGEST:
                    </span>
                    {['United Kingdom', 'Germany', 'Australia', 'Brazil', 'India', 'EU‑27'].map(
                      (s) => (
                        <button
                          key={s}
                          className="btn sm"
                          onClick={() => !secondary.includes(s) && setSecondary([...secondary, s])}
                        >
                          {s}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <label className="field-label">Regulatory regimes detected</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['DOT (US)', 'IFTA (US/CA)', 'FMCSA', 'NSC (Canada)', 'SCT (Mexico)'].map(
                      (r) => (
                        <span key={r} className="tag">
                          {r}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div
                className="fade-up"
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                <div>
                  <div className="eyebrow">03 · ARTIFACTS</div>
                  <h1
                    className="r-h-display"
                    style={{
                      fontSize: 44,
                      letterSpacing: '-0.025em',
                      fontWeight: 500,
                      margin: '12px 0 8px',
                      lineHeight: 1.05,
                    }}
                  >
                    Drop in supporting documents.
                  </h1>
                  <p style={{ color: 'var(--ink-faint)', margin: 0 }}>
                    Optional. Decks, customer interviews, financial models, research notes — the
                    agent extracts signals and folds them into prompts. Files stay private to your
                    tenant.
                  </p>
                </div>

                <label
                  htmlFor="vc-files"
                  className="card"
                  style={{
                    padding: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    borderStyle: 'dashed',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: 'var(--signal)' }}>{I.upload}</span>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    Drag files here or click to browse
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                    PDF · DOCX · KEYNOTE · PPTX · MD · TXT · CSV · UP TO 50 MB
                  </div>
                  <input
                    id="vc-files"
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={onPickFiles}
                  />
                </label>

                {files.length > 0 && (
                  <div className="card" style={{ padding: 0 }}>
                    <div
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--line)',
                      }}
                    >
                      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                        UPLOADED · {files.length}
                      </span>
                      <span
                        className="mono"
                        style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--signal)' }}
                      >
                        {files.reduce((a, f) => a + f.sigs, 0)} SIGNALS EXTRACTED
                      </span>
                    </div>
                    {files.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '12px 16px',
                          borderBottom: i < files.length - 1 ? '1px solid var(--line)' : 'none',
                        }}
                      >
                        <span
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 5,
                            border: '1px solid var(--line)',
                            display: 'grid',
                            placeItems: 'center',
                            color: 'var(--ink-faint)',
                          }}
                        >
                          {I.doc}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {f.name}
                          </div>
                          <div
                            className="mono"
                            style={{
                              fontSize: 10,
                              color: 'var(--ink-faint)',
                              marginTop: 2,
                              letterSpacing: '0.06em',
                            }}
                          >
                            {f.kind} · {f.size} ·{' '}
                            {f.state === 'uploading' ? 'PARSING…' : `${f.sigs} SIGNALS`}
                          </div>
                        </div>
                        {f.state === 'uploading' ? (
                          <span
                            className="pulse"
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: 'var(--signal)',
                            }}
                          />
                        ) : (
                          <span className="tag signal">
                            <span className="dot" /> PARSED
                          </span>
                        )}
                        <button
                          className="btn sm ghost"
                          onClick={() => setFiles(files.filter((_, j) => j !== i))}
                          aria-label="Remove"
                        >
                          {I.x}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className="card"
                  style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'start' }}
                >
                  <span style={{ color: 'var(--signal)', marginTop: 2 }}>{I.lock}</span>
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 500 }}>Private by default</div>
                    <div style={{ color: 'var(--ink-faint)', marginTop: 4 }}>
                      Files are tenant‑isolated, encrypted at rest, and never used to train models.
                      Delete anytime in Settings → Data.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div
                className="fade-up"
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                <div>
                  <div className="eyebrow">04 · COMPETITORS</div>
                  <h1
                    className="r-h-display"
                    style={{
                      fontSize: 44,
                      letterSpacing: '-0.025em',
                      fontWeight: 500,
                      margin: '12px 0 8px',
                      lineHeight: 1.05,
                    }}
                  >
                    Drop a few URLs.
                  </h1>
                  <p style={{ color: 'var(--ink-faint)', margin: 0 }}>
                    Optional but recommended. We’ll fetch their public surfaces and pull positioning
                    signals.
                  </p>
                </div>
                <div className="card" style={{ padding: 0 }}>
                  {competitors.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 14,
                        borderBottom: '1px solid var(--line)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                      }}
                    >
                      <span
                        className="mono"
                        style={{ fontSize: 11, color: 'var(--ink-faint)', width: 22 }}
                      >
                        0{i + 1}
                      </span>
                      <span
                        className="placeholder"
                        style={{ width: 28, height: 28, borderRadius: 6, fontSize: 9 }}
                      >
                        {new URL(c).hostname.slice(0, 2).toUpperCase()}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13 }}>
                          {new URL(c).hostname.replace('www.', '')}
                        </div>
                        <div
                          className="mono"
                          style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}
                        >
                          {analyzing ? 'FETCHING…' : 'PARSED · 14 SIGNALS'}
                        </div>
                      </div>
                      <span className="tag">DIRECT</span>
                      <button
                        className="btn sm ghost"
                        onClick={() => setCompetitors(competitors.filter((_, j) => j !== i))}
                        aria-label="Remove"
                      >
                        {I.x}
                      </button>
                    </div>
                  ))}
                  <div style={{ padding: 14, display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      placeholder="https://…"
                      value={newComp}
                      onChange={(e) => setNewComp(e.target.value)}
                    />
                    <button
                      className="btn"
                      onClick={() => {
                        if (newComp) {
                          setCompetitors([...competitors, newComp]);
                          setNewComp('');
                        }
                      }}
                    >
                      {I.plus} Add
                    </button>
                  </div>
                </div>
                {analyzing && (
                  <div
                    className="card"
                    style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}
                  >
                    <span
                      className="pulse"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--signal)',
                      }}
                    />
                    <div className="mono" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                      n8n · scraping competitor surfaces · ~3s remaining
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div
                className="fade-up"
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                <div>
                  <div className="eyebrow">05 · INDUSTRY</div>
                  <h1
                    className="r-h-display"
                    style={{
                      fontSize: 44,
                      letterSpacing: '-0.025em',
                      fontWeight: 500,
                      margin: '12px 0 8px',
                      lineHeight: 1.05,
                    }}
                  >
                    Let the agent classify — or pick yourself.
                  </h1>
                  <p style={{ color: 'var(--ink-faint)', margin: 0 }}>
                    The classification routes which clusters and prompt graphs run. You can override
                    anytime.
                  </p>
                </div>
                <div
                  className="r-2col"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
                >
                  <button
                    className="card"
                    onClick={() => setIndustry('auto')}
                    style={{
                      padding: 22,
                      textAlign: 'left',
                      borderColor: industry === 'auto' ? 'var(--signal)' : 'var(--line)',
                      background: industry === 'auto' ? 'var(--signal-soft)' : 'var(--bg-1)',
                    }}
                  >
                    <span style={{ color: 'var(--signal)' }}>{I.spark}</span>
                    <div style={{ fontWeight: 500, fontSize: 16, marginTop: 12 }}>
                      Let AI classify
                    </div>
                    <div style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 6 }}>
                      Suggested:{' '}
                      <span className="mono" style={{ color: 'var(--ink)' }}>
                        {picked}
                      </span>
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {['B2B SaaS', 'Fleet Ops', 'SMB tools', 'Compliance'].map((t) => (
                        <span key={t} className="tag" style={{ background: 'var(--bg-2)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </button>
                  <button
                    className="card"
                    onClick={() => setIndustry('manual')}
                    style={{
                      padding: 22,
                      textAlign: 'left',
                      borderColor: industry === 'manual' ? 'var(--signal)' : 'var(--line)',
                      background: industry === 'manual' ? 'var(--signal-soft)' : 'var(--bg-1)',
                    }}
                  >
                    <span style={{ color: 'var(--ink)' }}>{I.sliders}</span>
                    <div style={{ fontWeight: 500, fontSize: 16, marginTop: 12 }}>
                      Pick manually
                    </div>
                    <div style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 6 }}>
                      Choose from 142 verticals across 14 sectors.
                    </div>
                  </button>
                </div>
                {industry === 'manual' && (
                  <div
                    className="fade-up"
                    style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                  >
                    <input className="input" placeholder="Search industries…" />
                    <div className="card" style={{ padding: 0, maxHeight: 280, overflow: 'auto' }}>
                      {[
                        'Logistics SaaS · Fleet Ops',
                        'Logistics SaaS · TMS',
                        'Logistics · Marketplace',
                        'B2B SaaS · DevTools',
                        'B2B SaaS · CRM',
                        'Compliance · Trucking',
                        'Field Service · SMB',
                      ].map((opt) => (
                        <div
                          key={opt}
                          onClick={() => setPicked(opt)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--line)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: 'pointer',
                            background: picked === opt ? 'var(--bg-2)' : 'transparent',
                            fontSize: 13,
                          }}
                        >
                          <span
                            style={{
                              color: 'var(--signal)',
                              visibility: picked === opt ? 'visible' : 'hidden',
                            }}
                          >
                            {I.check}
                          </span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div
                className="fade-up"
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                <div>
                  <div className="eyebrow">06 · CONFIRM</div>
                  <h1
                    className="r-h-display"
                    style={{
                      fontSize: 44,
                      letterSpacing: '-0.025em',
                      fontWeight: 500,
                      margin: '12px 0 8px',
                      lineHeight: 1.05,
                    }}
                  >
                    Ready to interview.
                  </h1>
                  <p style={{ color: 'var(--ink-faint)', margin: 0 }}>
                    The agent will run 8 clusters, ~52 questions. Skips and follow‑ups adapt as you
                    go.
                  </p>
                </div>
                <div
                  className="card"
                  style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}
                >
                  <Row k="VENTURE" v={name} />
                  <Row
                    k="GEOGRAPHY"
                    v={`${primary}${secondary.length ? ' + ' + secondary.length + ' more' : ''}`}
                    sub={`${scope.toUpperCase()} · ${secondary.join(' · ')}`}
                  />
                  <Row
                    k="ARTIFACTS"
                    v={`${files.length} files`}
                    sub={`${files.reduce((a, f) => a + f.sigs, 0)} signals extracted`}
                  />
                  <Row
                    k="INDUSTRY"
                    v={picked}
                    sub={industry === 'auto' ? 'AI · 92% confidence' : 'Manual'}
                  />
                  <Row
                    k="COMPETITORS"
                    v={`${competitors.length} parsed`}
                    sub={competitors.map((c) => new URL(c).hostname).join(' · ')}
                  />
                  <Row k="EST. DURATION" v="12–18 min" sub="Skip anything that doesn't apply" />
                  <Row
                    k="EST. CREDITS"
                    v="0 cr"
                    sub="Interview is free · reports priced separately"
                  />
                </div>
                <div
                  className="card"
                  style={{
                    padding: 16,
                    display: 'flex',
                    gap: 14,
                    alignItems: 'start',
                    borderColor: 'color-mix(in oklch, var(--signal) 30%, var(--line))',
                  }}
                >
                  <span style={{ color: 'var(--signal)' }}>{I.zap}</span>
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 500 }}>Pro tip — connect a private endpoint</div>
                    <div style={{ color: 'var(--ink-faint)', marginTop: 4 }}>
                      Settings → AI · Plug your Azure / OpenAI / OpenRouter key for richer context.
                      Doesn’t cost Ilinga credits.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 36 }}>
              <button
                className="btn lg"
                onClick={back}
                disabled={step === 0}
                style={{ opacity: step === 0 ? 0.5 : 1 }}
              >
                {I.arrowLeft} Back
              </button>
              <div style={{ flex: 1 }} />
              <button className="btn primary lg" onClick={next} disabled={analyzing}>
                {step === 5 ? (
                  <>Start interview {I.arrow}</>
                ) : analyzing ? (
                  'Analyzing…'
                ) : (
                  <>Continue {I.arrow}</>
                )}
              </button>
            </div>
          </div>
        </main>

        {/* Right: live agent inference */}
        <aside
          style={{
            borderLeft: '1px solid var(--line)',
            background: 'var(--bg-1)',
            overflow: 'auto',
            padding: 24,
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            AGENT INFERENCE · LIVE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InferRow ok label="Persona" val="Solo & micro‑fleet operators" />
            <InferRow ok label="Wedge" val="Below 10‑truck fleets, mobile‑first" />
            <InferRow
              ok={step >= 1}
              label="Geography"
              val={`${primary}${secondary.length ? ' +' + secondary.length : ''}`}
            />
            <InferRow
              ok={step >= 2}
              label="Artifacts"
              val={`${files.length} files · ${files.reduce((a, f) => a + f.sigs, 0)} signals`}
            />
            <InferRow
              ok={step >= 3}
              label="Direct competitors"
              val={competitors.length ? `${competitors.length} parsed` : '—'}
            />
            <InferRow ok={step >= 4} label="Industry" val={picked} />
            <InferRow ok={step >= 5} label="Prompt graph" val="v2026.04 · ready" />
          </div>
          <div className="divider" style={{ margin: '24px 0' }} />
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            SIGNALS DETECTED
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              'ELD compliance',
              'IFTA',
              'load‑matching',
              'mobile‑first',
              'SMB',
              'underserved',
              'workflow gap',
              'broker disintermediation',
              'cross‑border',
              'NAFTA corridor',
            ].map((s, i) => (
              <span key={s} className="tag" style={{ opacity: i < 4 + step ? 1 : 0.35 }}>
                {s}
              </span>
            ))}
          </div>
          <div className="divider" style={{ margin: '24px 0' }} />
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            UPCOMING CLUSTERS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {window.CLUSTERS.slice(0, 8).map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 4px',
                  borderBottom: '1px dashed var(--line)',
                  fontSize: 12,
                }}
              >
                <span style={{ display: 'flex', gap: 8 }}>
                  <span className="mono" style={{ color: 'var(--ink-faint)' }}>
                    0{i + 1}
                  </span>
                  {c.label}
                </span>
                <span className="mono" style={{ color: 'var(--ink-faint)' }}>
                  {c.qs} Q
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
      <div
        className="mono"
        style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.10em', width: 130 }}
      >
        {k}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14 }}>{v}</div>
        {sub && (
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function InferRow({ ok, label, val }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        opacity: ok ? 1 : 0.4,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: ok ? 'var(--signal)' : 'var(--ink-faint)',
        }}
        className={ok ? 'pulse' : ''}
      />
      <div style={{ flex: 1 }}>
        <div
          className="mono"
          style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.06em' }}
        >
          {label.toUpperCase()}
        </div>
        <div style={{ fontSize: 13, marginTop: 2 }}>{val}</div>
      </div>
    </div>
  );
}

window.Onboarding = Onboarding;
Object.assign(window, { Onboarding });
