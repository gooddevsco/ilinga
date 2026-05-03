import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Field,
  Input,
  Skeleton,
  useToast,
} from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';
import { formatDateTZ } from '../../lib/format';

interface Competitor {
  id: string;
  url: string;
  label: string | null;
  scrapeStatus: string;
  scrapedAt: string | null;
  structured: Record<string, unknown> | null;
  createdAt: string;
}

export const Competitors = ({ cycleId }: { cycleId: string }): JSX.Element => {
  const { current } = useTenant();
  const [items, setItems] = useState<Competitor[] | null>(null);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const refresh = (): void => {
    if (!current) return;
    api
      .get<{ competitors: Competitor[] }>(`/v1/competitors/tenant/${current.id}/cycle/${cycleId}`)
      .then((r) => setItems(r.competitors))
      .catch(() => setItems([]));
  };
  useEffect(refresh, [current, cycleId]);

  const add = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!current) return;
    setSubmitting(true);
    try {
      await api.post(`/v1/competitors/tenant/${current.id}`, {
        cycleId,
        url,
        label: label || undefined,
      });
      toast.push({ variant: 'success', title: 'Competitor queued for scrape' });
      setUrl('');
      setLabel('');
      refresh();
    } catch (err) {
      toast.push({
        variant: 'error',
        title: 'Could not add',
        body: `Status ${(err as ApiError).status}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string): Promise<void> => {
    if (!current) return;
    if (!window.confirm('Remove this competitor?')) return;
    await api.delete(`/v1/competitors/tenant/${current.id}/${id}`);
    refresh();
  };

  return (
    <Card>
      <CardBody>
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Competitors</h3>
        </header>
        <form onSubmit={add} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="URL" htmlFor="comp-url">
              <Input
                id="comp-url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </Field>
            <Field label="Label (optional)" htmlFor="comp-label">
              <Input
                id="comp-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Acme"
              />
            </Field>
          </div>
          <Button type="submit" loading={submitting}>
            Add
          </Button>
        </form>
        <div className="mt-4">
          {items === null && <Skeleton height={48} />}
          {items && items.length === 0 && (
            <EmptyState
              title="No competitors"
              body="Add URLs to bring scraped pages into synthesis."
            />
          )}
          {items && items.length > 0 && (
            <ul className="space-y-2">
              {items.map((co) => (
                <li
                  key={co.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[color:var(--color-border)] px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <a
                      href={co.url}
                      className="truncate font-medium underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {co.label ?? co.url}
                    </a>
                    <p className="text-xs text-[color:var(--color-fg-muted)]">
                      added {formatDateTZ(co.createdAt, 'UTC')}
                      {co.scrapedAt && <> · scraped {formatDateTZ(co.scrapedAt, 'UTC')}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        co.scrapeStatus === 'complete'
                          ? 'success'
                          : co.scrapeStatus === 'failed'
                            ? 'danger'
                            : 'info'
                      }
                    >
                      {co.scrapeStatus}
                    </Badge>
                    <Button size="sm" variant="danger" onClick={() => void remove(co.id)}>
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
