import { Link, Outlet } from 'react-router-dom';
import { IconLogo } from '@ilinga/ui';

export interface AuthLayoutOutletContext {
  caption: string;
  sub?: string;
}

const BrandMark = ({ size = 22 }: { size?: number }): JSX.Element => (
  <Link to="/" className="flex items-center gap-2.5">
    <span style={{ color: 'var(--signal)' }}>
      <IconLogo size={size} />
    </span>
    <span
      className="serif text-[18px] tracking-tight"
      style={{ fontWeight: 500, color: 'var(--ink)' }}
    >
      Ilinga
    </span>
  </Link>
);

const AuthArt = ({ caption, sub }: { caption: string; sub?: string }): JSX.Element => (
  <div className="auth-art-pane r-mobile-hide">
    <div
      className="grid-bg pointer-events-none absolute inset-0"
      style={{ opacity: 0.3 }}
      aria-hidden="true"
    />
    <svg
      viewBox="0 0 600 800"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <pattern id="auth-dots" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="rgba(31,27,22,0.18)" />
        </pattern>
      </defs>
      <rect width="600" height="800" fill="url(#auth-dots)" />
      <g
        transform="translate(300,360)"
        stroke="#B8531C"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      >
        <circle r="160" />
        <path d="M -120 -10 q 0 -90 80 -90 t 80 90" />
        <path d="M -120 10 q 0 90 80 90 t 80 -90" />
        <circle r="6" fill="#B8531C" />
        <circle r="92" strokeDasharray="4 8" opacity="0.6" />
      </g>
      <g transform="translate(0,640)">
        <rect width="600" height="6" y="0" fill="#B8531C" />
        <rect width="600" height="2" y="14" fill="#284B63" />
        <rect width="600" height="10" y="22" fill="#C58A2C" />
        <rect width="600" height="2" y="40" fill="#5B7A3A" />
        <rect width="600" height="4" y="48" fill="#B8531C" opacity="0.5" />
      </g>
      <g transform="translate(56,80)" fill="#1F1B16">
        <text fontFamily="JetBrains Mono, monospace" fontSize="11" letterSpacing="3" opacity="0.55">
          ILINGA · STUDIO
        </text>
      </g>
    </svg>
    <div className="absolute" style={{ left: 56, right: 56, bottom: 88, color: 'var(--ink)' }}>
      <div className="eyebrow mb-3.5">From Ilinga</div>
      <div
        className="serif"
        style={{
          fontSize: 28,
          lineHeight: 1.18,
          letterSpacing: '-0.01em',
          maxWidth: 380,
          fontWeight: 500,
        }}
      >
        {caption}
      </div>
      {sub && (
        <div className="mt-3.5" style={{ color: 'var(--ink-mute)', fontSize: 13, maxWidth: 380 }}>
          {sub}
        </div>
      )}
    </div>
  </div>
);

export interface AuthLayoutProps {
  caption?: string;
  sub?: string;
}

/**
 * Two-pane shell for unauthenticated routes. The form pane (left) renders
 * the page outlet; the art pane (right) shows the Adinkra-inspired marker
 * and a brief caption. The art pane collapses on mobile.
 */
export const AuthLayout = ({
  caption = 'Pressure-test a business in the time it takes to write a brief.',
  sub = 'Drop in a paragraph and a few competitor links — Ilinga interviews you, then ships a source-ready report.',
}: AuthLayoutProps): JSX.Element => (
  <div className="auth-split">
    <div className="auth-form-pane">
      <div className="mb-10 flex items-center justify-between">
        <BrandMark />
        <Link
          to="/"
          className="text-[13px] text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]"
        >
          ← Back
        </Link>
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <Outlet />
      </div>
      <div className="mt-10 flex items-center justify-between text-[12px] text-[color:var(--ink-faint)]">
        <span>© Ilinga</span>
        <div className="flex gap-4">
          <Link to="/legal/terms" className="hover:text-[color:var(--ink)]">
            Terms
          </Link>
          <Link to="/legal/privacy" className="hover:text-[color:var(--ink)]">
            Privacy
          </Link>
          <Link to="/help" className="hover:text-[color:var(--ink)]">
            Help
          </Link>
        </div>
      </div>
    </div>
    <AuthArt caption={caption} sub={sub} />
  </div>
);
