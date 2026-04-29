import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Field,
  Input,
  Modal,
  Skeleton,
  useToast,
} from '@ilinga/ui';
import { api, type ApiError } from '../../../lib/api';
import { useTenant } from '../../../lib/tenant';
import { formatDateTZ } from '../../../lib/format';

interface Token {
  id: string;
  label: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
}

const SCOPES = [
  'tenants:read',
  'ventures:read',
  'ventures:write',
  'cycles:read',
  'cycles:write',
  'reports:read',
  'reports:render',
  'credits:read',
  'webhooks:write',
];

export const SettingsApiTokens = (): JSX.Element => {
  const { current } = useTenant();
  const [tokens, setTokens] = useState<Token[] | null>(null);
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: '',
    scopes: [] as string[],
    expiresInDays: 90,
  });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const refresh = (): void => {
    if (!current) return;
    setTokens(null);
    api
      .get<{ tokens: Token[] }>(`/v1/api-tokens/tenant/${current.id}`)
      .then((r) => setTokens(r.tokens))
      .catch(() => setTokens([]));
  };
  useEffect(refresh, [current]);

  if (!current) return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace.</p>;

  const submit = async (): Promise<void> => {
    setSubmitting(true);
    try {
      const r = await api.post<{ raw: string; prefix: string }>(
        `/v1/api-tokens/tenant/${current.id}`,
        form,
      );
      setRevealed(r.raw);
      setOpen(false);
      setForm({ label: '', scopes: [], expiresInDays: 90 });
      refresh();
    } catch (e) {
      toast.push({ variant: 'error', title: 'Could not issue token', body: `Status ${(e as ApiError).status}` });
    } finally {
      setSubmitting(false);
    }
  };

  const revoke = async (id: string): Promise<void> => {
    if (!window.confirm('Revoke this token?')) return;
    await api.delete(`/v1/api-tokens/tenant/${current.id}/${id}`);
    refresh();
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">API tokens</h2>
        <Button onClick={() => setOpen(true)}>Issue token</Button>
      </header>
      {tokens === null && <Skeleton height={120} />}
      {tokens && tokens.length === 0 && (
        <EmptyState
          title="No tokens yet"
          body="Personal access tokens authenticate as the user that issued them, scoped to the chosen permissions."
        />
      )}
      {tokens && tokens.length > 0 && (
        <ul className="space-y-2">
          {tokens.map((t) => (
            <li key={t.id}>
              <Card>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs text-[color:var(--color-fg-muted)]">
                        Prefix <code>{t.prefix}…</code> · created{' '}
                        {formatDateTZ(t.createdAt, 'UTC')}
                        {t.lastUsedAt && <> · last used {formatDateTZ(t.lastUsedAt, 'UTC')}</>}
                        {t.expiresAt && <> · expires {formatDateTZ(t.expiresAt, 'UTC')}</>}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.scopes.map((s) => (
                          <Badge key={s} tone="info">
                            {s}
                          </Badge>
                        ))}
                      </div>
                      {t.revokedAt && (
                        <Badge tone="warning" className="mt-2">
                          revoked
                        </Badge>
                      )}
                    </div>
                    {!t.revokedAt && (
                      <Button size="sm" variant="danger" onClick={() => revoke(t.id)}>
                        Revoke
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Issue API token"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={submitting}>
              Issue
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Label" htmlFor="t-label">
            <Input
              id="t-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="CI deploy bot"
            />
          </Field>
          <Field label="Expires in (days)" htmlFor="t-exp">
            <Input
              id="t-exp"
              type="number"
              value={form.expiresInDays}
              onChange={(e) => setForm({ ...form, expiresInDays: Number(e.target.value) })}
              min={1}
              max={365}
            />
          </Field>
          <Field label="Scopes" htmlFor="t-scopes">
            <div className="flex flex-wrap gap-3 text-sm">
              {SCOPES.map((s) => (
                <label key={s} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.scopes.includes(s)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        scopes: e.target.checked
                          ? [...form.scopes, s]
                          : form.scopes.filter((x) => x !== s),
                      })
                    }
                  />
                  {s}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </Modal>

      <Modal
        open={revealed !== null}
        onClose={() => setRevealed(null)}
        title="Save this token now"
        footer={<Button onClick={() => setRevealed(null)}>I&apos;ve saved it</Button>}
      >
        <p className="text-sm">
          We store only the sha-256 hash. If you lose the token, revoke it and issue a new one.
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-[color:var(--color-accent-soft)] p-3 font-mono text-xs">
          {revealed}
        </pre>
      </Modal>
    </section>
  );
};
