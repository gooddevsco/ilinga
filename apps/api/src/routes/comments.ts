import { Hono } from 'hono';
import { z } from 'zod';
import { and, asc, eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { requireAuth, requireCsrf, requireTenantMembership } from '../lib/guard.js';
import { badRequest } from '../lib/problem.js';
import { appendAudit } from '../lib/audit/log.js';

export const commentRoutes = new Hono();
commentRoutes.use('*', requireAuth);
commentRoutes.use('*', requireCsrf);

const TARGETS = ['question_answers', 'modules', 'report_renders', 'reports'] as const;

const Create = z.object({
  cycleId: z.string().uuid().optional(),
  targetTable: z.enum(TARGETS),
  targetId: z.string().uuid(),
  body: z.string().min(1).max(8000),
  mentionedUserIds: z.array(z.string().uuid()).max(20).optional(),
});

commentRoutes.get(
  '/tenant/:tid/:targetTable/:targetId',
  requireTenantMembership('tid'),
  async (c) => {
    const rows = await getDb()
      .select()
      .from(schema.comments)
      .where(
        and(
          eq(schema.comments.tenantId, c.req.param('tid')),
          eq(schema.comments.targetTable, c.req.param('targetTable')),
          eq(schema.comments.targetId, c.req.param('targetId')),
        ),
      )
      .orderBy(asc(schema.comments.createdAt));
    return c.json({ comments: rows });
  },
);

commentRoutes.post('/tenant/:tid', requireTenantMembership('tid'), async (c) => {
  const body = Create.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) throw badRequest('invalid body');
  const userId = c.get('userId') as string;
  const tenantId = c.req.param('tid');
  const db = getDb();
  const [row] = await db
    .insert(schema.comments)
    .values({
      tenantId,
      cycleId: body.data.cycleId ?? null,
      targetTable: body.data.targetTable,
      targetId: body.data.targetId,
      authorId: userId,
      body: body.data.body,
    })
    .returning({ id: schema.comments.id });
  if (body.data.mentionedUserIds && body.data.mentionedUserIds.length > 0) {
    await db
      .insert(schema.commentMentions)
      .values(body.data.mentionedUserIds.map((u) => ({ commentId: row!.id, mentionedUserId: u })));
    const preview =
      body.data.body.length > 200 ? `${body.data.body.slice(0, 197)}...` : body.data.body;
    await db.insert(schema.notifications).values(
      body.data.mentionedUserIds.map((u) => ({
        tenantId,
        userId: u,
        kind: 'comment.mention',
        title: 'You were mentioned in a comment',
        body: preview,
        data: {
          commentId: row!.id,
          targetTable: body.data.targetTable,
          targetId: body.data.targetId,
          cycleId: body.data.cycleId ?? null,
        },
      })),
    );
  }
  await appendAudit({
    tenantId,
    actorUserId: userId,
    action: 'comment.created',
    targetTable: body.data.targetTable,
    targetId: body.data.targetId,
    payload: { commentId: row!.id },
    requestId: c.get('requestId') as string | null,
  });
  return c.json({ id: row!.id }, 201);
});

commentRoutes.delete('/tenant/:tid/:cid', requireTenantMembership('tid'), async (c) => {
  const userId = c.get('userId') as string;
  await getDb()
    .update(schema.comments)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(schema.comments.id, c.req.param('cid')),
        eq(schema.comments.tenantId, c.req.param('tid')),
        eq(schema.comments.authorId, userId),
      ),
    );
  return c.json({ ok: true });
});
