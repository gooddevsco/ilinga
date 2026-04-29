import { Link, useParams } from 'react-router-dom';

const articles: Record<string, { title: string; body: string }> = {
  'getting-started': {
    title: 'Getting started',
    body: 'Create a workspace, run your first interview, and render your first report.',
  },
  glossary: {
    title: 'Glossary',
    body: 'Cluster: a domain (Problem, Solution, Market, GTM, Risk). Module: a unit of synthesis that produces content keys. Key: a typed atom of the venture narrative. Credit: a unit of platform spend.',
  },
  billing: {
    title: 'Billing & credits',
    body: 'Plans renew monthly. Credits roll into the new period; top-ups never expire. Auto top-up keeps things smooth without surprises.',
  },
  security: {
    title: 'Security & data handling',
    body: 'EU-only at GA. AES-256-GCM at rest, TLS 1.3 in transit. SOC 2 Type II in progress.',
  },
  api: {
    title: 'API + webhooks',
    body: 'Public REST API with PATs and webhooks. See /developers/docs for the OpenAPI surface.',
  },
};

export const HelpArticle = (): JSX.Element => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? articles[slug] : undefined;
  if (!article) {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Article not found</h1>
        <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
          We don&apos;t have a help article for &quot;{slug}&quot;.
        </p>
        <Link to="/help" className="mt-4 inline-block text-sm underline">
          Back to help
        </Link>
      </div>
    );
  }
  return (
    <article>
      <Link to="/help" className="text-sm text-[color:var(--color-fg-muted)]">
        ← Help
      </Link>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{article.title}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--color-fg)]">
        {article.body}
      </p>
    </article>
  );
};
