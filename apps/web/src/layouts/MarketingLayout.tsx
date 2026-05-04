import { Link, Outlet } from 'react-router-dom';
import { Button, IconLogo, Tag } from '@ilinga/ui';

const navItems: { to: string; label: string }[] = [
  { to: '/', label: 'Product' },
  { to: '/help', label: 'Reports' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/help', label: 'Changelog' },
  { to: '/developers/docs', label: 'Docs' },
];

export const MarketingLayout = (): JSX.Element => (
  <div className="flex min-h-screen flex-col" style={{ background: 'var(--paper)' }}>
    <header
      className="sticky top-0 z-30 border-b border-[color:var(--line)]"
      style={{
        background: 'rgba(250,246,239,0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="mx-auto flex items-center gap-6 px-7"
        style={{ maxWidth: 1280, padding: '14px 28px' }}
      >
        <Link to="/" className="flex items-center gap-2.5">
          <span style={{ color: 'var(--signal)' }}>
            <IconLogo size={18} />
          </span>
          <span className="text-[14px]" style={{ fontWeight: 600 }}>
            Ilinga
          </span>
          <Tag tone="signal" className="ml-1">
            v0.9 · beta
          </Tag>
        </Link>
        <nav
          className="r-mobile-hide ml-2.5 flex gap-5 text-[13px] text-[color:var(--ink-mute)]"
          aria-label="Marketing"
        >
          {navItems.map((n) => (
            <Link key={n.label} to={n.to} className="hover:text-[color:var(--ink)]">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2.5">
          <Link to="/sign-in">
            <Button variant="ghost" size="sm" type="button">
              Sign in
            </Button>
          </Link>
          <Link to="/sign-up">
            <Button variant="primary" size="sm" type="button">
              Start a venture →
            </Button>
          </Link>
        </div>
      </div>
    </header>
    <main className="flex-1">
      <Outlet />
    </main>
  </div>
);
