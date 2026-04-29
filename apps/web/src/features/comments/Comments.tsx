import { useEffect, useState } from 'react';
import { Button, Skeleton, Textarea, useToast } from '@ilinga/ui';
import { api } from '../../lib/api';
import { useTenant } from '../../lib/tenant';
import { formatDateTZ } from '../../lib/format';

export type CommentTarget = 'question_answers' | 'modules' | 'report_renders' | 'reports';

interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  deletedAt: string | null;
}

export const Comments = ({
  target,
  targetId,
  cycleId,
}: {
  target: CommentTarget;
  targetId: string;
  cycleId?: string;
}): JSX.Element => {
  const { current } = useTenant();
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const refresh = (): void => {
    if (!current) return;
    api
      .get<{ comments: Comment[] }>(
        `/v1/comments/tenant/${current.id}/${target}/${targetId}`,
      )
      .then((r) => setComments(r.comments))
      .catch(() => setComments([]));
  };

  useEffect(refresh, [current, target, targetId]);

  if (!current) return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace.</p>;

  const submit = async (): Promise<void> => {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/v1/comments/tenant/${current.id}`, {
        cycleId,
        targetTable: target,
        targetId,
        body,
      });
      setBody('');
      refresh();
    } catch {
      toast.push({ variant: 'error', title: 'Could not post comment' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Comments</h3>
      {comments === null && <Skeleton height={80} />}
      {comments && comments.filter((c) => !c.deletedAt).length === 0 && (
        <p className="text-xs text-[color:var(--color-fg-muted)]">No comments yet.</p>
      )}
      {comments && (
        <ul className="space-y-2">
          {comments
            .filter((c) => !c.deletedAt)
            .map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-[color:var(--color-border)] px-3 py-2"
              >
                <p className="text-xs text-[color:var(--color-fg-muted)]">
                  {c.authorId.slice(0, 8)}… · {formatDateTZ(c.createdAt, 'UTC')}
                </p>
                <p className="text-sm">{c.body}</p>
              </li>
            ))}
        </ul>
      )}
      <div>
        <Textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
        />
        <div className="mt-2">
          <Button size="sm" loading={submitting} onClick={submit}>
            Post
          </Button>
        </div>
      </div>
    </section>
  );
};
