import mjml2html from 'mjml';

export interface BrandInput {
  /** Display name used for the wordmark + footer line. */
  name?: string;
  /** Hex accent colour for buttons (#RRGGBB). Defaults to Ilinga slate. */
  accentHex?: string;
  /** Logo URL to render as the email header image. */
  logoUrl?: string | null;
}

const escapeAttr = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const sanitizeAccent = (hex: string | undefined): string => {
  if (!hex) return '#0f172a';
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#0f172a';
};

const buildHeader = (brand: BrandInput | undefined): string => {
  if (!brand?.logoUrl) return '';
  return `<mj-image src="${escapeAttr(brand.logoUrl)}" alt="${escapeAttr(brand.name ?? 'Ilinga')}" width="120px" align="left" padding="0 0 16px 0" />`;
};

const baseShell = (
  heading: string,
  body: string,
  ctaLabel?: string,
  ctaUrl?: string,
  brand?: BrandInput,
): string => {
  const accent = sanitizeAccent(brand?.accentHex);
  const name = brand?.name ?? 'Ilinga';
  return `
<mjml>
  <mj-head>
    <mj-title>${heading}</mj-title>
    <mj-attributes>
      <mj-all font-family="Inter, system-ui, sans-serif" />
      <mj-text color="#0f172a" font-size="15px" line-height="22px" />
      <mj-button background-color="${accent}" color="#ffffff" border-radius="8px" inner-padding="12px 20px" />
    </mj-attributes>
    <mj-style inline="inline">
      .footer { color: #94a3b8; font-size: 12px; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section padding="32px 0">
      <mj-column>
        ${buildHeader(brand)}
        <mj-text font-size="22px" font-weight="600">${heading}</mj-text>
        <mj-text>${body}</mj-text>
        ${ctaLabel && ctaUrl ? `<mj-button href="${ctaUrl}">${ctaLabel}</mj-button>` : ''}
        <mj-text css-class="footer">
          You received this email from ${name}. If you didn't expect it, you can ignore it.<br/>
          ${name} • EU region.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;
};

export interface RenderInput {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  brand?: BrandInput;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

const stripTags = (s: string): string =>
  s
    .replace(/<\/(p|div|h\d|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

interface MjmlResult {
  html: string;
  errors: { message: string }[];
}

export const render = (input: RenderInput): RenderedEmail => {
  const mjml = baseShell(input.heading, input.body, input.ctaLabel, input.ctaUrl, input.brand);
  // mjml2html is synchronous in v4; the published @types overstates the
  // return as a Promise. Cast through unknown so the runtime stays sync.
  const result = mjml2html(mjml, { validationLevel: 'strict' }) as unknown as MjmlResult;
  if (result.errors.length > 0) {
    throw new Error(
      `MJML render errors: ${result.errors.map((e: { message: string }) => e.message).join('; ')}`,
    );
  }
  const name = input.brand?.name ?? 'Ilinga';
  const text = `${input.heading}\n\n${stripTags(input.body)}\n\n${
    input.ctaLabel && input.ctaUrl ? `${input.ctaLabel}: ${input.ctaUrl}\n\n` : ''
  }${name} • EU region.`;
  return { html: result.html, text };
};
