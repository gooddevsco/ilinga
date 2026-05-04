/* global React, I, useApp */
const { I, Icon, CLUSTERS, REPORTS, ACTIVITY, AppCtx, AppProvider, useApp } = window;
const { useState, useEffect, useMemo, useRef, createContext, useContext, Fragment } = React;

function Credits() {
  const { credits, setCredits, planCredits, toast } = useApp();
  const [plan, setPlan] = React.useState('studio');
  const [pack, setPack] = React.useState(500);

  const PACKS = [
    { c: 100, p: 19 },
    { c: 500, p: 79, popular: true },
    { c: 2000, p: 269 },
    { c: 10000, p: 1099 },
  ];
  const TX = [
    { d: 'APR 28', what: 'Render · Competitive Landscape', amt: -35, bal: 180 },
    { d: 'APR 27', what: 'Render · Snapshot', amt: 0, bal: 215 },
    { d: 'APR 25', what: 'Top‑up · 250 cr', amt: +250, bal: 215 },
    { d: 'APR 21', what: 'Re‑synthesize · GTM', amt: -8, bal: -35 },
    { d: 'APR 18', what: 'Monthly allowance · Studio', amt: +500, bal: -27 },
    { d: 'APR 12', what: 'Render · GTM Playbook', amt: -60, bal: -527 },
  ];

  return (
    <div
      className="r-pad"
      style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Balance + plan */}
      <div
        className="r-credits-balance"
        style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}
      >
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow">CURRENT BALANCE</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 14 }}>
            <span
              className="mono"
              style={{
                fontSize: 64,
                letterSpacing: '-0.03em',
                color: 'var(--signal)',
                fontWeight: 500,
              }}
            >
              {credits}
            </span>
            <span className="mono" style={{ fontSize: 16, color: 'var(--ink-faint)' }}>
              OF {planCredits} · CR
            </span>
          </div>
          <div className="bar" style={{ marginTop: 14 }}>
            <i style={{ width: `${(credits / planCredits) * 100}%` }} />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 28,
              marginTop: 18,
              color: 'var(--ink-faint)',
              fontSize: 12,
            }}
            className="mono"
          >
            <span>RESETS · MAY 1, 2026</span>
            <span>ROLLOVER · OFF</span>
            <span>BURN · 22 CR / DAY</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
            <button
              className="btn primary"
              onClick={() => {
                setCredits(credits + pack);
                toast(`Top‑up · ${pack} credits added`);
              }}
            >
              {I.plus} Add {pack} cr
            </button>
            <button className="btn">Switch plan</button>
            <button className="btn ghost">Auto top‑up · OFF</button>
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow">CURRENT PLAN</div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 500 }}>Studio</span>
            <span className="mono" style={{ color: 'var(--ink-faint)' }}>
              $49 / MO · 500 CR
            </span>
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <RowKv k="NEXT INVOICE" v="$49.00 · MAY 1" />
            <RowKv k="PAYMENT" v="VISA ··4242" />
            <RowKv k="STRIPE" v="acct_1Pn… · LIVE" />
            <RowKv k="VAT ID" v="GB287310042" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn sm">Update card</button>
            <button className="btn sm">Invoices</button>
          </div>
        </div>
      </div>

      {/* Packs */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
          <span className="eyebrow">CREDIT PACKS · ONE‑TIME</span>
          <span
            className="mono"
            style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-faint)' }}
          >
            STRIPE CHECKOUT · USD
          </span>
        </div>
        <div
          className="r-cards-4"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}
        >
          {PACKS.map((p) => (
            <button
              key={p.c}
              onClick={() => setPack(p.c)}
              className="card"
              style={{
                padding: 22,
                textAlign: 'left',
                borderColor: pack === p.c ? 'var(--signal)' : 'var(--line)',
                background: pack === p.c ? 'var(--signal-soft)' : 'var(--bg-1)',
              }}
            >
              {p.popular && (
                <div
                  className="mono"
                  style={{ fontSize: 10, color: 'var(--signal)', letterSpacing: '0.10em' }}
                >
                  BEST VALUE
                </div>
              )}
              <div
                className="mono"
                style={{ fontSize: 32, marginTop: 10, letterSpacing: '-0.02em' }}
              >
                {p.c.toLocaleString()}
                <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}> CR</span>
              </div>
              <div style={{ marginTop: 10, color: 'var(--ink-faint)', fontSize: 12 }}>
                ${p.p}{' '}
                <span className="mono" style={{ marginLeft: 6 }}>
                  · ${((p.p / p.c) * 100).toFixed(2)}/CR
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ledger */}
      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 500 }}>Ledger</span>
          <span
            className="mono"
            style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-faint)' }}
          >
            SYNCED FROM STRIPE · 30 DAYS
          </span>
        </div>
        <table className="cmp">
          <thead>
            <tr>
              <th>Date</th>
              <th>Activity</th>
              <th style={{ textAlign: 'right' }}>Δ Credits</th>
              <th style={{ textAlign: 'right' }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {TX.map((t, i) => (
              <tr key={i}>
                <td className="mono" style={{ color: 'var(--ink-faint)' }}>
                  {t.d}
                </td>
                <td>{t.what}</td>
                <td
                  className="mono"
                  style={{
                    textAlign: 'right',
                    color:
                      t.amt > 0 ? 'var(--signal)' : t.amt < 0 ? 'var(--paper)' : 'var(--ink-faint)',
                  }}
                >
                  {t.amt > 0 ? '+' : ''}
                  {t.amt}
                </td>
                <td className="mono" style={{ textAlign: 'right' }}>
                  {Math.max(0, 180 - i * 30)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowKv({ k, v }) {
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
      <span className="mono" style={{ fontSize: 12 }}>
        {v}
      </span>
    </div>
  );
}

// SETTINGS
function Settings() {
  const [tab, setTab] = React.useState('ai');
  const TABS = [
    { id: 'workspace', l: 'Workspace' },
    { id: 'ai', l: 'AI endpoints' },
    { id: 'templates', l: 'Templates' },
    { id: 'team', l: 'Team' },
    { id: 'data', l: 'Data & privacy' },
    { id: 'webhooks', l: 'Webhooks' },
  ];
  return (
    <div
      className="r-settings-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        minHeight: '100%',
        maxHeight: 'calc(100vh - 53px)',
      }}
    >
      <aside style={{ borderRight: '1px solid var(--line)', padding: 14 }}>
        <div className="eyebrow" style={{ padding: '4px 8px' }}>
          SETTINGS
        </div>
        <div style={{ marginTop: 8 }}>
          {TABS.map((t) => (
            <div
              key={t.id}
              className={`nav-item ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.l}
            </div>
          ))}
        </div>
      </aside>
      <main style={{ overflow: 'auto', padding: 28 }}>
        {tab === 'ai' && <AIEndpoints />}
        {tab === 'templates' && <TemplateSettings />}
        {tab === 'workspace' && <Workspace />}
        {tab === 'team' && <Team />}
        {tab === 'data' && <DataPrivacy />}
        {tab === 'webhooks' && <Webhooks />}
      </main>
    </div>
  );
}

function AIEndpoints() {
  const [endpoints, setEndpoints] = React.useState([
    {
      id: 1,
      name: 'Northwind · Azure GPT‑4o',
      kind: 'azure',
      model: 'gpt‑4o',
      status: 'connected',
      primary: true,
      used: '142k tokens · 24h',
    },
    {
      id: 2,
      name: 'Anthropic · Claude Sonnet 4',
      kind: 'anthropic',
      model: 'claude‑sonnet‑4',
      status: 'connected',
      primary: false,
      used: '38k tokens · 24h',
    },
  ]);
  const [showAdd, setShowAdd] = React.useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="eyebrow">SETTINGS · AI ENDPOINTS</div>
        <h1
          style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: '6px 0 6px' }}
        >
          Bring your own model.
        </h1>
        <p style={{ color: 'var(--ink-faint)', maxWidth: 560, margin: 0 }}>
          Plug in your private AI endpoint and we&apos;ll route synthesis through it. Tokens billed
          by your provider; you only spend Ilinga credits on rendering and orchestration.
        </p>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 500 }}>Connected endpoints</span>
          <span
            className="mono"
            style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-faint)' }}
          >
            {endpoints.length} ACTIVE
          </span>
          <button
            className="btn sm primary"
            style={{ marginLeft: 12 }}
            onClick={() => setShowAdd(true)}
          >
            {I.plus} Add endpoint
          </button>
        </div>
        {endpoints.map((e) => (
          <div
            key={e.id}
            style={{
              padding: 18,
              borderBottom: '1px solid var(--line)',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto auto',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                border: '1px solid var(--line)',
                borderRadius: 6,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--signal)',
              }}
            >
              {I.api}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{e.name}</span>
                {e.primary && (
                  <span className="tag signal">
                    <span className="dot" /> PRIMARY
                  </span>
                )}
              </div>
              <div
                className="mono"
                style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}
              >
                {e.kind.toUpperCase()} · {e.model.toUpperCase()} · {e.used.toUpperCase()}
              </div>
            </div>
            <span className="tag signal">
              <span className="dot" /> CONNECTED
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn sm">Test</button>
              <button className="btn sm">Edit</button>
            </div>
          </div>
        ))}
        <div
          style={{
            padding: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            color: 'var(--ink-faint)',
          }}
        >
          <span>{I.spark}</span>
          <span style={{ fontSize: 13 }}>
            Endpoints are encrypted at rest with workspace‑scoped KMS keys. Rotated automatically
            every 90 days.
          </span>
        </div>
      </div>

      {showAdd && (
        <div className="card fade-up" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="eyebrow">ADD ENDPOINT</div>
            <button
              className="btn sm ghost"
              style={{ marginLeft: 'auto' }}
              onClick={() => setShowAdd(false)}
            >
              {I.x}
            </button>
          </div>
          <div
            className="r-cards-4"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              marginTop: 14,
            }}
          >
            {[
              { id: 'openai', l: 'OpenAI' },
              { id: 'azure', l: 'Azure OpenAI' },
              { id: 'anthropic', l: 'Anthropic' },
              { id: 'openrouter', l: 'OpenRouter' },
              { id: 'bedrock', l: 'AWS Bedrock' },
              { id: 'vertex', l: 'Google Vertex' },
              { id: 'ollama', l: 'Ollama (self‑host)' },
              { id: 'custom', l: 'Custom OpenAI‑compat' },
            ].map((p) => (
              <button key={p.id} className="btn">
                {p.l}
              </button>
            ))}
          </div>
          <div
            className="r-2col"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}
          >
            <div>
              <label className="field-label">Display name</label>
              <input className="input" placeholder="Northwind · Azure prod" />
            </div>
            <div>
              <label className="field-label">Model id</label>
              <input className="input" placeholder="gpt-4o-2024-11-20" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">Endpoint URL</label>
              <input
                className="input"
                placeholder="https://northwind.openai.azure.com/openai/deployments/…"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">API key · stored encrypted</label>
              <input className="input" type="password" placeholder="••••••••" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn">Test connection</button>
            <div style={{ flex: 1 }} />
            <button className="btn ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
            <button className="btn primary">Save endpoint</button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 22 }}>
        <div className="eyebrow">ROUTING</div>
        <p style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 8 }}>
          Pick which endpoint handles which workload.
        </p>
        <div style={{ marginTop: 14 }}>
          {[
            { l: 'Interview follow‑ups', e: 'Anthropic · Claude Sonnet 4' },
            { l: 'Module synthesis', e: 'Northwind · Azure GPT‑4o' },
            { l: 'Report rendering', e: 'Northwind · Azure GPT‑4o' },
            { l: 'Embeddings (artifact search)', e: 'OpenAI · text-embedding-3-large' },
          ].map((r) => (
            <div
              key={r.l}
              className="r-2col"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 320px',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px dashed var(--line)',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 13 }}>{r.l}</span>
              <select className="select">
                <option>{r.e}</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateSettings() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="eyebrow">SETTINGS · REPORT TEMPLATES</div>
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: '6px 0' }}>
          Tenant report templates.
        </h1>
        <p style={{ color: 'var(--ink-faint)', margin: 0 }}>
          Upload your house style as HTML+CSS or Handlebars. Reports render against your tokens.
        </p>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {[
          { n: 'Northwind · house style', t: 'HTML + Handlebars', sz: '38 KB', a: 'PRIMARY' },
          { n: 'Investor memo · 2026', t: 'HTML + Handlebars', sz: '61 KB', a: 'SECONDARY' },
          { n: 'McKinsey clone', t: 'SYSTEM', sz: '—', a: 'SYSTEM' },
        ].map((t, i) => (
          <div
            key={i}
            style={{
              padding: 16,
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                border: '1px solid var(--line)',
                borderRadius: 6,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--ink-faint)',
              }}
            >
              {I.doc}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{t.n}</div>
              <div
                className="mono"
                style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}
              >
                {t.t.toUpperCase()} · {t.sz}
              </div>
            </div>
            <span className="tag">{t.a}</span>
            <button className="btn sm">Edit keys</button>
            <button className="btn sm">Preview</button>
          </div>
        ))}
        <div style={{ padding: 16, display: 'flex', gap: 10 }}>
          <button className="btn">{I.upload} Upload template</button>
          <button className="btn">Browse marketplace</button>
        </div>
      </div>
    </div>
  );
}

function Workspace() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="eyebrow">SETTINGS · WORKSPACE</div>
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: '6px 0' }}>
          Tenant profile.
        </h1>
      </div>
      <div
        className="card r-2col"
        style={{ padding: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
      >
        <div>
          <label className="field-label">Workspace name</label>
          <input className="input" defaultValue="Northwind Labs" />
        </div>
        <div>
          <label className="field-label">Slug · permanent</label>
          <input className="input" defaultValue="northwind" disabled />
        </div>
        <div>
          <label className="field-label">Default tone</label>
          <select className="select">
            <option>McKinsey · contrarian</option>
            <option>Editorial</option>
            <option>Investor</option>
          </select>
        </div>
        <div>
          <label className="field-label">Locale</label>
          <select className="select">
            <option>en‑US</option>
            <option>en‑GB</option>
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="field-label">About</label>
          <textarea
            className="textarea"
            defaultValue="Studio building category‑defining workflow software for underserved SMB verticals."
          />
        </div>
      </div>
    </div>
  );
}

function Team() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="eyebrow">SETTINGS · TEAM</div>
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: '6px 0' }}>
          Members & roles.
        </h1>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {[
          { n: 'Ada Okonkwo', e: 'ada@northwind.co', r: 'Owner', s: 'A' },
          { n: 'Jonas Linde', e: 'jonas@northwind.co', r: 'Admin', s: 'J' },
          { n: 'Mei Chen', e: 'mei@northwind.co', r: 'Editor', s: 'M' },
          { n: 'Outside counsel', e: 'pat@firm.com', r: 'Viewer', s: 'P' },
        ].map((m, i) => (
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
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--bg-3)',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 500,
              }}
            >
              {m.s}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{m.n}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                {m.e}
              </div>
            </div>
            <span className="tag">{m.r.toUpperCase()}</span>
            <button className="btn sm ghost">{I.more}</button>
          </div>
        ))}
        <div style={{ padding: 14 }}>
          <button className="btn">{I.plus} Invite member</button>
        </div>
      </div>
    </div>
  );
}

function DataPrivacy() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="eyebrow">SETTINGS · DATA & PRIVACY</div>
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: '6px 0' }}>
          What we keep, where, and for how long.
        </h1>
      </div>
      <div
        className="card"
        style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <ToggleRow
          on
          label="Tenant‑isolated storage"
          sub="Encrypted at rest with workspace KMS · eu‑west‑2"
        />
        <ToggleRow
          on
          label="No model training on your data"
          sub="Always enforced — even for system endpoints"
        />
        <ToggleRow
          label="Auto‑delete artifacts after cycle close"
          sub="Default 90 days · audit log retained"
        />
        <ToggleRow on label="SOC 2 Type II evidence" sub="Available on Firm plan" />
      </div>
    </div>
  );
}

function ToggleRow({ on = false, label, sub }) {
  const [v, setV] = React.useState(on);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '8px 0',
        borderBottom: '1px dashed var(--line)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 2 }}>{sub}</div>
      </div>
      <button
        onClick={() => setV(!v)}
        style={{
          width: 36,
          height: 20,
          borderRadius: 999,
          background: v ? 'var(--signal)' : 'var(--bg-3)',
          border: '1px solid var(--line-2)',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: v ? 18 : 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: v ? 'var(--signal-ink)' : 'var(--paper)',
            transition: 'left 120ms ease',
          }}
        />
      </button>
    </div>
  );
}

function Webhooks() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="eyebrow">SETTINGS · WEBHOOKS</div>
        <h1 style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: '6px 0' }}>
          Wire Ilinga to your stack.
        </h1>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {[
          {
            url: 'https://n8n.northwind.co/webhook/vc-events',
            e: 'cycle.complete · report.rendered',
            s: 'OK · 200ms',
          },
          { url: 'https://hooks.slack.com/services/T0…', e: 'report.rendered', s: 'OK · 312ms' },
          { url: 'https://api.northwind.co/vc-ingest', e: '*', s: 'WARNING · 5xx' },
        ].map((h, i) => (
          <div
            key={i}
            style={{
              padding: 14,
              borderBottom: '1px solid var(--line)',
              display: 'grid',
              gridTemplateColumns: '1fr 240px auto auto',
              gap: 14,
              alignItems: 'center',
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 12,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {h.url}
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              {h.e.toUpperCase()}
            </div>
            <span
              className="tag"
              style={{
                color: h.s.includes('WARN') ? 'var(--warn)' : 'var(--signal)',
                borderColor: 'currentColor',
              }}
            >
              {h.s}
            </span>
            <button className="btn sm ghost">{I.more}</button>
          </div>
        ))}
        <div style={{ padding: 14 }}>
          <button className="btn">{I.plus} Add webhook</button>
        </div>
      </div>
    </div>
  );
}

window.Credits = Credits;
window.Settings = Settings;
Object.assign(window, { Credits, Settings });
