import mjml2html from 'mjml';

const baseShell = (heading: string, body: string, ctaLabel?: string, ctaUrl?: string): string => `
<mjml>
  <mj-head>
    <mj-title>${heading}</mj-title>
    <mj-attributes>
      <mj-all font-family="Inter, system-ui, sans-serif" />
      <mj-text color="#0f172a" font-size="15px" line-height="22px" />
      <mj-button background-color="#0f172a" color="#ffffff" border-radius="8px" inner-padding="12px 20px" />
    </mj-attributes>
    <mj-style inline="inline">
      .footer { color: #94a3b8; font-size: 12px; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section padding="32px 0">
      <mj-column>
        <mj-text font-size="22px" font-weight="600">${heading}</mj-text>
        <mj-text>${body}</mj-text>
        ${
          ctaLabel && ctaUrl
            ? `<mj-button href="${ctaUrl}">${ctaLabel}</mj-button>`
            : ''
        }
        <mj-text css-class="footer">
          You received this email from Ilinga. If you didn't expect it, you can ignore it.<br/>
          Ilinga • EU region.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`;

export interface RenderInput {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
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

export const render = (input: RenderInput): RenderedEmail => {
  const mjml = baseShell(input.heading, input.body, input.ctaLabel, input.ctaUrl);
  const result = mjml2html(mjml, { validationLevel: 'strict' });
  if (result.errors.length > 0) {
    throw new Error(`MJML render errors: ${result.errors.map((e) => e.message).join('; ')}`);
  }
  const text = `${input.heading}\n\n${stripTags(input.body)}\n\n${
    input.ctaLabel && input.ctaUrl ? `${input.ctaLabel}: ${input.ctaUrl}\n\n` : ''
  }Ilinga • EU region.`;
  return { html: result.html, text };
};
