import { Link, Outlet } from 'react-router-dom';
import { useTheme } from '../lib/theme';

export const MarketingLayout = (): JSX.Element => {
  const { theme, setTheme } = useTheme();
  const cycleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light');
  };
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Ilinga
          </Link>
          <nav className="ml-6 flex gap-5 text-sm text-[color:var(--color-fg-muted)]">
            <Link to="/pricing">Pricing</Link>
            <Link to="/help">Help</Link>
            <Link to="/legal/security">Security</Link>
            <Link to="/legal/privacy">Privacy</Link>
            <Link to="/developers/docs">Developers</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={cycleTheme}
              className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5"
              aria-label={`Theme: ${theme}`}
            >
              {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}
            </button>
            <Link
              to="/sign-in"
              className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              to="/sign-up"
              className="rounded-md bg-[color:var(--color-accent)] px-3 py-1.5 text-[color:var(--color-accent-fg)]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        <Outlet />
      </main>
      <footer className="border-t border-[color:var(--color-border)] py-8 text-sm text-[color:var(--color-fg-muted)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
          <div>© {new Date().getFullYear()} Ilinga. All rights reserved.</div>
          <nav className="flex gap-4">
            <Link to="/legal/terms">Terms</Link>
            <Link to="/legal/privacy">Privacy</Link>
            <Link to="/legal/dpa">DPA</Link>
            <Link to="/legal/cookies">Cookies</Link>
            <Link to="/status">Status</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};
