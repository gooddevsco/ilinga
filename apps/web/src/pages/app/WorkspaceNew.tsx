import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Eyebrow, Field, Input, Tag, useToast, cn } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';

const teamSizes = ['Solo', '2–5', '6–20', '21+'] as const;
type TeamSize = (typeof teamSizes)[number];

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

const initials = (s: string): string =>
  s
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'NW';

export const WorkspaceNew = (): JSX.Element => {
  const { tenants, refresh, setCurrent } = useTenant();
  const isFirst = tenants.length === 0;
  const [displayName, setDisplayName] = useState('');
  const [size, setSize] = useState<TeamSize>('Solo');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const slug = slugify(displayName);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (displayName.trim().length < 2) return;
    setSubmitting(true);
    try {
      const created = await api.post<{ id: string; slug: string }>('/v1/tenants', {
        displayName: displayName.trim(),
      });
      await refresh();
      setCurrent({
        id: created.id,
        slug: created.slug,
        displayName: displayName.trim(),
        role: 'owner',
      });
      toast.push({
        variant: 'success',
        title: 'Workspace created',
        body: `${displayName.trim()} is ready. 50 credits added.`,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.push({
        variant: 'error',
        title: 'Could not create workspace',
        body: `Status ${(err as ApiError).status}.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="r-2col grid gap-6" style={{ gridTemplateColumns: '1fr 380px' }}>
      <form onSubmit={submit} className="fade-up flex flex-col gap-5">
        <Eyebrow>{isFirst ? 'Welcome · Step 1' : 'New workspace'}</Eyebrow>
        <h1
          className="r-h-display serif tracking-tight"
          style={{
            fontSize: 44,
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            fontWeight: 500,
          }}
        >
          {isFirst ? 'Name your workspace.' : 'Spin up a new workspace.'}
        </h1>
        <p className="text-[14px] text-[color:var(--ink-mute)]" style={{ maxWidth: 520 }}>
          {isFirst
            ? "One workspace per tenant. You can rename later — the slug is permanent. We'll seed it with 50 free credits so you can run your first report end-to-end."
            : 'Use a separate workspace for another team or client. Members and credits do not bleed across workspaces.'}
        </p>

        <Field label="Workspace name" htmlFor="wname" hint="Visible to anyone you invite.">
          <Input
            id="wname"
            required
            minLength={2}
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Northwind Capital"
            autoFocus
            className="lg"
          />
        </Field>

        <div>
          <span className="field-label">Workspace URL</span>
          <div className="flex overflow-hidden rounded-[var(--radius)] border border-[color:var(--line-2)]">
            <span
              className="mono px-3 py-2.5 text-[13px] text-[color:var(--ink-mute)]"
              style={{ background: 'var(--bg-2)', borderRight: '1px solid var(--line)' }}
            >
              ilinga.studio/
            </span>
            <input
              className="flex-1 bg-transparent px-3 text-[14px] outline-none"
              value={slug}
              readOnly
              aria-label="Workspace slug"
            />
          </div>
        </div>

        <div>
          <span className="field-label">Team size</span>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {teamSizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={cn('btn', size === s && 'primary')}
                aria-pressed={size === s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex gap-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            disabled={displayName.trim().length < 2}
          >
            {isFirst ? 'Create workspace' : 'Create'}
          </Button>
          {!isFirst && (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <aside className="r-mobile-hide flex flex-col gap-3">
        <Card className="p-5">
          <Eyebrow>Workspace preview</Eyebrow>
          <div className="mt-3 flex items-center gap-3">
            <div
              className="grid size-11 place-items-center rounded-md"
              style={{
                background: 'var(--signal)',
                color: 'var(--signal-ink)',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {initials(displayName || 'New')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px]" style={{ fontWeight: 500 }}>
                {displayName || 'Your workspace'}
              </div>
              <div className="mono truncate text-[11px] text-[color:var(--ink-faint)]">
                ilinga.studio/{slug || 'slug'}
              </div>
            </div>
          </div>
          <div className="my-4 h-px bg-[color:var(--line)]" />
          <dl
            className="r-2col-stat grid gap-3 text-[12px]"
            style={{ gridTemplateColumns: '1fr 1fr' }}
          >
            <div>
              <dt className="mono text-[10px] uppercase text-[color:var(--ink-faint)]">Plan</dt>
              <dd className="mt-0.5 text-[13px]">Solo (free)</dd>
            </div>
            <div>
              <dt className="mono text-[10px] uppercase text-[color:var(--ink-faint)]">
                Credits / mo
              </dt>
              <dd className="mt-0.5 text-[13px]" style={{ color: 'var(--signal)' }}>
                50
              </dd>
            </div>
            <div>
              <dt className="mono text-[10px] uppercase text-[color:var(--ink-faint)]">Owner</dt>
              <dd className="mt-0.5 text-[13px]">You</dd>
            </div>
            <div>
              <dt className="mono text-[10px] uppercase text-[color:var(--ink-faint)]">Team</dt>
              <dd className="mt-0.5 text-[13px]">{size}</dd>
            </div>
          </dl>
        </Card>
        <Card className="p-5">
          <Eyebrow>What happens next</Eyebrow>
          <ol className="mt-3 flex flex-col gap-2 text-[13px]">
            {[
              'Brief your first venture (2 min).',
              'Answer cluster interview (~12 min).',
              'Pick a report template — yours or ours.',
              'Spend credits to render the final PDF.',
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
        {isFirst && (
          <Tag tone="signal" dot className="self-start">
            50 credits will be added
          </Tag>
        )}
      </aside>
    </div>
  );
};
