import { useMemo } from 'react';
import { useEventStream } from '../../lib/streaming/useEventStream';

interface Member {
  userId: string;
  location?: string;
  lastSeenAt: number;
}

const MAX_AVATARS = 5;

const colorFor = (userId: string): string => {
  let h = 0;
  for (let i = 0; i < userId.length; i += 1) h = (h * 31 + userId.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 60%, 45%)`;
};

const initials = (userId: string): string => userId.slice(0, 2).toUpperCase();

export const PresenceDots = ({ cycleId }: { cycleId: string }): JSX.Element => {
  const { events } = useEventStream({
    path: `/v1/cycles/${cycleId}/presence`,
    events: ['presence.joined', 'presence.left', 'presence.location'],
  });

  const members = useMemo(() => {
    const map = new Map<string, Member>();
    for (const e of events) {
      const d = e.data as { userId?: string; location?: string };
      if (!d.userId) continue;
      const existing = map.get(d.userId);
      if (e.event === 'presence.left') {
        map.delete(d.userId);
        continue;
      }
      map.set(d.userId, {
        userId: d.userId,
        location: d.location ?? existing?.location,
        lastSeenAt: Date.now(),
      });
    }
    return Array.from(map.values()).slice(0, MAX_AVATARS + 1);
  }, [events]);

  if (members.length === 0) {
    return (
      <p className="text-xs text-[color:var(--color-fg-subtle)]" aria-live="polite">
        Just you here.
      </p>
    );
  }

  const visible = members.slice(0, MAX_AVATARS);
  const overflow = members.length - visible.length;

  return (
    <div className="flex items-center gap-1" aria-live="polite">
      {visible.map((m) => (
        <span
          key={m.userId}
          title={`${m.userId}${m.location ? ` · ${m.location}` : ''}`}
          aria-label={`${m.userId} present${m.location ? ` at ${m.location}` : ''}`}
          className="inline-flex size-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
          style={{ backgroundColor: colorFor(m.userId) }}
        >
          {initials(m.userId)}
        </span>
      ))}
      {overflow > 0 && (
        <span className="ml-1 inline-flex size-7 items-center justify-center rounded-full bg-[color:var(--color-accent-soft)] text-[10px] font-semibold">
          +{overflow}
        </span>
      )}
    </div>
  );
};
