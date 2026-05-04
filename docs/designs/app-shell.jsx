/* global React, I, useApp, CLUSTERS, REPORTS, ACTIVITY */
const { I, Icon, CLUSTERS, REPORTS, ACTIVITY, AppCtx, AppProvider, useApp } = window;
const { useState, useEffect, useMemo, useRef, createContext, useContext, Fragment } = React;

function NavList({ NAV, NAV_2, appView, setAppView, onPick }) {
  return (
    <div style={{ padding: '8px 12px', flex: 1 }}>
      <div className="nav-section">Workspace</div>
      {NAV.map((n) => (
        <div
          key={n.id}
          className={`nav-item ${appView === n.id ? 'active' : ''}`}
          onClick={() => {
            setAppView(n.id);
            onPick && onPick();
          }}
        >
          <span className="ico">{n.ico}</span>
          {n.label}
        </div>
      ))}
      <div className="nav-section">Account</div>
      {NAV_2.map((n) => (
        <div
          key={n.id}
          className={`nav-item ${appView === n.id ? 'active' : ''}`}
          onClick={() => {
            setAppView(n.id);
            onPick && onPick();
          }}
        >
          <span className="ico">{n.ico}</span>
          {n.label}
        </div>
      ))}
    </div>
  );
}

function AppShell({ children }) {
  const { appView, setAppView, tenant, credits, planCredits, setRoute } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const NAV = [
    { id: 'dashboard', label: 'Dashboard', ico: I.chart },
    { id: 'venture', label: 'Venture', ico: I.cycle },
    { id: 'questions', label: 'Interview', ico: I.cluster },
    { id: 'synthesis', label: 'Synthesis', ico: I.spark },
    { id: 'outputs', label: 'Outputs', ico: I.module },
    { id: 'reports', label: 'Reports', ico: I.doc },
  ];
  const NAV_2 = [
    { id: 'credits', label: 'Credits & billing', ico: I.credits },
    { id: 'settings', label: 'Settings', ico: I.settings },
  ];

  const Brand = () => (
    <div style={{ padding: '16px 14px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: 'var(--signal)' }}>{I.logo(18)}</span>
      <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>Ilinga</span>
      <button
        className="btn sm ghost"
        onClick={() => setRoute('landing')}
        style={{ marginLeft: 'auto', padding: '2px 6px', height: 22 }}
        title="Exit"
      >
        {I.x}
      </button>
    </div>
  );
  const WorkspacePill = () => (
    <div
      style={{
        margin: '10px 12px 6px',
        padding: 10,
        border: '1px solid var(--line)',
        borderRadius: 8,
        background: 'var(--bg-1)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: 'var(--signal)',
          color: 'var(--signal-ink)',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 600,
          fontSize: 12,
        }}
      >
        NW
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Northwind Labs
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>
          STUDIO PLAN
        </div>
      </div>
    </div>
  );
  const CreditsBox = () => (
    <div style={{ padding: 12, borderTop: '1px solid var(--line)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <span
          className="mono"
          style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.10em' }}
        >
          CREDITS
        </span>
        <span className="mono" style={{ fontSize: 13 }}>
          <span style={{ color: 'var(--signal)' }}>{credits}</span>
          <span style={{ color: 'var(--ink-faint)' }}> / {planCredits}</span>
        </span>
      </div>
      <div className="bar">
        <i style={{ width: `${(credits / planCredits) * 100}%` }} />
      </div>
      <button
        className="btn sm"
        style={{ width: '100%', marginTop: 10 }}
        onClick={() => {
          setAppView('credits');
          setDrawerOpen(false);
        }}
      >
        Top up
      </button>
    </div>
  );

  return (
    <div
      className="r-app-shell"
      style={{ display: 'grid', gridTemplateColumns: '244px 1fr', minHeight: '100vh' }}
    >
      <aside
        className="r-sidebar"
        style={{
          borderRight: '1px solid var(--line)',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Brand />
        <WorkspacePill />
        <NavList NAV={NAV} NAV_2={NAV_2} appView={appView} setAppView={setAppView} />
        <CreditsBox />
      </aside>

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar onMenu={() => setDrawerOpen(true)} />
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{children}</div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`r-drawer-mask ${drawerOpen ? 'open' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`r-drawer-panel ${drawerOpen ? 'open' : ''}`}>
        <Brand />
        <WorkspacePill />
        <NavList
          NAV={NAV}
          NAV_2={NAV_2}
          appView={appView}
          setAppView={setAppView}
          onPick={() => setDrawerOpen(false)}
        />
        <CreditsBox />
      </aside>
    </div>
  );
}

function Topbar({ onMenu }) {
  const { appView, setAppView } = useApp();
  const titles = {
    dashboard: 'Dashboard',
    venture: 'Venture · Northwind Cargo',
    questions: 'Interview',
    outputs: 'Module outputs',
    reports: 'Reports',
    'report-detail': 'Report',
    credits: 'Credits & billing',
    settings: 'Settings',
    synthesis: 'Synthesis pipeline',
  };
  return (
    <header
      style={{
        borderBottom: '1px solid var(--line)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--bg)',
      }}
    >
      <button className="btn sm r-mobile-only" onClick={onMenu} style={{ padding: '4px 8px' }}>
        {I.menu}
      </button>
      <span
        className="mono r-mobile-hide"
        style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.10em' }}
      >
        NORTHWIND / NORTHWIND CARGO /
      </span>
      <span style={{ fontWeight: 500, fontSize: 14 }}>{titles[appView]}</span>
      <div style={{ flex: 1 }} />
      <div
        className="r-mobile-hide"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          border: '1px solid var(--line)',
          borderRadius: 6,
          padding: '6px 10px',
          background: 'var(--bg-1)',
          minWidth: 280,
        }}
      >
        <span style={{ color: 'var(--ink-faint)' }}>{I.search}</span>
        <span style={{ color: 'var(--ink-faint)', fontSize: 13 }}>Search modules, reports…</span>
        <span style={{ flex: 1 }} />
        <span className="kbd">⌘ K</span>
      </div>
      <button className="btn sm r-mobile-hide">{I.bell}</button>
      <button className="btn sm">
        {I.user}
        <span className="r-mobile-hide">Ada O.</span>
      </button>
    </header>
  );
}

window.AppShell = AppShell;
Object.assign(window, { AppShell });
