import { Hono } from 'hono';
import { z } from 'zod';
import { ulid } from 'ulid';
import { and, desc, eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership } from '../lib/guard.js';
import { badRequest } from '../lib/problem.js';
import { presignPut, presignGet } from '../lib/storage/s3.js';
import { scanQueue } from '../lib/queues.js';

export const artifactRoutes = new Hono();
artifactRoutes.use('*', requireAuth);
artifactRoutes.use('*', requireCsrf);

const Presign = z.object({
  cycleId: z.string().uuid(),
  fileName: z.string().min(1).max(256),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z
    .number()
    .int()
    .min(1)
    .max(100 * 1024 * 1024),
  kind: z.enum(['pdf', 'deck', 'doc', 'image', 'other']).default('other'),
});

artifactRoutes.post('/tenant/:tid/presign', requireTenantMembership('tid'), async (c) => {
  const body = Presign.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest(body.error.message);
  const tenantId = c.req.param('tid');
  const userId = c.get('userId') as string;
  const id = ulid();
  const safeName = body.data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `artifacts/${tenantId}/${body.data.cycleId}/${id}-${safeName}`;
  const presign = await presignPut(key, body.data.mimeType);

  const db = getDb();
  const [row] = await db
    .insert(schema.ventureArtifacts)
    .values({
      tenantId,
      cycleId: body.data.cycleId,
      kind: body.data.kind,
      fileName: body.data.fileName,
      mimeType: body.data.mimeType,
      sizeBytes: body.data.sizeBytes,
      s3Key: key,
      extractionStatus: 'pending',
      uploadedBy: userId,
    })
    .returning({ id: schema.ventureArtifacts.id });
  if (!row) throw new Error('insert failed');
  await db.insert(schema.artifactScans).values({
    artifactId: row.id,
    status: 'queued',
  });
  return c.json({ id: row.id, key, uploadUrl: presign.url });
});

artifactRoutes.post('/tenant/:tid/:aid/finalize', requireTenantMembership('tid'), async (c) => {
  // Called after the client successfully PUTs to the presigned URL.
  // Enqueues scan + extraction jobs.
  const aid = c.req.param('aid');
  await scanQueue.add(
    'scan',
    { artifactId: aid, s3Key: '' },
    { jobId: `scan-${aid}`, removeOnComplete: 100, removeOnFail: 100 },
  );
  return c.json({ ok: true });
});

artifactRoutes.get('/tenant/:tid/cycle/:cid', requireTenantMembership('tid'), async (c) => {
  const rows = await getDb()
    .select({
      id: schema.ventureArtifacts.id,
      kind: schema.ventureArtifacts.kind,
      fileName: schema.ventureArtifacts.fileName,
      mimeType: schema.ventureArtifacts.mimeType,
      sizeBytes: schema.ventureArtifacts.sizeBytes,
      s3Key: schema.ventureArtifacts.s3Key,
      extractionStatus: schema.ventureArtifacts.extractionStatus,
      uploadedAt: schema.ventureArtifacts.uploadedAt,
      scanStatus: schema.artifactScans.status,
    })
    .from(schema.ventureArtifacts)
    .leftJoin(schema.artifactScans, eq(schema.artifactScans.artifactId, schema.ventureArtifacts.id))
    .where(
      and(
        eq(schema.ventureArtifacts.tenantId, c.req.param('tid')),
        eq(schema.ventureArtifacts.cycleId, c.req.param('cid')),
      ),
    )
    .orderBy(desc(schema.ventureArtifacts.uploadedAt));
  return c.json({ artifacts: rows });
});

artifactRoutes.get('/tenant/:tid/:aid/download', requireTenantMembership('tid'), async (c) => {
  const rows = await getDb()
    .select()
    .from(schema.ventureArtifacts)
    .where(
      and(
        eq(schema.ventureArtifacts.id, c.req.param('aid')),
        eq(schema.ventureArtifacts.tenantId, c.req.param('tid')),
      ),
    )
    .limit(1);
  if (!rows[0]) throw badRequest('not found');
  const url = await presignGet(rows[0].s3Key, 600);
  return c.json({ url });
});

artifactRoutes.delete('/tenant/:tid/:aid', requireTenantMembership('tid'), async (c) => {
  await getDb()
    .update(schema.ventureArtifacts)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(schema.ventureArtifacts.id, c.req.param('aid')),
        eq(schema.ventureArtifacts.tenantId, c.req.param('tid')),
      ),
    );
  return c.json({ ok: true });
});
