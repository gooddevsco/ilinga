import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Card, CardBody, CardHeader, Skeleton } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { formatDateTZ } from '../../lib/format';
import { Comments } from '../../features/comments/Comments';
import { RenderProgress } from '../../features/synthesis/RenderProgress';

interface Report {
  id: string;
  cycleId: string;
  title: string;
  inputKeySnapshot: Record<string, unknown>;
  createdAt: string;
}

interface Render {
  id: string;
  status: string;
  htmlS3Key: string | null;
  pdfS3Key: string | null;
  pageCount: number | null;
  completedAt: string | null;
  queuedAt: string;
}

export const ReportViewer = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ report: Report; renders: Render[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ report: Report; renders: Render[] }>(`/v1/reports/${id}`)
      .then(setData)
      .catch((e: ApiError) => setError(`Status ${e.status}`));
  }, [id]);

  if (error) return <p className="text-sm text-[color:var(--color-danger)]">{error}</p>;
  if (!data) return <Skeleton height={200} />;

  // Most recent in-flight render gets a live progress strip; completed ones don't.
  const latest = [...data.renders].sort(
    (a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime(),
  )[0];
  const liveRender =
    latest && (latest.status === 'queued' || latest.status === 'rendering') ? latest : null;

  return (
    <div className="space-y-6">
      <header>
        <Link to="/reports" className="text-xs text-[color:var(--color-fg-muted)]">
          ← Reports
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{data.report.title}</h1>
        <p className="text-xs text-[color:var(--color-fg-muted)]">
          Snapshot taken {formatDateTZ(data.report.createdAt, 'UTC')}
        </p>
      </header>
      {liveRender && (
        <RenderProgress
          cycleId={data.report.cycleId}
          reportId={data.report.id}
          renderId={liveRender.id}
        />
      )}
      <Card>
        <CardHeader>Renders</CardHeader>
        <CardBody>
          <ul className="space-y-2">
            {data.renders.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <Badge tone={r.status === 'complete' ? 'success' : 'warning'}>{r.status}</Badge>{' '}
                  {r.completedAt && (
                    <span className="text-[color:var(--color-fg-muted)]">
                      · completed {formatDateTZ(r.completedAt, 'UTC')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {r.htmlS3Key && (
                    <a
                      href={`/api-proxy/${encodeURIComponent(r.htmlS3Key)}`}
                      className="text-sm underline"
                    >
                      HTML
                    </a>
                  )}
                  {r.pdfS3Key && (
                    <a
                      href={`/api-proxy/${encodeURIComponent(r.pdfS3Key)}`}
                      className="text-sm underline"
                    >
                      PDF
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>Input snapshot</CardHeader>
        <CardBody>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">
            {JSON.stringify(data.report.inputKeySnapshot, null, 2)}
          </pre>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Comments target="reports" targetId={data.report.id} cycleId={data.report.cycleId} />
        </CardBody>
      </Card>
    </div>
  );
};
