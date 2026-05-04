import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Eyebrow, Icons, Tag, Textarea, useToast } from '@ilinga/ui';
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

const stripeStages = [
  { code: 'parse', label: 'Parse', sub: 'Read brief + answers' },
  { code: 'cluster', label: 'Cluster', sub: 'Map to interview clusters' },
  { code: 'fanout', label: 'Fan out', sub: 'Spawn module prompts' },
  { code: 'synth', label: 'Synthesise', sub: 'Generate module bodies' },
  { code: 'reduce', label: 'Reduce', sub: 'Pick best candidates' },
  { code: 'commit', label: 'Commit', sub: 'Lock keys for render' },
];

export const Synthesis = (): JSX.Element => {
  const { vid, cid } = useParams<{ vid: string; cid: string }>();
  const { current } = useTenant();
  const [running, setRunning] = useState(false);
  const [briefText, setBriefText] = useState('');
  const toast = useToast();
  usePresenceBeacon(cid, 'synthesis');

  if (!current || !vid || !cid) {
    return <p className="text-[13px] text-[color:var(--ink-mute)]">No workspace selected.</p>;
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
            Synthesis pipeline
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PresenceDots cycleId={cid} />
          <Button
            variant="primary"
            type="button"
            loading={running}
            disabled={running}
            onClick={start}
          >
            <Icons.spark /> Run synthesis
          </Button>
          <Button variant="secondary" type="button" onClick={cancel}>
            Cancel
          </Button>
          <Link to={`/ventures/${vid}/cycles/${cid}/reports`}>
            <Button variant="ghost" type="button">
              Reports
            </Button>
          </Link>
        </div>
      </header>

      {/* Pipeline strip */}
      <Card className="p-5">
        <Eyebrow>Pipeline</Eyebrow>
        <div
          className="r-synth-stages mt-4 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${stripeStages.length}, 1fr)` }}
        >
          {stripeStages.map((s, i) => (
            <div
              key={s.code}
              className="rounded-md border border-[color:var(--line)] bg-[color:var(--bg-1)] p-3"
            >
              <div className="flex items-center justify-between">
                <span className="mono text-[11px]" style={{ color: 'var(--signal)' }}>
                  0{i + 1}
                </span>
                <Tag>{i === 0 ? 'READY' : 'IDLE'}</Tag>
              </div>
              <div className="mt-2 text-[13px]" style={{ fontWeight: 500 }}>
                {s.label}
              </div>
              <div className="mono mt-1 text-[10px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <Eyebrow>Brief context</Eyebrow>
        <p className="mt-1 text-[13px] text-[color:var(--ink-mute)]">
          The agent reads this in addition to your interview answers. Paste any extra context the
          team wrote up — strategy memos, links, raw notes.
        </p>
        <Textarea
          className="mt-3"
          rows={5}
          value={briefText}
          onChange={(e) => setBriefText(e.target.value)}
          placeholder="Paste in the latest brief or notes; the agents fold this in alongside interview answers."
        />
      </Card>

      <section className="r-2col grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card className="p-5">
          <Eyebrow>Stage map</Eyebrow>
          <div className="mt-3">
            <PipelineGraph cycleId={cid} stages={DEFAULT_STAGES} />
          </div>
        </Card>
        <Card className="p-5" style={{ minHeight: 460 }}>
          <Eyebrow>Live agent stream</Eyebrow>
          <div className="mt-3 h-[420px]">
            <AgentStream cycleId={cid} />
          </div>
        </Card>
      </section>
    </div>
  );
};
