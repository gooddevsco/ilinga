import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Card, Eyebrow, Icons, Skeleton, Tag } from '@ilinga/ui';
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

const renderTone = (status: string): 'green' | 'ochre' | 'neutral' => {
  if (status === 'complete') return 'green';
  if (status === 'failed' || status === 'error') return 'ochre';
  return 'neutral';
};

export const ReportViewer = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{
    report: Report;
    renders: Render[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ report: Report; renders: Render[] }>(`/v1/reports/${id}`)
      .then(setData)
      .catch((e: ApiError) => setError(`Status ${e.status}`));
  }, [id]);

  if (error) return <p className="text-[13px] text-[color:var(--danger)]">{error}</p>;
  if (!data) return <Skeleton height={400} />;

  const latest = [...data.renders].sort(
    (a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime(),
  )[0];
  const liveRender =
    latest && (latest.status === 'queued' || latest.status === 'rendering') ? latest : null;

  const keys = Object.entries(data.report.inputKeySnapshot ?? {});

  return (
    <div
      className="r-paper-shell flex flex-col gap-4 p-4 md:p-7"
      style={{ background: '#1A1A1D', borderRadius: 12 }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/reports"
          className="mono text-[11px] uppercase tracking-[0.10em]"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          ← Reports
        </Link>
        <div
          className="flex items-center gap-2 text-[12px]"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          {liveRender ? (
            <Tag tone="signal" dot>
              Rendering…
            </Tag>
          ) : (
            <Tag tone="green">Ready</Tag>
          )}
          <span className="mono uppercase tracking-[0.10em]">
            SNAPSHOT {formatDateTZ(data.report.createdAt, 'UTC')}
          </span>
        </div>
      </header>

      {liveRender && (
        <Card className="p-4">
          <RenderProgress
            cycleId={data.report.cycleId}
            reportId={data.report.id}
            renderId={liveRender.id}
          />
        </Card>
      )}

      <div
        className="r-paper-page mx-auto w-full"
        style={{
          background: '#FFFFFF',
          color: 'var(--ink)',
          borderRadius: 12,
          maxWidth: 960,
          padding: '64px 80px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.45)',
        }}
      >
        <Eyebrow>Report</Eyebrow>
        <h1
          className="serif mt-2 text-[40px] tracking-tight"
          style={{ fontWeight: 500, lineHeight: 1.1, letterSpacing: '-0.02em' }}
        >
          {data.report.title}
        </h1>
        <div className="mono mt-2 text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
          GENERATED {formatDateTZ(data.report.createdAt, 'UTC')}
        </div>

        {/* Section: keys */}
        <section className="mt-10">
          <Eyebrow>Synthesised keys</Eyebrow>
          {keys.length === 0 ? (
            <p className="mt-3 text-[14px] text-[color:var(--ink-mute)]">
              No keys captured in this snapshot.
            </p>
          ) : (
            <table className="cmp mt-3">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {keys.map(([code, value]) => (
                  <tr key={code}>
                    <td className="mono text-[11px] text-[color:var(--ink-mute)]">{code}</td>
                    <td>
                      <pre
                        className="whitespace-pre-wrap text-[13px]"
                        style={{ fontFamily: 'inherit', maxWidth: 640 }}
                      >
                        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Section: renders */}
        <section className="mt-10">
          <Eyebrow>Renders</Eyebrow>
          <ul className="mt-3 flex flex-col gap-2">
            {data.renders.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--line)] py-2 text-[13px]"
              >
                <div className="flex items-center gap-3">
                  <Tag tone={renderTone(r.status)}>{r.status.toUpperCase()}</Tag>
                  {r.completedAt && (
                    <span className="text-[color:var(--ink-mute)]">
                      completed {formatDateTZ(r.completedAt, 'UTC')}
                    </span>
                  )}
                  {r.pageCount != null && (
                    <span className="mono text-[11px] text-[color:var(--ink-faint)]">
                      {r.pageCount} PAGES
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {r.htmlS3Key && (
                    <a
                      href={`/api-proxy/${encodeURIComponent(r.htmlS3Key)}`}
                      className="inline-flex"
                    >
                      <Button variant="secondary" size="sm" type="button">
                        <Icons.external /> HTML
                      </Button>
                    </a>
                  )}
                  {r.pdfS3Key && (
                    <a
                      href={`/api-proxy/${encodeURIComponent(r.pdfS3Key)}`}
                      className="inline-flex"
                    >
                      <Button variant="primary" size="sm" type="button">
                        <Icons.download /> PDF
                      </Button>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <Eyebrow>Comments</Eyebrow>
          <div className="mt-3">
            <Comments target="reports" targetId={data.report.id} cycleId={data.report.cycleId} />
          </div>
        </section>
      </div>
    </div>
  );
};
