import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useTenant } from '../../lib/tenant';

interface PaletteContextValue {
  open: boolean;
  toggle(): void;
  close(): void;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

const STATIC_ACTIONS: { label: string; to: string; section: string; hint?: string }[] = [
  { label: 'Dashboard', to: '/dashboard', section: 'Navigate', hint: 'g d' },
  { label: 'Ventures', to: '/ventures', section: 'Navigate', hint: 'g v' },
  { label: 'Reports', to: '/reports', section: 'Navigate', hint: 'g r' },
  { label: 'Credits', to: '/credits', section: 'Navigate', hint: 'g c' },
  { label: 'Trash', to: '/trash', section: 'Navigate' },
  { label: 'Workspace settings', to: '/settings/workspace', section: 'Settings' },
  { label: 'Team settings', to: '/settings/team', section: 'Settings' },
  { label: 'Billing', to: '/settings/billing', section: 'Settings' },
  { label: 'AI endpoints', to: '/settings/ai', section: 'Settings' },
  { label: 'Webhooks', to: '/settings/webhooks', section: 'Settings' },
  { label: 'API tokens', to: '/settings/api-tokens', section: 'Settings' },
  { label: 'Privacy & data', to: '/settings/privacy', section: 'Settings' },
  { label: 'Help', to: '/help', section: 'Other' },
  { label: 'Status page', to: '/status', section: 'Other' },
];

interface SearchHits {
  ventures: { id: string; name: string }[];
  reports: { id: string; title: string }[];
  keys: { id: string; code: string }[];
}

export const CommandPaletteProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [open, setOpen] = useState(false);
  const value = useMemo<PaletteContextValue>(
    () => ({ open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) }),
    [open],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <PaletteContext.Provider value={value}>
      {children}
      {open && <Palette close={() => setOpen(false)} />}
    </PaletteContext.Provider>
  );
};

const noopPalette: PaletteContextValue = {
  open: false,
  toggle: () => undefined,
  close: () => undefined,
};

export const useCommandPalette = (): PaletteContextValue =>
  useContext(PaletteContext) ?? noopPalette;

const Palette = ({ close }: { close: () => void }): JSX.Element => {
  const { current } = useTenant();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHits>({ ventures: [], reports: [], keys: [] });
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!current || q.trim().length < 2) {
      setHits({ ventures: [], reports: [], keys: [] });
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      api
        .get<SearchHits>(`/v1/search/tenant/${current.id}?q=${encodeURIComponent(q.trim())}`)
        .then(setHits)
        .catch(() => undefined);
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, current]);

  const filteredStatic = useMemo(
    () => STATIC_ACTIONS.filter((a) => a.label.toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  const items = useMemo(
    () =>
      [
        ...filteredStatic.map((a) => ({
          key: `static:${a.to}`,
          label: a.label,
          section: a.section,
          to: a.to,
        })),
        ...hits.ventures.map((v) => ({
          key: `venture:${v.id}`,
          label: v.name,
          section: 'Ventures',
          to: `/ventures/${v.id}`,
        })),
        ...hits.reports.map((r) => ({
          key: `report:${r.id}`,
          label: r.title,
          section: 'Reports',
          to: `/reports/${r.id}`,
        })),
        ...hits.keys.map((k) => ({
          key: `key:${k.id}`,
          label: k.code,
          section: 'Content keys',
          to: '/ventures',
        })),
      ].slice(0, 30),
    [filteredStatic, hits],
  );

  const choose = useCallback(
    (i: number) => {
      const it = items[i];
      if (!it) return;
      navigate(it.to);
      close();
    },
    [items, navigate, close],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
    >
      <div className="absolute inset-0 bg-black/40" onClick={close} aria-hidden="true" />
      <div className="relative z-10 w-[min(640px,calc(100%-2rem))] rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] shadow-[var(--shadow-lg)]">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((i) => Math.min(items.length - 1, i + 1));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              choose(active);
            }
          }}
          placeholder="Search ventures, reports, settings…"
          className="w-full rounded-t-md border-b border-[color:var(--color-border)] bg-transparent px-4 py-3 text-sm focus:outline-none"
        />
        <ul className="max-h-[60vh] overflow-y-auto py-1 text-sm">
          {items.length === 0 && (
            <li className="px-4 py-3 text-[color:var(--color-fg-muted)]">No matches.</li>
          )}
          {items.map((it, i) => (
            <li key={it.key}>
              <button
                type="button"
                onClick={() => choose(i)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center justify-between px-4 py-2 text-left ${
                  i === active ? 'bg-[color:var(--color-accent-soft)]' : ''
                }`}
              >
                <span>{it.label}</span>
                <span className="text-xs uppercase tracking-wide text-[color:var(--color-fg-subtle)]">
                  {it.section}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <footer className="border-t border-[color:var(--color-border)] px-4 py-2 text-xs text-[color:var(--color-fg-subtle)]">
          ⌘K · ↑↓ navigate · ↵ select · Esc close
        </footer>
      </div>
    </div>
  );
};
