import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  Skeleton,
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
  { code: 'investor_pulse', label: 'Investor Pulse', priceLabel: 'Free' },
  { code: 'gtm_snapshot', label: 'GTM Snapshot', priceLabel: '5 credits' },
  { code: 'risk_map', label: 'Risk Map', priceLabel: '5 credits' },
  { code: 'board_brief', label: 'Board Brief', priceLabel: '8 credits' },
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
    return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace selected.</p>;
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={`/ventures/${vid}`} className="text-xs text-[color:var(--color-fg-muted)]">
            ← Venture
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        </div>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Render a new report</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {TEMPLATE_CHOICES.map((t) => (
            <Card key={t.code}>
              <CardHeader>{t.label}</CardHeader>
              <CardBody>
                <p className="text-xs text-[color:var(--color-fg-muted)]">{t.priceLabel}</p>
                <Button
                  className="mt-3 w-full"
                  loading={rendering === t.code}
                  onClick={() => renderTemplate(t.code)}
                >
                  Render
                </Button>
                <Button
                  variant="secondary"
                  className="mt-2 w-full"
                  onClick={() => renderTemplate(t.code, true)}
                >
                  Force re-render
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Past renders</h2>
        {error && <p className="text-sm text-[color:var(--color-danger)]">{error}</p>}
        {reports === null && !error && (
          <div className="space-y-2">
            <Skeleton height={48} />
            <Skeleton height={48} />
          </div>
        )}
        {reports && reports.length === 0 && (
          <EmptyState
            title="No reports yet"
            body="Render any of the templates above to get started."
          />
        )}
        {reports && reports.length > 0 && (
          <ul className="grid gap-2">
            {reports.map((r) => {
              const schedule = schedules.find((s) => s.reportId === r.id && !s.pausedAt);
              return (
                <li key={r.id}>
                  <Card>
                    <CardBody>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link to={`/reports/${r.id}`} className="min-w-0">
                          <p className="text-sm font-medium">{r.title}</p>
                          <p className="text-xs text-[color:var(--color-fg-muted)]">
                            {formatDateTZ(r.createdAt, 'UTC')} · keys {r.keysHash.slice(0, 12)}…
                          </p>
                        </Link>
                        <div className="flex items-center gap-2">
                          {schedule && (
                            <Badge tone="success">
                              next {formatDateTZ(schedule.nextRunAt, 'UTC')}
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setScheduleOpen(r.id)}
                          >
                            Schedule re-render
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
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
