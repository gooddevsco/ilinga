import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Eyebrow,
  Field,
  Icons,
  Input,
  Modal,
  ProgressBar,
  Skeleton,
  Tag,
  Toggle,
  cn,
  useToast,
} from '@ilinga/ui';
import { api, type ApiError } from '../../lib/api';
import { useTenant } from '../../lib/tenant';
import { formatDateTZ, formatMoney } from '../../lib/format';

interface AutoTopup {
  enabled: boolean;
  thresholdCredits: number;
  packCode: string;
  monthlyCapCents: number | null;
  spentThisPeriodCents: number;
}

interface LedgerEntry {
  id: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
}

interface Invoice {
  id: string;
  issuedAt: string;
  amountCents: number;
  currency: string;
  pdfS3Key: string | null;
  status: string;
}

const PACKS = [
  { code: 'pack100', label: '100', credits: 100, usd: 12 },
  { code: 'pack500', label: '500', credits: 500, usd: 49 },
  { code: 'pack2k', label: '2,000', credits: 2000, usd: 179 },
  { code: 'pack10k', label: '10,000', credits: 10000, usd: 799 },
] as const;

export const Credits = (): JSX.Element => {
  const { current } = useTenant();
  const [balance, setBalance] = useState<number | null>(null);
  const [config, setConfig] = useState<AutoTopup | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[] | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<AutoTopup>({
    enabled: false,
    thresholdCredits: 50,
    packCode: 'pack500',
    monthlyCapCents: 50_000,
    spentThisPeriodCents: 0,
  });
  const toast = useToast();

  const refresh = (): void => {
    if (!current) return;
    setBalance(null);
    api
      .get<{ balance: number }>(`/v1/billing/tenant/${current.id}/balance`)
      .then((r) => setBalance(r.balance));
    api
      .get<{ config: AutoTopup | null }>(`/v1/billing/tenant/${current.id}/auto-topup`)
      .then((r) => {
        setConfig(r.config);
        if (r.config) setForm(r.config);
      });
    api
      .get<{ ledger: LedgerEntry[] }>(`/v1/credits/tenant/${current.id}/ledger`)
      .then((r) => setLedger(r.ledger))
      .catch(() => setLedger([]));
    api
      .get<{ invoices: Invoice[] }>(`/v1/billing/tenant/${current.id}/invoices`)
      .then((r) => setInvoices(r.invoices))
      .catch(() => setInvoices([]));
  };

  useEffect(refresh, [current]);

  if (!current) return <p className="text-[13px] text-[color:var(--ink-mute)]">No workspace.</p>;

  const submitTopup = async (): Promise<void> => {
    try {
      await api.put(`/v1/billing/tenant/${current.id}/auto-topup`, {
        enabled: form.enabled,
        thresholdCredits: form.thresholdCredits,
        packCode: form.packCode,
        monthlyCapCents: form.monthlyCapCents ?? undefined,
      });
      toast.push({ variant: 'success', title: 'Auto top-up updated' });
      setEditOpen(false);
      refresh();
    } catch (e) {
      toast.push({
        variant: 'error',
        title: 'Could not save',
        body: `Status ${(e as ApiError).status}`,
      });
    }
  };

  const cap = 500;
  const pct = balance == null ? 0 : Math.min(100, Math.max(0, (balance / cap) * 100));

  const burnPerWeek = ledger
    ? Math.abs(
        ledger
          .filter(
            (e) => e.delta < 0 && new Date(e.createdAt).getTime() > Date.now() - 7 * 86_400_000,
          )
          .reduce((a, e) => a + e.delta, 0),
      )
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Credits & billing</Eyebrow>
          <h1
            className="serif mt-1 text-[28px] tracking-tight"
            style={{ fontWeight: 500, letterSpacing: '-0.02em' }}
          >
            Spend, track, top up.
          </h1>
        </div>
      </header>

      {/* Hero balance card */}
      <Card
        className="r-credits-balance grid gap-7 p-7"
        style={{ gridTemplateColumns: '1.4fr 1fr' }}
      >
        <div>
          <Eyebrow>Balance</Eyebrow>
          {balance === null ? (
            <Skeleton width={140} height={64} className="mt-3" />
          ) : (
            <div
              className="mono mt-2 flex items-baseline gap-3"
              style={{ fontSize: 64, letterSpacing: '-0.03em', fontWeight: 500 }}
            >
              <span style={{ color: 'var(--signal)' }}>{balance}</span>
              <span style={{ fontSize: 16, color: 'var(--ink-faint)' }}>/ {cap} CR</span>
            </div>
          )}
          <ProgressBar value={pct} ariaLabel="Credit balance" className="mt-4" />
          <div className="mono mt-3 flex flex-wrap gap-5 text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
            <span>{current.displayName.toUpperCase()}</span>
            <span>·</span>
            <span>BURN ~{burnPerWeek} CR / 7 DAYS</span>
            <span>·</span>
            <span>RESETS MONTHLY</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Eyebrow>Auto top-up</Eyebrow>
          {config && config.enabled ? (
            <p className="text-[13px]" style={{ lineHeight: 1.6 }}>
              When balance falls below{' '}
              <span className="mono" style={{ color: 'var(--signal)' }}>
                {config.thresholdCredits}
              </span>
              , charge <span className="mono">{config.packCode}</span>. Cap{' '}
              <span className="mono">
                {config.monthlyCapCents ? formatMoney(config.monthlyCapCents) : 'no cap'}
              </span>{' '}
              per period.
            </p>
          ) : (
            <p className="text-[13px] text-[color:var(--ink-mute)]">
              Auto top-up is off. Configure to keep workflows uninterrupted.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setEditOpen(true)}>
              Configure
            </Button>
            {config && config.enabled && (
              <Tag tone="green" dot>
                ON
              </Tag>
            )}
          </div>
        </div>
      </Card>

      {/* Top-up packs */}
      <section>
        <Eyebrow>Top up now</Eyebrow>
        <div
          className="r-cards-4 mt-3 grid gap-4"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          {PACKS.map((p, i) => (
            <Card
              key={p.code}
              className={cn('flex flex-col gap-2 p-5', i === 1 && 'border-[color:var(--signal)]')}
              style={i === 1 ? { borderColor: 'var(--signal)' } : undefined}
            >
              <div className="flex items-center justify-between">
                <span className="text-[18px]" style={{ fontWeight: 500 }}>
                  {p.label} CR
                </span>
                {i === 1 && <Tag tone="signal">POPULAR</Tag>}
              </div>
              <div className="mono" style={{ fontSize: 28, color: 'var(--ink)', fontWeight: 500 }}>
                ${p.usd}
              </div>
              <div className="mono text-[11px] uppercase tracking-[0.10em] text-[color:var(--ink-faint)]">
                ${(p.usd / p.credits).toFixed(3)} / CR
              </div>
              <Button
                variant={i === 1 ? 'primary' : 'secondary'}
                size="sm"
                type="button"
                onClick={async () => {
                  try {
                    const r = await api.post<{ url: string }>(
                      `/v1/billing/tenant/${current.id}/topup/checkout`,
                      { packCode: p.code },
                    );
                    window.location.assign(r.url);
                  } catch {
                    toast.push({ variant: 'error', title: 'Checkout failed' });
                  }
                }}
              >
                <Icons.card /> Checkout
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Ledger */}
      <section>
        <Eyebrow>Recent ledger</Eyebrow>
        <Card className="mt-3 overflow-hidden">
          {ledger === null && (
            <div className="p-5">
              <Skeleton height={120} />
            </div>
          )}
          {ledger && ledger.length === 0 && (
            <p className="px-5 py-8 text-center text-[13px] text-[color:var(--ink-mute)]">
              No spend yet — your first synthesis run lands here.
            </p>
          )}
          {ledger && ledger.length > 0 && (
            <table className="cmp">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Reason</th>
                  <th className="text-right">Δ</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.slice(0, 20).map((e) => (
                  <tr key={e.id}>
                    <td className="mono text-[color:var(--ink-mute)]">
                      {formatDateTZ(e.createdAt, 'UTC')}
                    </td>
                    <td>{e.reason}</td>
                    <td
                      className="mono text-right"
                      style={{
                        color: e.delta < 0 ? 'var(--danger)' : 'var(--green)',
                      }}
                    >
                      {e.delta > 0 ? `+${e.delta}` : e.delta}
                    </td>
                    <td className="mono text-right">{e.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>

      {/* Invoices */}
      <section>
        <Eyebrow>Invoices</Eyebrow>
        <Card className="mt-3 overflow-hidden">
          {invoices === null && (
            <div className="p-5">
              <Skeleton height={80} />
            </div>
          )}
          {invoices && invoices.length === 0 && (
            <p className="px-5 py-6 text-center text-[13px] text-[color:var(--ink-mute)]">
              No invoices yet.
            </p>
          )}
          {invoices && invoices.length > 0 && (
            <ul className="divide-y divide-[color:var(--line)]">
              {invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[13px]"
                >
                  <div className="flex items-center gap-3">
                    <span className="mono text-[12px] text-[color:var(--ink-mute)]">
                      {formatDateTZ(inv.issuedAt, 'UTC')}
                    </span>
                    <span style={{ fontWeight: 500 }}>
                      {formatMoney(inv.amountCents, inv.currency)}
                    </span>
                    <Tag tone={inv.status === 'paid' ? 'green' : 'ochre'}>
                      {inv.status.toUpperCase()}
                    </Tag>
                  </div>
                  {inv.pdfS3Key && (
                    <a
                      href={`/api-proxy/${encodeURIComponent(inv.pdfS3Key)}`}
                      className="inline-flex"
                    >
                      <Button variant="ghost" size="sm" type="button">
                        <Icons.download /> PDF
                      </Button>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Auto top-up"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitTopup}>Save</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px]" style={{ fontWeight: 500 }}>
                Enable auto top-up
              </div>
              <div className="text-[12px] text-[color:var(--ink-mute)]">
                Charges a credit pack when balance dips below the threshold.
              </div>
            </div>
            <Toggle
              checked={form.enabled}
              ariaLabel="Enable auto top-up"
              onChange={(v) => setForm({ ...form, enabled: v })}
            />
          </div>
          <Field label="Trigger when balance falls below" htmlFor="t-th">
            <Input
              id="t-th"
              type="number"
              min={1}
              value={form.thresholdCredits}
              onChange={(e) => setForm({ ...form, thresholdCredits: Number(e.target.value) })}
            />
          </Field>
          <Field label="Pack to charge" htmlFor="t-pk">
            <select
              id="t-pk"
              className="select"
              value={form.packCode}
              onChange={(e) => setForm({ ...form, packCode: e.target.value })}
            >
              {PACKS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.label} credits — ${p.usd}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Monthly cap (USD cents)" htmlFor="t-cap" hint="Leave 0 for no cap.">
            <Input
              id="t-cap"
              type="number"
              min={0}
              value={form.monthlyCapCents ?? 0}
              onChange={(e) =>
                setForm({
                  ...form,
                  monthlyCapCents: Number(e.target.value) || null,
                })
              }
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
};
