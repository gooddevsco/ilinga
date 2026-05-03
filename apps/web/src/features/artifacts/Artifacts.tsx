import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, CardBody, EmptyState, Skeleton, useToast } from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';
import { formatDateTZ } from '../../lib/format';

interface Artifact {
  id: string;
  kind: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  s3Key: string;
  extractionStatus: string;
  scanStatus: string | null;
  uploadedAt: string;
}

const inferKind = (mimeType: string): 'pdf' | 'deck' | 'doc' | 'image' | 'other' => {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'deck';
  if (mimeType.includes('word') || mimeType === 'text/plain') return 'doc';
  return 'other';
};

export const Artifacts = ({ cycleId }: { cycleId: string }): JSX.Element => {
  const { current } = useTenant();
  const [items, setItems] = useState<Artifact[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const toast = useToast();

  const refresh = (): void => {
    if (!current) return;
    api
      .get<{ artifacts: Artifact[] }>(`/v1/artifacts/tenant/${current.id}/cycle/${cycleId}`)
      .then((r) => setItems(r.artifacts))
      .catch(() => setItems([]));
  };
  useEffect(refresh, [current, cycleId]);

  const upload = async (file: File): Promise<void> => {
    if (!current) return;
    setUploading(true);
    try {
      const { id, uploadUrl } = await api.post<{ id: string; uploadUrl: string }>(
        `/v1/artifacts/tenant/${current.id}/presign`,
        {
          cycleId,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          kind: inferKind(file.type),
        },
      );
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!put.ok) throw new Error(`upload ${put.status}`);
      await api.post(`/v1/artifacts/tenant/${current.id}/${id}/finalize`);
      toast.push({ variant: 'success', title: 'Uploaded' });
      refresh();
    } catch (err) {
      toast.push({
        variant: 'error',
        title: 'Upload failed',
        body:
          (err as ApiError).status !== undefined
            ? `Status ${(err as ApiError).status}`
            : (err as Error).message,
      });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const download = async (id: string): Promise<void> => {
    if (!current) return;
    const { url } = await api.get<{ url: string }>(
      `/v1/artifacts/tenant/${current.id}/${id}/download`,
    );
    window.open(url, '_blank', 'noopener');
  };

  const remove = async (id: string): Promise<void> => {
    if (!current) return;
    if (!window.confirm('Delete this artifact?')) return;
    await api.delete(`/v1/artifacts/tenant/${current.id}/${id}`);
    refresh();
  };

  return (
    <Card>
      <CardBody>
        <header className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Artifacts</h3>
          <div>
            <input
              type="file"
              ref={fileInput}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
            <Button size="sm" onClick={() => fileInput.current?.click()} loading={uploading}>
              Upload
            </Button>
          </div>
        </header>
        {items === null && <Skeleton height={48} />}
        {items && items.length === 0 && (
          <EmptyState
            title="No artifacts yet"
            body="Upload PDFs, decks, docs, or images. We scan, extract, and feed them into synthesis."
          />
        )}
        {items && items.length > 0 && (
          <ul className="space-y-2">
            {items.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[color:var(--color-border)] px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.fileName}</p>
                  <p className="text-xs text-[color:var(--color-fg-muted)]">
                    {a.kind} ·{' '}
                    {a.sizeBytes ? `${Math.round((a.sizeBytes ?? 0) / 1024)} KB` : 'unknown size'}·{' '}
                    {formatDateTZ(a.uploadedAt, 'UTC')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={a.scanStatus === 'clean' ? 'success' : 'warning'}>
                    scan: {a.scanStatus ?? 'queued'}
                  </Badge>
                  <Badge tone={a.extractionStatus === 'complete' ? 'success' : 'info'}>
                    extract: {a.extractionStatus}
                  </Badge>
                  <Button size="sm" variant="secondary" onClick={() => void download(a.id)}>
                    Download
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void remove(a.id)}>
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
};
