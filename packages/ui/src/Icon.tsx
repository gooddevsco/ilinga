import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number;
  /** Override stroke width (default 1.5). */
  strokeWidth?: number;
}

/**
 * Hairline glyph base, 16px viewBox. Use `IconLogo` for the brand mark and
 * the named `Icons.*` glyphs for inline UI affordances.
 */
const Glyph = ({
  children,
  size = 16,
  strokeWidth = 1.5,
  ...rest
}: IconProps & { children: ReactNode }): JSX.Element => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const IconLogo = ({ size = 18, ...rest }: IconProps): JSX.Element => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
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
);

export const Icons = {
  arrow: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </Glyph>
  ),
  arrowLeft: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M13 8H3M7 4l-4 4 4 4" />
    </Glyph>
  ),
  check: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M3 8.5 6.5 12 13 4.5" />
    </Glyph>
  ),
  plus: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M8 3v10M3 8h10" />
    </Glyph>
  ),
  x: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </Glyph>
  ),
  search: (p?: IconProps) => (
    <Glyph {...p}>
      <circle cx="7" cy="7" r="4" />
      <path d="m13 13-2.5-2.5" />
    </Glyph>
  ),
  spark: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M8 2v4M8 10v4M2 8h4M10 8h4M4 4l2.5 2.5M9.5 9.5 12 12M4 12l2.5-2.5M9.5 6.5 12 4" />
    </Glyph>
  ),
  lock: (p?: IconProps) => (
    <Glyph {...p}>
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </Glyph>
  ),
  unlock: (p?: IconProps) => (
    <Glyph {...p}>
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 4.5-1.5" />
    </Glyph>
  ),
  download: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M8 2v9M4.5 7.5 8 11l3.5-3.5M3 14h10" />
    </Glyph>
  ),
  doc: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M4 1.5h5l3 3V14a.5.5 0 0 1-.5.5h-7A.5.5 0 0 1 4 14V2a.5.5 0 0 1 .5-.5z" />
      <path d="M9 1.5v3h3M6 8h4M6 10.5h4M6 5.5h1.5" />
    </Glyph>
  ),
  cluster: (p?: IconProps) => (
    <Glyph {...p}>
      <circle cx="4" cy="4" r="2" />
      <circle cx="12" cy="4" r="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M5.4 5.4 6.6 10.6M10.6 5.4 9.4 10.6M6 4h4" />
    </Glyph>
  ),
  module: (p?: IconProps) => (
    <Glyph {...p}>
      <rect x="2" y="2" width="5" height="5" />
      <rect x="9" y="2" width="5" height="5" />
      <rect x="2" y="9" width="5" height="5" />
      <rect x="9" y="9" width="5" height="5" />
    </Glyph>
  ),
  chart: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M2 13h12M4 11V7M7 11V4M10 11v-3M13 11V6" />
    </Glyph>
  ),
  credits: (p?: IconProps) => (
    <Glyph {...p}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v6M5.5 8h5" />
    </Glyph>
  ),
  settings: (p?: IconProps) => (
    <Glyph {...p}>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4" />
    </Glyph>
  ),
  bell: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M4 11V7a4 4 0 0 1 8 0v4l1 1H3l1-1zM7 14h2" />
    </Glyph>
  ),
  zap: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M9 1 3 9h4l-1 6 6-8H8l1-6z" fill="currentColor" stroke="none" />
    </Glyph>
  ),
  user: (p?: IconProps) => (
    <Glyph {...p}>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3 14c.8-2.5 2.7-4 5-4s4.2 1.5 5 4" />
    </Glyph>
  ),
  globe: (p?: IconProps) => (
    <Glyph {...p}>
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" />
    </Glyph>
  ),
  flag: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M3.5 14V2M3.5 3h8l-1.5 2.5L11.5 8H3.5" />
    </Glyph>
  ),
  sliders: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M3 4h6M11 4h2M3 8h2M7 8h6M3 12h8M13 12h0M9 2v4M5 6v4M11 10v4" />
    </Glyph>
  ),
  cycle: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M3 8a5 5 0 0 1 9-3M13 8a5 5 0 0 1-9 3M11 2v3h3M5 14v-3H2" />
    </Glyph>
  ),
  upload: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M8 11V2M4.5 5.5 8 2l3.5 3.5M3 14h10" />
    </Glyph>
  ),
  card: (p?: IconProps) => (
    <Glyph {...p}>
      <rect x="2" y="4" width="12" height="9" rx="1.5" />
      <path d="M2 7h12M5 11h2" />
    </Glyph>
  ),
  api: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M2 8h3M11 8h3M5 8a3 3 0 0 1 6 0 3 3 0 0 1-6 0zM8 1v2M8 13v2" />
    </Glyph>
  ),
  external: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M9 3h4v4M13 3 7 9M11 9v4H3V5h4" />
    </Glyph>
  ),
  more: (p?: IconProps) => (
    <Glyph strokeWidth={2.5} {...p}>
      <path d="M3 8h.01M8 8h.01M13 8h.01" />
    </Glyph>
  ),
  menu: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
    </Glyph>
  ),
  filter: (p?: IconProps) => (
    <Glyph {...p}>
      <path d="M2 3h12L9.5 8.5V13L6.5 14V8.5L2 3z" />
    </Glyph>
  ),
  team: (p?: IconProps) => (
    <Glyph {...p}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="11.5" cy="6.5" r="1.5" />
      <path d="M2 13c.5-2 2-3 4-3s3.5 1 4 3M10 13c0-1.2.5-2.2 1.5-2.7" />
    </Glyph>
  ),
} as const;

export type IconName = keyof typeof Icons;
