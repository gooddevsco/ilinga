import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, CardBody, CardHeader, useToast } from '@ilinga/ui';
import { api } from '../../lib/api';
import { useTenant } from '../../lib/tenant';
import { AgentStream } from '../../features/synthesis/AgentStream';
import { PipelineGraph, type Stage } from '../../features/synthesis/PipelineGraph';
import { PresenceDots } from '../../features/synthesis/PresenceDots';
import { usePresenceBeacon } from '../../lib/streaming/usePresenceBeacon';

const DEFAULT_STAGES: Stage[] = [
  { code: 'narrative.summary', cluster: 'Narrative', label: 'Executive narrative' },
  { code: 'risk.top', cluster: 'Risk', label: 'Top risks' },
  { code: 'gtm.icp', cluster: 'GTM', label: 'Ideal customer profile' },
];

export const Synthesis = (): JSX.Element => {
  const { vid, cid } = useParams<{ vid: string; cid: string }>();
  const { current } = useTenant();
  const [running, setRunning] = useState(false);
  const [briefText, setBriefText] = useState('');
  const toast = useToast();
  usePresenceBeacon(cid, 'synthesis');

  if (!current || !vid || !cid) {
    return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace selected.</p>;
  }

  const start = async (): Promise<void> => {
    setRunning(true);
    try {
      await api.post(`/v1/synthesis/tenant/${current.id}/cycles/${cid}/start`, {
        briefText:
          briefText ||
          'No brief text provided. Run the interview first to give the agents better context.',
      });
      toast.push({ variant: 'success', title: 'Synthesis started' });
    } catch (err) {
      toast.push({
        variant: 'error',
        title: 'Could not start synthesis',
        body: (err as Error).message,
      });
    }
  };

  const cancel = async (): Promise<void> => {
    try {
      await api.post(`/v1/synthesis/tenant/${current.id}/cycles/${cid}/cancel`);
      toast.push({ variant: 'info', title: 'Cancellation requested' });
    } catch {
      toast.push({ variant: 'error', title: 'Cancel failed' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={`/ventures/${vid}`} className="text-xs text-[color:var(--color-fg-muted)]">
            ← Venture
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Synthesis</h1>
        </div>
        <PresenceDots cycleId={cid} />
        <div className="flex gap-2">
          <Button onClick={start} loading={running} disabled={running}>
            Run synthesis
          </Button>
          <Button variant="secondary" onClick={cancel}>
            Cancel
          </Button>
          <Link
            to={`/ventures/${vid}/cycles/${cid}/reports`}
            className="inline-flex h-10 items-center rounded-md border border-[color:var(--color-border)] px-4 text-sm"
          >
            Reports
          </Link>
        </div>
      </header>

      <Card>
        <CardHeader>Brief context</CardHeader>
        <CardBody>
          <textarea
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
            rows={4}
            placeholder="Paste in the latest brief or notes; the agents fold this in alongside interview answers."
            className="block w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3 text-sm"
          />
        </CardBody>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold">Pipeline</h2>
          <PipelineGraph cycleId={cid} stages={DEFAULT_STAGES} />
        </div>
        <div className="h-[420px]">
          <h2 className="mb-2 text-sm font-semibold">Live agent stream</h2>
          <AgentStream cycleId={cid} />
        </div>
      </section>
    </div>
  );
};
