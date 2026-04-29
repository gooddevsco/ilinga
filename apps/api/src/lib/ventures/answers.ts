import { and, eq } from 'drizzle-orm';
import { schema, getDb } from '@ilinga/db';
import { preconditionFailed } from '../problem.js';

export const upsertAnswer = async (
  tenantId: string,
  cycleId: string,
  questionId: string,
  userId: string,
  rawValue: unknown,
  ifMatchVersion: number | null,
): Promise<{ id: string; version: number }> => {
  const db = getDb();
  const existing = await db
    .select()
    .from(schema.questionAnswers)
    .where(
      and(
        eq(schema.questionAnswers.cycleId, cycleId),
        eq(schema.questionAnswers.questionId, questionId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    if (ifMatchVersion !== null && existing[0].version !== ifMatchVersion) {
      throw preconditionFailed('answer was edited concurrently', {
        currentVersion: existing[0].version,
        currentValue: existing[0].rawValue,
      });
    }
    const [updated] = await db
      .update(schema.questionAnswers)
      .set({
        rawValue: (rawValue ?? null) as never,
        version: existing[0].version + 1,
        answeredBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(schema.questionAnswers.id, existing[0].id))
      .returning({ id: schema.questionAnswers.id, version: schema.questionAnswers.version });
    return updated!;
  }

  const [created] = await db
    .insert(schema.questionAnswers)
    .values({
      tenantId,
      cycleId,
      questionId,
      answeredBy: userId,
      rawValue: (rawValue ?? null) as never,
      version: 1,
    })
    .returning({ id: schema.questionAnswers.id, version: schema.questionAnswers.version });
  return created!;
};

export const listAnswers = (tenantId: string, cycleId: string) =>
  getDb()
    .select()
    .from(schema.questionAnswers)
    .where(
      and(
        eq(schema.questionAnswers.tenantId, tenantId),
        eq(schema.questionAnswers.cycleId, cycleId),
      ),
    );
