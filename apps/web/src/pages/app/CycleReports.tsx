import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  EmptyState,
  Eyebrow,
  Field,
  Icons,
  Input,
  Modal,
  Skeleton,
  Tag,
  useToast,
} from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';
import { formatDateTZ } from '../../lib/format';

interface Report {
  id: string;
  title: string;
  templateId: string;
  keysHash: string;
  createdAt: string;
}

const TEMPLATE_CHOICES = [
  {
    code: 'investor_pulse',
    label: 'Investor Pulse',
    cost: 0,
    pages: 4,
    tier: 'Free' as const,
  },
  {
    code: 'gtm_snapshot',
    label: 'GTM Snapshot',
    cost: 5,
    pages: 6,
    tier: 'Pro' as const,
  },
  {
    code: 'risk_map',
    label: 'Risk Map',
    cost: 5,
    pages: 6,
    tier: 'Pro' as const,
  },
  {
    code: 'board_brief',
    label: 'Board Brief',
    cost: 8,
    pages: 8,
    tier: 'Premium' as const,
  },
];

interface Schedule {
  id: string;
  reportId: string;
  cron: string;
  nextRunAt: string;
  pausedAt: string | null;
}

export const CycleReports = (): JSX.Element => {
  const { vid, cid } = useParams<{ vid: string; cid: string }>();
  const { current } = useTenant();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    cron: '0 9 * * 1',
    nextRunAt: '',
  });
  const toast = useToast();

  const refresh = (): void => {
    if (!current || !cid) return;
    api
      .get<{ reports: Report[] }>(`/v1/reports/tenant/${current.id}/cycle/${cid}`)
      .then((r) => setReports(r.reports))
      .catch((e: ApiError) => setError(`Status ${e.status}`));
    api
      .get<{ schedules: Schedule[] }>(`/v1/reports/tenant/${current.id}/schedules`)
      .then((r) => setSchedules(r.schedules))
      .catch(() => setSchedules([]));
  };

  useEffect(refresh, [current, cid]);

  const renderTemplate = async (templateCode: string, forced = false): Promise<void> => {
    if (!current || !cid) return;
    setRendering(templateCode);
    try {
      await api.post(`/v1/reports/tenant/${current.id}/render`, {
        cycleId: cid,
        templateCode,
        forced,
      });
      toast.push({ variant: 'success', title: 'Render queued' });
      refresh();
    } catch (e) {
      toast.push({
        variant: 'error',
        title: 'Render failed',
        body: `Status ${(e as ApiError).status}`,
      });
    } finally {
      setRendering(null);
    }
  };

  if (!current || !vid || !cid) {
    return <p className="text-[13px] text-[color:var(--ink-mute)]">No workspace selected.</p>;
  }

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
            Cycle reports
          </h1>
        </div>
      </header>

      <section>
        <Eyebrow>Templates</Eyebrow>
        <div
          className="r-cards-4 mt-3 grid gap-4"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          {TEMPLATE_CHOICES.map((t) => (
            <Card key={t.code} className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <Tag tone={t.cost === 0 ? 'signal' : 'neutral'}>
                  {t.cost > 0 && <Icons.lock />} {t.tier}
                </Tag>
                <span
                  className="mono text-[11px]"
                  style={{
                    color: t.cost === 0 ? 'var(--signal)' : 'var(--ink-faint)',
                  }}
                >
                  {t.cost === 0 ? 'INCLUDED' : `${t.cost} CR`}
                </span>
              </div>
              <div className="text-[14px]" style={{ fontWeight: 500 }}>
                {t.label}
              </div>
              <div className="mono text-[10px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
                ~{t.pages} PAGES
              </div>
              <Button
                variant="primary"
                size="sm"
                type="button"
                loading={rendering === t.code}
                onClick={() => renderTemplate(t.code)}
              >
                Render
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => renderTemplate(t.code, true)}
              >
                Force re-render
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <Eyebrow>Past renders</Eyebrow>
          <span className="mono text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
            {reports?.length ?? 0} TOTAL
          </span>
        </div>
        {error && <p className="mt-2 text-[13px] text-[color:var(--danger)]">{error}</p>}
        {reports === null && !error && (
          <div className="mt-3 flex flex-col gap-2">
            <Skeleton height={56} />
            <Skeleton height={56} />
          </div>
        )}
        {reports && reports.length === 0 && (
          <Card className="mt-3 p-8">
            <EmptyState title="No renders yet" body="Render any template above to get started." />
          </Card>
        )}
        {reports && reports.length > 0 && (
          <Card className="mt-3 overflow-hidden">
            <table className="cmp">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Created</th>
                  <th>Keys</th>
                  <th>Schedule</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => {
                  const schedule = schedules.find((s) => s.reportId === r.id && !s.pausedAt);
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>
                        <Link to={`/reports/${r.id}`} className="hover:underline">
                          {r.title}
                        </Link>
                      </td>
                      <td className="mono text-[color:var(--ink-mute)]">
                        {formatDateTZ(r.createdAt, 'UTC')}
                      </td>
                      <td className="mono text-[11px] text-[color:var(--ink-faint)]">
                        {r.keysHash.slice(0, 12)}…
                      </td>
                      <td>
                        {schedule ? (
                          <Tag tone="green">next {formatDateTZ(schedule.nextRunAt, 'UTC')}</Tag>
                        ) : (
                          <span className="mono text-[11px] text-[color:var(--ink-faint)]">—</span>
                        )}
                      </td>
                      <td className="text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          type="button"
                          onClick={() => setScheduleOpen(r.id)}
                        >
                          Schedule
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <Modal
        open={scheduleOpen !== null}
        onClose={() => setScheduleOpen(null)}
        title="Schedule a future re-render"
        footer={
          <>
            <Button variant="secondary" onClick={() => setScheduleOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!current || !scheduleOpen) return;
                try {
                  await api.post(`/v1/reports/tenant/${current.id}/schedules`, {
                    reportId: scheduleOpen,
                    cron: scheduleForm.cron,
                    nextRunAt: new Date(scheduleForm.nextRunAt).toISOString(),
                  });
                  toast.push({ variant: 'success', title: 'Schedule saved' });
                  setScheduleOpen(null);
                  refresh();
                } catch {
                  toast.push({ variant: 'error', title: 'Could not save schedule' });
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Field
          label="Cron schedule"
          htmlFor="cr-cron"
          hint="e.g. '0 9 * * 1' = Mondays at 09:00 UTC"
        >
          <Input
            id="cr-cron"
            value={scheduleForm.cron}
            onChange={(e) => setScheduleForm({ ...scheduleForm, cron: e.target.value })}
          />
        </Field>
        <Field label="First run" htmlFor="cr-first">
          <Input
            id="cr-first"
            type="datetime-local"
            value={scheduleForm.nextRunAt}
            onChange={(e) => setScheduleForm({ ...scheduleForm, nextRunAt: e.target.value })}
          />
        </Field>
      </Modal>
    </div>
  );
};
