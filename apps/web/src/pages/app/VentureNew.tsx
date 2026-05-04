import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Eyebrow,
  Field,
  Icons,
  Input,
  Tag,
  Textarea,
  useToast,
  cn,
} from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';

const scopes = [
  { code: 'local', title: 'Local', sub: 'City · metro' },
  { code: 'national', title: 'National', sub: 'Single country' },
  { code: 'multi', title: 'Multi-country', sub: 'Region or 2–5 markets' },
  { code: 'global', title: 'Global', sub: 'No regional limit' },
] as const;

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

export const VentureNew = (): JSX.Element => {
  const { current } = useTenant();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [scope, setScope] = useState<(typeof scopes)[number]['code']>('national');
  const [geos, setGeos] = useState('');
  const [thesis, setThesis] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const slug = useMemo(() => slugify(name), [name]);

  if (!current) {
    return <p className="text-[13px] text-[color:var(--ink-mute)]">No workspace selected.</p>;
  }

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setSubmitting(true);
    try {
      const r = await api.post<{ venture: { id: string } }>(`/v1/ventures`, {
        tenantId: current.id,
        name: name.trim(),
        industry: industry || undefined,
        geos: geos
          .split(',')
          .map((g) => g.trim().toUpperCase())
          .filter((g) => g.length === 2),
        brief: { thesis, scope },
      });
      toast.push({
        variant: 'success',
        title: 'Venture created',
        body: 'Cycle 1 is open. Start the interview to brief the agent.',
      });
      navigate(`/ventures/${r.venture.id}`);
    } catch (err) {
      toast.push({
        variant: 'error',
        title: 'Could not create venture',
        body: `Status ${(err as ApiError).status}.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="r-2col grid gap-6" style={{ gridTemplateColumns: '1fr 360px' }}>
      <form onSubmit={submit} className="fade-up flex flex-col gap-5">
        <Eyebrow>Workspace · {current.displayName}</Eyebrow>
        <h1
          className="serif r-h-display tracking-tight"
          style={{
            fontSize: 44,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            fontWeight: 500,
          }}
        >
          Brief a new venture.
        </h1>
        <p className="text-[14px] text-[color:var(--ink-mute)]">
          Give the agent enough to infer your industry, persona, and competitive context. Cycle 1
          opens automatically — you can edit any of this from the venture detail page.
        </p>

        <Field label="Venture name" htmlFor="vname">
          <Input
            id="vname"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Northwind Cargo"
            className="lg"
            autoFocus
          />
        </Field>

        <Field
          label="Industry"
          htmlFor="vind"
          hint="Free-form for now — the agent will tighten this from your brief."
        >
          <Input
            id="vind"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="logistics"
          />
        </Field>

        <div>
          <span className="field-label">Geographic scope</span>
          <div
            className="r-cards-4 mt-1.5 grid gap-2"
            style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
          >
            {scopes.map((s) => {
              const active = scope === s.code;
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => setScope(s.code)}
                  aria-pressed={active}
                  className={cn(
                    'card flex flex-col items-start gap-0.5 p-3 text-left transition-colors',
                    active
                      ? 'border-[color:var(--signal)] bg-[color:var(--signal-soft)]'
                      : 'hover:bg-[color:var(--paper-1)]',
                  )}
                  style={
                    active
                      ? {
                          borderColor: 'var(--signal)',
                          background: 'var(--signal-soft)',
                        }
                      : undefined
                  }
                >
                  <span
                    className="text-[13px]"
                    style={{ fontWeight: 500, color: active ? 'var(--signal)' : undefined }}
                  >
                    {s.title}
                  </span>
                  <span className="text-[11px] text-[color:var(--ink-mute)]">{s.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Field
          label="Markets"
          htmlFor="vgeos"
          hint="Comma-separated ISO-3166-1 alpha-2 codes (e.g. DE, FR, NL)."
        >
          <Input
            id="vgeos"
            value={geos}
            onChange={(e) => setGeos(e.target.value)}
            placeholder="DE, FR, NL"
          />
        </Field>

        <Field
          label="Thesis"
          htmlFor="vthesis"
          hint="A paragraph is enough — the interview will probe the corners."
        >
          <Textarea
            id="vthesis"
            rows={5}
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            placeholder="What is the thesis you want to test?"
          />
        </Field>

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={name.trim().length < 2}
          >
            Create venture <Icons.arrow />
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/ventures')}>
            Cancel
          </Button>
        </div>
      </form>

      <aside className="r-mobile-hide flex flex-col gap-3">
        <Card className="p-5">
          <Eyebrow>Brief preview</Eyebrow>
          <h3 className="mt-3 text-[18px]" style={{ fontWeight: 500 }}>
            {name || 'Untitled venture'}
          </h3>
          <div className="mono mt-1 text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
            {[industry, scope.toUpperCase()].filter(Boolean).join(' · ') || '—'}
          </div>
          <div className="my-4 h-px bg-[color:var(--line)]" />
          <p className="text-[13px] text-[color:var(--ink-mute)]" style={{ minHeight: 80 }}>
            {thesis || 'A few sentences describing the thesis, the wedge, and who suffers most.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {geos
              .split(',')
              .map((g) => g.trim().toUpperCase())
              .filter((g) => g.length === 2)
              .slice(0, 6)
              .map((g) => (
                <Tag key={g} tone="signal">
                  {g}
                </Tag>
              ))}
            {!geos.trim() && <Tag tone="neutral">no markets</Tag>}
          </div>
          <div className="mono mt-3 text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">
            slug · {slug || '—'}
          </div>
        </Card>
        <Card className="p-5">
          <Eyebrow>What happens next</Eyebrow>
          <ol className="mt-3 flex flex-col gap-2 text-[13px]">
            {[
              'Cycle 1 opens automatically.',
              'Walk the cluster interview (~12 min).',
              'Agent fills the prompt graph + module outputs.',
              'Render a Snapshot for free; render Pro/Premium reports per credit.',
            ].map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="mono text-[11px]" style={{ color: 'var(--signal)' }}>
                  0{i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </Card>
      </aside>
    </div>
  );
};
