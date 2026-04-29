import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Modal,
  Skeleton,
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
  { code: 'pack100', label: '100 credits' },
  { code: 'pack500', label: '500 credits' },
  { code: 'pack2k', label: '2,000 credits' },
  { code: 'pack10k', label: '10,000 credits' },
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

  if (!current)
    return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace.</p>;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Credits</h1>
        <p className="text-sm text-[color:var(--color-fg-muted)]">
          Spend on synthesis pipelines and report renders. Plan allowance resets monthly; top-ups
          never expire.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>Balance</CardHeader>
          <CardBody>
            {balance === null ? (
              <Skeleton width={80} height={36} />
            ) : (
              <p className="text-3xl font-semibold">{balance}</p>
            )}
            <p className="mt-1 text-xs text-[color:var(--color-fg-subtle)]">
              {current.displayName}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Auto top-up</CardHeader>
          <CardBody>
            {config && config.enabled ? (
              <p className="text-sm">
                When balance falls below <strong>{config.thresholdCredits}</strong>, charge{' '}
                <strong>{config.packCode}</strong>. Cap{' '}
                {config.monthlyCapCents
                  ? formatMoney(config.monthlyCapCents)
                  : 'no cap'}{' '}
                per period.
              </p>
            ) : (
              <p className="text-sm text-[color:var(--color-fg-muted)]">Off</p>
            )}
            <Button className="mt-3" onClick={() => setEditOpen(true)}>
              Configure
            </Button>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Top up now</CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {PACKS.map((p) => (
                <Button
                  key={p.code}
                  size="sm"
                  variant="secondary"
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
                  {p.label}
                </Button>
              ))}
            </div>
          </CardBody>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Recent ledger</h2>
        <Card>
          <CardBody>
            {ledger === null && <Skeleton height={120} />}
            {ledger && ledger.length === 0 && (
              <p className="text-sm text-[color:var(--color-fg-muted)]">No spend yet.</p>
            )}
            {ledger && ledger.length > 0 && (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-[color:var(--color-fg-subtle)]">
                  <tr>
                    <th className="py-2">When</th>
                    <th className="py-2">Reason</th>
                    <th className="py-2 text-right">Δ</th>
                    <th className="py-2 text-right">Balance after</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--color-border)]">
                  {ledger.slice(0, 20).map((e) => (
                    <tr key={e.id}>
                      <td className="py-2 text-xs text-[color:var(--color-fg-muted)]">
                        {formatDateTZ(e.createdAt, 'UTC')}
                      </td>
                      <td className="py-2">{e.reason}</td>
                      <td
                        className={`py-2 text-right font-mono ${
                          e.delta < 0 ? 'text-[color:var(--color-danger)]' : 'text-[color:var(--color-success)]'
                        }`}
                      >
                        {e.delta > 0 ? `+${e.delta}` : e.delta}
                      </td>
                      <td className="py-2 text-right font-mono">{e.balanceAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Invoices</h2>
        <Card>
          <CardBody>
            {invoices === null && <Skeleton height={80} />}
            {invoices && invoices.length === 0 && (
              <p className="text-sm text-[color:var(--color-fg-muted)]">No invoices yet.</p>
            )}
            {invoices && invoices.length > 0 && (
              <ul className="space-y-1 text-sm">
                {invoices.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-border)] py-2 last:border-0"
                  >
                    <span>
                      {formatDateTZ(inv.issuedAt, 'UTC')} —{' '}
                      <strong>{formatMoney(inv.amountCents, inv.currency)}</strong>{' '}
                      <Badge tone={inv.status === 'paid' ? 'success' : 'warning'}>
                        {inv.status}
                      </Badge>
                    </span>
                    {inv.pdfS3Key && (
                      <a
                        className="underline"
                        href={`/api-proxy/${encodeURIComponent(inv.pdfS3Key)}`}
                      >
                        Download PDF
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
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
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Enable auto top-up
          </label>
          <Field label="Trigger when balance falls below" htmlFor="t-th">
            <Input
              id="t-th"
              type="number"
              min={1}
              value={form.thresholdCredits}
              onChange={(e) =>
                setForm({ ...form, thresholdCredits: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Pack to charge" htmlFor="t-pk">
            <select
              id="t-pk"
              value={form.packCode}
              onChange={(e) => setForm({ ...form, packCode: e.target.value })}
              className="block h-10 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 text-sm"
            >
              {PACKS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.label}
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
