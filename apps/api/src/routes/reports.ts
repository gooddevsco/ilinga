import { Hono } from 'hono';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership } from '../lib/guard.js';
import { renderTemplate } from '../lib/reports/handlebars.js';
import {
  buildSnapshotForCycle,
  createReport,
  findReusableRender,
  listReports,
} from '../lib/reports/service.js';
import { badRequest, notFound } from '../lib/problem.js';

export const reportRoutes = new Hono();
reportRoutes.use('*', requireAuth);
reportRoutes.use('*', requireCsrf);

const Create = z.object({
  cycleId: z.string().uuid(),
  templateCode: z.string().min(2).max(64),
  title: z.string().min(2).max(200).optional(),
  forced: z.boolean().optional(),
});

reportRoutes.post('/tenant/:tid/render', requireTenantMembership('tid'), async (c) => {
  const body = Create.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid body');
  const tenantId = c.req.param('tid');
  const userId = c.get('userId') as string;

  const db = getDb();
  const tplRows = await db
    .select()
    .from(schema.reportTemplates)
    .where(eq(schema.reportTemplates.code, body.data.templateCode))
    .limit(1);
  const tpl = tplRows[0];
  if (!tpl) throw notFound('template not found');

  const report = await createReport({
    tenantId,
    cycleId: body.data.cycleId,
    templateId: tpl.id,
    title: body.data.title ?? tpl.displayName,
    userId,
  });

  // Free re-render: if a previous identical render exists, return its keys.
  if (!body.data.forced) {
    const reuse = await findReusableRender(tenantId, tpl.id, report.keysHash);
    if (reuse) {
      const [render] = await db
        .insert(schema.reportRenders)
        .values({
          tenantId,
          reportId: report.id,
          status: 'complete',
          htmlS3Key: reuse.htmlS3Key,
          pdfS3Key: reuse.pdfS3Key,
          creditsCharged: 0,
          forced: false,
          completedAt: new Date(),
        })
        .returning();
      return c.json({ reportId: report.id, renderId: render!.id, reused: true });
    }
  }

  const snapshot = await buildSnapshotForCycle(tenantId, body.data.cycleId);
  const html = renderTemplate(tpl.handlebarsHtml, { venture: { name: 'Venture' }, ...snapshot });
  const htmlKey = `reports/${tenantId}/${report.id}.html`;
  const pdfKey = `reports/${tenantId}/${report.id}.pdf`;
  // Synchronous "render" in Phase 8 (Playwright launched by the worker app
  // in production; here we just persist the HTML reference).
  void html;

  const [render] = await db
    .insert(schema.reportRenders)
    .values({
      tenantId,
      reportId: report.id,
      status: 'complete',
      htmlS3Key: htmlKey,
      pdfS3Key: pdfKey,
      creditsCharged: tpl.creditCost,
      forced: !!body.data.forced,
      completedAt: new Date(),
    })
    .returning();

  return c.json({ reportId: report.id, renderId: render!.id, creditsCharged: tpl.creditCost });
});

reportRoutes.get('/tenant/:tid/cycle/:cid', requireTenantMembership('tid'), async (c) => {
  const reports = await listReports(c.req.param('tid'), c.req.param('cid'));
  return c.json({ reports });
});

reportRoutes.get('/:rid', async (c) => {
  const db = getDb();
  const userId = c.get('userId') as string;
  const rep = await db
    .select()
    .from(schema.reports)
    .where(eq(schema.reports.id, c.req.param('rid')))
    .limit(1);
  if (!rep[0]) throw notFound();
  // tenant scope check
  const member = await db
    .select()
    .from(schema.tenantMembers)
    .where(
      and(eq(schema.tenantMembers.tenantId, rep[0].tenantId), eq(schema.tenantMembers.userId, userId)),
    )
    .limit(1);
  if (!member[0]) throw notFound();
  const renders = await db
    .select()
    .from(schema.reportRenders)
    .where(eq(schema.reportRenders.reportId, rep[0].id));
  return c.json({ report: rep[0], renders });
});

reportRoutes.post(
  '/tenant/:tid/render/:rid/cancel',
  requireTenantMembership('tid'),
  async (c) => {
    const db = getDb();
    await db
      .update(schema.reportRenders)
      .set({ status: 'cancelled', cancelledAt: new Date() })
      .where(eq(schema.reportRenders.id, c.req.param('rid')));
    return c.json({ ok: true });
  },
);
