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

interface Endpoint {
  id: string;
  label: string;
  modelId: string;
  baseUrl: string | null;
  apiKeyLastFour: string | null;
  workloads: string[];
  isDefault: boolean;
  createdAt: string;
}

interface Model {
  id: string;
  provider: string;
  modelId: string;
  displayName: string;
  capabilities: string[];
}

const WORKLOADS = ['narrative', 'reasoning', 'classification', 'embeddings'] as const;

export const SettingsAi = (): JSX.Element => {
  const { current } = useTenant();
  const [endpoints, setEndpoints] = useState<Endpoint[] | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    label: '',
    modelId: '',
    baseUrl: '',
    apiKey: '',
    workloads: [] as string[],
  });
  const toast = useToast();

  const refresh = (): void => {
    if (!current) return;
    setEndpoints(null);
    api
      .get<{ endpoints: Endpoint[] }>(`/v1/ai-endpoints/tenant/${current.id}`)
      .then((r) => setEndpoints(r.endpoints))
      .catch(() => setEndpoints([]));
    api.get<{ models: Model[] }>(`/v1/ai-endpoints/models`).then((r) => setModels(r.models));
  };

  useEffect(refresh, [current]);

  if (!current) return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace.</p>;

  const submit = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await api.post(`/v1/ai-endpoints/tenant/${current.id}`, {
        modelId: form.modelId,
        label: form.label,
        baseUrl: form.baseUrl || undefined,
        apiKey: form.apiKey,
        workloads: form.workloads,
      });
      toast.push({ variant: 'success', title: 'AI endpoint added' });
      setOpen(false);
      setForm({ label: '', modelId: '', baseUrl: '', apiKey: '', workloads: [] });
      refresh();
    } catch (e) {
      toast.push({
        variant: 'error',
        title: 'Could not add endpoint',
        body: `Status ${(e as ApiError).status}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string): Promise<void> => {
    if (!window.confirm('Remove this endpoint?')) return;
    await api.delete(`/v1/ai-endpoints/tenant/${current.id}/${id}`);
    refresh();
  };

  const dryRun = async (id: string): Promise<void> => {
    try {
      const r = await api.post<{
        ok: boolean;
        provider: string;
        model: string;
        latencyMs: number;
        sample: string;
        error?: string;
      }>(`/v1/ai-endpoints/tenant/${current.id}/${id}/dry-run`, {
        prompt: 'Reply with a single word: pong.',
      });
      toast.push({
        variant: 'success',
        title: `${r.provider} · ${r.latencyMs}ms`,
        body: r.sample || '(empty response)',
      });
    } catch (e) {
      const err = e as ApiError;
      const detail = (err.body as { error?: string; provider?: string })?.error;
      toast.push({
        variant: 'error',
        title: 'Test failed',
        body: detail ?? `Status ${err.status}`,
      });
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">AI endpoints</h2>
        <Button onClick={() => setOpen(true)}>Add endpoint</Button>
      </header>
      {endpoints === null && <Skeleton height={120} />}
      {endpoints && endpoints.length === 0 && (
        <EmptyState
          title="No AI endpoints yet"
          body="Bring your own keys to redirect token spend off our system fallback. We never log the key — only the last 4 chars."
        />
      )}
      {endpoints && endpoints.length > 0 && (
        <ul className="space-y-2">
          {endpoints.map((e) => (
            <li key={e.id}>
              <Card>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{e.label}</p>
                      <p className="text-xs text-[color:var(--color-fg-muted)]">
                        Key ending …{e.apiKeyLastFour} ·{' '}
                        {e.baseUrl ? <>at {e.baseUrl}</> : 'default base url'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {e.workloads.map((w) => (
                          <Badge key={w} tone="info">
                            {w}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => dryRun(e.id)}>
                        Send test prompt
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => remove(e.id)}>
                        Remove
                      </Button>
                    </div>
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
        title="Add AI endpoint"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={submitting}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Label" htmlFor="ep-label">
            <Input
              id="ep-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="OpenAI prod"
            />
          </Field>
          <Field label="Model" htmlFor="ep-model">
            <select
              id="ep-model"
              value={form.modelId}
              onChange={(e) => setForm({ ...form, modelId: e.target.value })}
              className="block h-10 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 text-sm"
            >
              <option value="">— pick a model —</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.provider} · {m.displayName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Base URL (optional)" htmlFor="ep-base">
            <Input
              id="ep-base"
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              placeholder="https://api.openai.com"
            />
          </Field>
          <Field label="API key" htmlFor="ep-key">
            <Input
              id="ep-key"
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="sk-…"
            />
          </Field>
          <Field label="Workloads" htmlFor="ep-workloads">
            <div className="flex flex-wrap gap-3 text-sm">
              {WORKLOADS.map((w) => (
                <label key={w} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.workloads.includes(w)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        workloads: e.target.checked
                          ? [...form.workloads, w]
                          : form.workloads.filter((x) => x !== w),
                      })
                    }
                  />
                  {w}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </Modal>
    </section>
  );
};
