import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  Eyebrow,
  Skeleton,
  Tag,
  Textarea,
  cn,
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

const groupCode = (code: string): string => {
  const dot = code.indexOf('.');
  return dot > 0 ? code.slice(0, dot) : code;
};

export const ContentKeys = (): JSX.Element => {
  const { vid, cid } = useParams<{ vid: string; cid: string }>();
  const { current } = useTenant();
  const [keys, setKeys] = useState<Key[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [activeCode, setActiveCode] = useState<string | null>(null);
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
        if (!activeCode && r.keys[0]) setActiveCode(r.keys[0].code);
      })
      .catch(() => setKeys([]));
  };

  useEffect(refresh, [current, cid]);

  const grouped = useMemo(() => {
    const map = new Map<string, Key[]>();
    for (const k of keys ?? []) {
      const g = groupCode(k.code);
      const arr = map.get(g) ?? [];
      arr.push(k);
      map.set(g, arr);
    }
    return Array.from(map.entries()).map(([group, items]) => ({
      group,
      items: [...items].sort((a, b) => a.code.localeCompare(b.code)),
    }));
  }, [keys]);

  const active = useMemo(
    () => keys?.find((k) => k.code === activeCode) ?? null,
    [keys, activeCode],
  );

  if (!current || !vid || !cid) {
    return <p className="text-[13px] text-[color:var(--ink-mute)]">No workspace selected.</p>;
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={`/ventures/${vid}`}
            className="mono text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)] hover:text-[color:var(--ink)]"
          >
            ← Venture
          </Link>
          <h1
            className="serif mt-1 text-[28px] tracking-tight"
            style={{ fontWeight: 500, letterSpacing: '-0.02em' }}
          >
            Module outputs
          </h1>
          <p className="mt-1 text-[13px] text-[color:var(--ink-mute)]" style={{ maxWidth: 640 }}>
            Edit any synthesised key. Saving creates a new manual version that supersedes the
            previous one in subsequent renders.
          </p>
        </div>
        <Link to={`/ventures/${vid}/cycles/${cid}/reports`}>
          <Button variant="secondary" type="button">
            Reports
          </Button>
        </Link>
      </header>

      {keys === null && <Skeleton height={400} />}
      {keys && keys.length === 0 && (
        <EmptyState
          title="No content keys yet"
          body="Run synthesis on this cycle to populate keys, then edit them here."
        />
      )}

      {keys && keys.length > 0 && (
        <div className="r-outputs-grid grid gap-4" style={{ gridTemplateColumns: '320px 1fr' }}>
          {/* LEFT — module/key rail */}
          <aside className="flex max-h-[640px] flex-col gap-1 overflow-auto rounded-md border border-[color:var(--line)] bg-[color:var(--bg-1)] p-3">
            <Eyebrow>Modules</Eyebrow>
            {grouped.map(({ group, items }) => (
              <div key={group} className="mb-2">
                <div className="nav-section">{group}</div>
                {items.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setActiveCode(k.code)}
                    className={cn(
                      'nav-item w-full justify-between',
                      activeCode === k.code && 'active',
                    )}
                  >
                    <span className="mono truncate text-[12px]">{k.code}</span>
                    <Tag tone={k.source === 'manual' ? 'green' : 'indigo'}>v{k.version}</Tag>
                  </button>
                ))}
              </div>
            ))}
          </aside>

          {/* RIGHT — key detail */}
          <main className="flex flex-col gap-4">
            {active && (
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Eyebrow>{groupCode(active.code).toUpperCase()}</Eyebrow>
                    <h2
                      className="mono mt-1 text-[18px]"
                      style={{ fontWeight: 500, letterSpacing: '-0.01em' }}
                    >
                      {active.code}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag tone={active.source === 'manual' ? 'green' : 'indigo'}>
                      {active.source.toUpperCase()} · V{active.version}
                    </Tag>
                    {active.confidence !== null && (
                      <Tag tone={active.confidence > 70 ? 'green' : 'ochre'}>
                        CONF {active.confidence}%
                      </Tag>
                    )}
                  </div>
                </div>

                <Textarea
                  rows={10}
                  className="mt-4"
                  value={draft[active.code] ?? ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [active.code]: e.target.value }))}
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    type="button"
                    size="sm"
                    loading={saving === active.code}
                    disabled={(draft[active.code] ?? '') === valueToText(active.value)}
                    onClick={() => save(active)}
                  >
                    Save manual override
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    size="sm"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        [active.code]: valueToText(active.value),
                      }))
                    }
                  >
                    Reset
                  </Button>
                  <span className="ml-auto mono text-[11px] text-[color:var(--ink-faint)]">
                    {(draft[active.code] ?? '').length} CHARS
                  </span>
                </div>
              </Card>
            )}
          </main>
        </div>
      )}
    </div>
  );
};
