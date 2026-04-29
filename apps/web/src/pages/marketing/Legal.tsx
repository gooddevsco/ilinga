import { Link, useParams } from 'react-router-dom';

const docs: Record<string, { title: string; updated: string; body: string }> = {
  terms: {
    title: 'Terms of service',
    updated: '2026-04-29',
    body: 'These terms govern your use of Ilinga. By using the service you agree to them. The full PDF is available on request.',
  },
  privacy: {
    title: 'Privacy policy',
    updated: '2026-04-29',
    body: 'We process personal data lawfully under GDPR. You can request a copy or deletion at any time via Settings → Privacy.',
  },
  dpa: {
    title: 'Data processing addendum',
    updated: '2026-04-29',
    body: 'Available on request — included as a redline in our standard order form for paid plans.',
  },
  cookies: {
    title: 'Cookie policy',
    updated: '2026-04-29',
    body: 'We use strictly-necessary cookies (il_session, il_csrf, il_device, il_consent). Analytics cookies are off by default.',
  },
  security: {
    title: 'Security',
    updated: '2026-04-29',
    body: 'AES-256-GCM at rest, TLS 1.3 in transit, EU-only hosting at GA, hash-chained audit log, daily restore drills, vulnerability disclosure at /.well-known/security.txt.',
  },
};

export const Legal = (): JSX.Element => {
  const { slug } = useParams<{ slug: string }>();
  const doc = slug ? docs[slug] : undefined;
  if (!doc) {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Document not found</h1>
        <Link to="/" className="mt-2 inline-block text-sm underline">
          Back to home
        </Link>
      </div>
    );
  }
  return (
    <article>
      <h1 className="text-3xl font-semibold tracking-tight">{doc.title}</h1>
      <p className="mt-1 text-xs uppercase tracking-wide text-[color:var(--color-fg-subtle)]">
        Last updated {doc.updated}
      </p>
      <p className="mt-6 max-w-2xl text-sm leading-7">{doc.body}</p>
    </article>
  );
};
