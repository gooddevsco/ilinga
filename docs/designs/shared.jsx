/* global React */
const { useState, useEffect, useMemo, useRef, createContext, useContext } = React;

// ---------- Icons (1.5 stroke, 16px) ----------
const Icon = ({ d, size = 16, fill, stroke = 'currentColor', sw = 1.5, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill={fill || 'none'}
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const I = {
  logo: (size = 18) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path
        d="M12 4 L18 12 L12 20 L6 12 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="currentColor"
        fillOpacity="0.18"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    </svg>
  ),
  arrow: <Icon d="M3 8h10M9 4l4 4-4 4" />,
  arrowLeft: <Icon d="M13 8H3M7 4l-4 4 4 4" />,
  check: <Icon d="M3 8.5 6.5 12 13 4.5" />,
  plus: <Icon d="M8 3v10M3 8h10" />,
  x: <Icon d="M4 4l8 8M12 4l-8 8" />,
  search: (
    <Icon
      d={
        <>
          <circle cx="7" cy="7" r="4" />
          <path d="m13 13-2.5-2.5" />
        </>
      }
    />
  ),
  spark: (
    <Icon d="M8 2v4M8 10v4M2 8h4M10 8h4M4 4l2.5 2.5M9.5 9.5 12 12M4 12l2.5-2.5M9.5 6.5 12 4" />
  ),
  lock: (
    <Icon
      d={
        <>
          <rect x="3" y="7" width="10" height="7" rx="1.5" />
          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
        </>
      }
    />
  ),
  unlock: (
    <Icon
      d={
        <>
          <rect x="3" y="7" width="10" height="7" rx="1.5" />
          <path d="M5.5 7V5a2.5 2.5 0 0 1 4.5-1.5" />
        </>
      }
    />
  ),
  download: <Icon d="M8 2v9M4.5 7.5 8 11l3.5-3.5M3 14h10" />,
  doc: (
    <Icon
      d={
        <>
          <path d="M4 1.5h5l3 3V14a.5.5 0 0 1-.5.5h-7A.5.5 0 0 1 4 14V2a.5.5 0 0 1 .5-.5z" />
          <path d="M9 1.5v3h3M6 8h4M6 10.5h4M6 5.5h1.5" />
        </>
      }
    />
  ),
  cluster: (
    <Icon
      d={
        <>
          <circle cx="4" cy="4" r="2" />
          <circle cx="12" cy="4" r="2" />
          <circle cx="8" cy="12" r="2" />
          <path d="M5.4 5.4 6.6 10.6M10.6 5.4 9.4 10.6M6 4h4" />
        </>
      }
    />
  ),
  module: (
    <Icon
      d={
        <>
          <rect x="2" y="2" width="5" height="5" />
          <rect x="9" y="2" width="5" height="5" />
          <rect x="2" y="9" width="5" height="5" />
          <rect x="9" y="9" width="5" height="5" />
        </>
      }
    />
  ),
  chart: <Icon d="M2 13h12M4 11V7M7 11V4M10 11v-3M13 11V6" />,
  credits: (
    <Icon
      d={
        <>
          <circle cx="8" cy="8" r="6" />
          <path d="M8 5v6M5.5 8h5" />
        </>
      }
    />
  ),
  settings: (
    <Icon
      d={
        <>
          <circle cx="8" cy="8" r="2" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4" />
        </>
      }
    />
  ),
  bell: <Icon d="M4 11V7a4 4 0 0 1 8 0v4l1 1H3l1-1zM7 14h2" />,
  zap: <Icon d="M9 1 3 9h4l-1 6 6-8H8l1-6z" fill="currentColor" stroke="none" />,
  user: (
    <Icon
      d={
        <>
          <circle cx="8" cy="5.5" r="2.5" />
          <path d="M3 14c.8-2.5 2.7-4 5-4s4.2 1.5 5 4" />
        </>
      }
    />
  ),
  globe: (
    <Icon
      d={
        <>
          <circle cx="8" cy="8" r="6" />
          <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" />
        </>
      }
    />
  ),
  flag: <Icon d="M3.5 14V2M3.5 3h8l-1.5 2.5L11.5 8H3.5" />,
  sliders: <Icon d="M3 4h6M11 4h2M3 8h2M7 8h6M3 12h8M13 12h0M9 2v4M5 6v4M11 10v4" />,
  cycle: <Icon d="M3 8a5 5 0 0 1 9-3M13 8a5 5 0 0 1-9 3M11 2v3h3M5 14v-3H2" />,
  upload: <Icon d="M8 11V2M4.5 5.5 8 2l3.5 3.5M3 14h10" />,
  card: (
    <Icon
      d={
        <>
          <rect x="2" y="4" width="12" height="9" rx="1.5" />
          <path d="M2 7h12M5 11h2" />
        </>
      }
    />
  ),
  api: <Icon d="M2 8h3M11 8h3M5 8a3 3 0 0 1 6 0 3 3 0 0 1-6 0zM8 1v2M8 13v2" />,
  external: <Icon d="M9 3h4v4M13 3 7 9M11 9v4H3V5h4" />,
  more: <Icon d="M3 8h.01M8 8h.01M13 8h.01" sw={2.5} />,
  menu: <Icon d="M2.5 4h11M2.5 8h11M2.5 12h11" />,
  filter: <Icon d="M2 3h12L9.5 8.5V13L6.5 14V8.5L2 3z" />,
  team: (
    <Icon
      d={
        <>
          <circle cx="6" cy="6" r="2" />
          <circle cx="11.5" cy="6.5" r="1.5" />
          <path d="M2 13c.5-2 2-3 4-3s3.5 1 4 3M10 13c0-1.2.5-2.2 1.5-2.7" />
        </>
      }
    />
  ),
};

// ---------- Mock data ----------
const CLUSTERS = [
  {
    id: 'positioning',
    label: 'Positioning',
    modules: ['Audience', 'Promise', 'Proof'],
    qs: 6,
    done: 6,
  },
  {
    id: 'market',
    label: 'Market & TAM',
    modules: ['Sizing', 'Segments', 'Geography'],
    qs: 8,
    done: 8,
  },
  {
    id: 'competition',
    label: 'Competition',
    modules: ['Direct', 'Indirect', 'Substitutes'],
    qs: 7,
    done: 5,
  },
  { id: 'gtm', label: 'Go‑to‑Market', modules: ['Channels', 'Pricing', 'Funnel'], qs: 9, done: 0 },
  { id: 'product', label: 'Product Strategy', modules: ['MVP', 'Roadmap', 'Moat'], qs: 7, done: 0 },
  { id: 'unit-econ', label: 'Unit Economics', modules: ['CAC', 'LTV', 'Payback'], qs: 6, done: 0 },
  {
    id: 'risk',
    label: 'Risk & Compliance',
    modules: ['Regulatory', 'Operational', 'Tech'],
    qs: 5,
    done: 0,
  },
  {
    id: 'team',
    label: 'Team & Capital',
    modules: ['Roles', 'Capital', 'Milestones'],
    qs: 6,
    done: 0,
  },
];

const REPORTS = [
  {
    id: 'snapshot',
    name: 'Venture Snapshot',
    desc: 'One‑page summary of positioning, market and risks.',
    cost: 0,
    pages: 4,
    locked: false,
    tier: 'Free',
  },
  {
    id: 'market-deep',
    name: 'Market Deep‑Dive',
    desc: 'TAM/SAM/SOM, segmentation, growth vectors, geographic heatmap.',
    cost: 40,
    pages: 22,
    locked: true,
    tier: 'Pro',
  },
  {
    id: 'competitive',
    name: 'Competitive Landscape',
    desc: 'Feature parity, pricing matrix, narrative map, defensibility.',
    cost: 35,
    pages: 18,
    locked: true,
    tier: 'Pro',
  },
  {
    id: 'gtm-playbook',
    name: 'GTM Playbook',
    desc: 'Channel mix, ICP, funnel maths, messaging hierarchy.',
    cost: 60,
    pages: 28,
    locked: true,
    tier: 'Pro',
  },
  {
    id: 'investor',
    name: 'Investor Memo',
    desc: 'Narrative + financials, risks, asks. Editor‑tuned tone.',
    cost: 90,
    pages: 14,
    locked: true,
    tier: 'Premium',
  },
  {
    id: 'unit-econ',
    name: 'Unit Economics Model',
    desc: 'CAC/LTV scenarios, payback curves, sensitivity grid.',
    cost: 75,
    pages: 12,
    locked: true,
    tier: 'Premium',
  },
];

const ACTIVITY = [
  {
    t: '2m',
    who: 'n8n · agent',
    what: 'Generated 3 follow‑ups in Competition cluster',
    tone: 'signal',
  },
  { t: '14m', who: 'You', what: 'Answered 5 questions in Market & TAM' },
  { t: '1h', who: 'Stripe', what: 'Top‑up · 250 credits · invoice INV‑0421' },
  { t: '3h', who: 'n8n · agent', what: 'Inferred industry: B2B SaaS · DevTools' },
  { t: 'Yesterday', who: 'You', what: 'Created venture “Northwind Cargo”' },
];

// ---------- App shell context ----------
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

function AppProvider({ children }) {
  const [route, setRoute] = useState('landing'); // landing | signup | onboarding | app
  const [appView, setAppView] = useState('dashboard'); // dashboard | venture | questions | outputs | reports | report-detail | credits | settings
  const [credits, setCredits] = useState(180);
  const [planCredits] = useState(500);
  const [tenant, setTenant] = useState({
    name: 'Northwind Cargo',
    workspace: 'northwind',
    industry: 'Logistics SaaS',
    plan: 'Studio',
  });
  const [activeReport, setActiveReport] = useState('competitive');
  const [toasts, setToasts] = useState([]);
  const toast = (msg) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  const value = {
    route,
    setRoute,
    appView,
    setAppView,
    credits,
    setCredits,
    planCredits,
    tenant,
    setTenant,
    activeReport,
    setActiveReport,
    toast,
  };
  return (
    <AppCtx.Provider value={value}>
      {children}
      <Toasts toasts={toasts} />
    </AppCtx.Provider>
  );
}

function Toasts({ toasts }) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 90,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="fade-up"
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--line-2)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 240,
          }}
        >
          <span style={{ color: 'var(--signal)' }}>{I.check}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// expose
Object.assign(window, { I, Icon, CLUSTERS, REPORTS, ACTIVITY, AppCtx, AppProvider, useApp });
