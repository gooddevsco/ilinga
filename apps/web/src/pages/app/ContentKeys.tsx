import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Skeleton,
  Textarea,
  useToast,
} from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';

interface Key {
  id: string;
  code: string;
  version: number;
  value: unknown;
  source: string;
  confidence: number | null;
}

const valueToText = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (
    v &&
    typeof v === 'object' &&
    'text' in v &&
    typeof (v as { text?: unknown }).text === 'string'
  ) {
    return (v as { text: string }).text;
  }
  return JSON.stringify(v ?? '');
};

export const ContentKeys = (): JSX.Element => {
  const { vid, cid } = useParams<{ vid: string; cid: string }>();
  const { current } = useTenant();
  const [keys, setKeys] = useState<Key[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const toast = useToast();

  const refresh = (): void => {
    if (!current || !cid) return;
    api
      .get<{ keys: Key[] }>(`/v1/content-keys/tenant/${current.id}/cycle/${cid}`)
      .then((r) => {
        setKeys(r.keys);
        const next: Record<string, string> = {};
        for (const k of r.keys) next[k.code] = valueToText(k.value);
        setDraft(next);
      })
      .catch(() => setKeys([]));
  };

  useEffect(refresh, [current, cid]);

  if (!current || !vid || !cid) {
    return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace selected.</p>;
  }

  const save = async (k: Key): Promise<void> => {
    if (!current) return;
    setSaving(k.code);
    try {
      await api.post(`/v1/content-keys/tenant/${current.id}/override`, {
        cycleId: cid,
        code: k.code,
        value: { text: draft[k.code] ?? '' },
      });
      toast.push({ variant: 'success', title: `${k.code} updated` });
      refresh();
    } catch (e) {
      toast.push({
        variant: 'error',
        title: 'Override failed',
        body: `Status ${(e as ApiError).status}`,
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <Link to={`/ventures/${vid}`} className="text-xs text-[color:var(--color-fg-muted)]">
          ← Venture
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Content keys</h1>
        <p className="text-xs text-[color:var(--color-fg-muted)]">
          Edit any synthesised key. Saving creates a new manual version that supersedes the previous
          one in renders.
        </p>
      </header>
      {keys === null && <Skeleton height={200} />}
      {keys && keys.length === 0 && (
        <EmptyState
          title="No content keys yet"
          body="Run synthesis on this cycle to populate keys, then edit them here."
        />
      )}
      {keys && keys.length > 0 && (
        <ul className="space-y-3">
          {keys.map((k) => (
            <li key={k.id}>
              <Card>
                <CardBody>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs">{k.code}</span>
                    <span className="flex items-center gap-2 text-xs">
                      <Badge tone={k.source === 'manual' ? 'success' : 'info'}>{k.source}</Badge>
                      <span className="text-[color:var(--color-fg-muted)]">v{k.version}</span>
                      {k.confidence !== null && (
                        <span className="text-[color:var(--color-fg-muted)]">
                          conf {k.confidence}
                        </span>
                      )}
                    </span>
                  </div>
                  <Textarea
                    rows={5}
                    className="mt-3"
                    value={draft[k.code] ?? ''}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [k.code]: e.target.value }))}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => save(k)}
                      loading={saving === k.code}
                      disabled={(draft[k.code] ?? '') === valueToText(k.value)}
                    >
                      Save manual override
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
