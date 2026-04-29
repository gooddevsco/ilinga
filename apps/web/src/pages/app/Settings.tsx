import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
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
import { useAuth } from '../../lib/auth';
import { useTenant } from '../../lib/tenant';
import { formatDateTZ } from '../../lib/format';

const tabs = [
  { to: '/settings/profile', label: 'Profile' },
  { to: '/settings/team', label: 'Team' },
  { to: '/settings/billing', label: 'Billing' },
  { to: '/settings/ai', label: 'AI endpoints' },
  { to: '/settings/webhooks', label: 'Webhooks' },
  { to: '/settings/api-tokens', label: 'API tokens' },
  { to: '/settings/security', label: 'Security' },
  { to: '/settings/privacy', label: 'Privacy' },
];

export const SettingsLayout = (): JSX.Element => (
  <div className="space-y-6">
    <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
    <div className="-mx-4 overflow-x-auto md:mx-0">
      <div className="flex gap-6 border-b border-[color:var(--color-border)] px-4 text-sm md:px-0">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 pb-3 ${isActive ? 'border-[color:var(--color-fg)]' : 'border-transparent text-[color:var(--color-fg-muted)]'}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </div>
    <Outlet />
  </div>
);

export const SettingsProfile = (): JSX.Element => {
  const { user, signOut } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [emailChangeOpen, setEmailChangeOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [submittingChange, setSubmittingChange] = useState(false);
  const toast = useToast();

  if (!user) return <Skeleton height={80} />;

  const requestEmailChange = async (): Promise<void> => {
    setSubmittingChange(true);
    try {
      await api.post('/v1/auth/magic-link/request', {
        email: newEmail,
        purpose: 'email_change_verify',
      });
      toast.push({
        variant: 'success',
        title: 'Confirmation sent',
        body: 'Click the link in the email we just sent to your new address.',
      });
      setEmailChangeOpen(false);
    } catch {
      toast.push({ variant: 'error', title: 'Could not send confirmation' });
    } finally {
      setSubmittingChange(false);
    }
  };

  return (
    <section className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>Profile</CardHeader>
        <CardBody>
          <p className="text-sm text-[color:var(--color-fg-muted)]">
            User id: <code>{user.userId}</code>
          </p>
          <Button className="mt-3" variant="secondary" onClick={() => setEmailChangeOpen(true)}>
            Change email
          </Button>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>Sessions</CardHeader>
        <CardBody>
          <Button onClick={() => void signOut()}>Sign out everywhere</Button>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <span className="text-[color:var(--color-danger)]">Delete account</span>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-[color:var(--color-fg-muted)]">
            Deleting your account does not delete tenants you own. Transfer ownership first to avoid
            workspaces being orphaned.
          </p>
          <Button variant="danger" className="mt-3" onClick={() => setConfirmDelete(true)}>
            Delete my account
          </Button>
        </CardBody>
      </Card>
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete account"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                toast.push({
                  variant: 'info',
                  title: 'Self-delete request received',
                  body: 'You will receive a confirmation email; the account is removed after 7 days.',
                });
                setConfirmDelete(false);
              }}
            >
              Confirm delete
            </Button>
          </>
        }
      >
        <p>
          This is a soft-delete — your data is hard-removed after 7 days. Until then you can sign back
          in to cancel.
        </p>
      </Modal>
      <Modal
        open={emailChangeOpen}
        onClose={() => setEmailChangeOpen(false)}
        title="Change email"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEmailChangeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={requestEmailChange} loading={submittingChange}>
              Send confirmation
            </Button>
          </>
        }
      >
        <Field label="New email" htmlFor="new-email">
          <Input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="alice@new.example"
          />
        </Field>
      </Modal>
    </section>
  );
};

interface Member {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  suspendedAt: string | null;
  createdAt: string;
}

export const SettingsTeam = (): JSX.Element => {
  const { current } = useTenant();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Member['role']>('editor');
  const [transferOpen, setTransferOpen] = useState<Member | null>(null);
  const toast = useToast();

  const refresh = (): void => {
    if (!current) return;
    api
      .get<{ members: Member[] }>(`/v1/tenants/${current.id}/members`)
      .then((r) => setMembers(r.members))
      .catch((e: ApiError) => setError(`Status ${e.status}`));
  };

  useEffect(refresh, [current]);

  if (!current) return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace.</p>;

  const sendInvite = async (): Promise<void> => {
    try {
      await api.post('/v1/auth/magic-link/request', {
        email: inviteEmail,
        purpose: 'tenant_invite',
        metadata: { tenantId: current.id, role: inviteRole },
      });
      toast.push({ variant: 'success', title: 'Invite sent' });
      setInviteOpen(false);
      setInviteEmail('');
    } catch {
      toast.push({ variant: 'error', title: 'Invite failed' });
    }
  };

  const setRole = async (m: Member, role: Member['role']): Promise<void> => {
    try {
      await api.patch(`/v1/tenants/${current.id}/members/${m.userId}/role`, { role });
      toast.push({ variant: 'success', title: 'Role updated' });
      refresh();
    } catch (e) {
      toast.push({
        variant: 'error',
        title: 'Could not update role',
        body: ((e as ApiError).body as { detail?: string })?.detail ?? `Status ${(e as ApiError).status}`,
      });
    }
  };

  const remove = async (m: Member): Promise<void> => {
    if (!window.confirm(`Remove ${m.email}?`)) return;
    try {
      await api.delete(`/v1/tenants/${current.id}/members/${m.userId}`);
      refresh();
    } catch (e) {
      toast.push({
        variant: 'error',
        title: 'Cannot remove',
        body: ((e as ApiError).body as { detail?: string })?.detail ?? '',
      });
    }
  };

  const transfer = async (toUserId: string): Promise<void> => {
    try {
      await api.post(`/v1/tenants/${current.id}/ownership/transfer`, { toUserId });
      toast.push({ variant: 'success', title: 'Ownership transferred' });
      setTransferOpen(null);
      refresh();
    } catch {
      toast.push({ variant: 'error', title: 'Transfer failed' });
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team</h2>
        <Button onClick={() => setInviteOpen(true)}>Invite teammate</Button>
      </header>
      {error && <p className="text-sm text-[color:var(--color-danger)]">{error}</p>}
      {!members && !error && <Skeleton height={120} />}
      {members && members.length === 0 && (
        <p className="text-sm text-[color:var(--color-fg-muted)]">Just you so far.</p>
      )}
      {members && members.length > 0 && (
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[color:var(--color-border)] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{m.displayName ?? m.email}</p>
                <p className="text-xs text-[color:var(--color-fg-muted)]">
                  {m.email} · joined {formatDateTZ(m.createdAt, 'UTC')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={m.role === 'owner' ? 'success' : 'info'}>{m.role}</Badge>
                {m.suspendedAt && <Badge tone="warning">suspended</Badge>}
                <select
                  value={m.role}
                  onChange={(e) => setRole(m, e.target.value as Member['role'])}
                  className="h-8 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 text-sm"
                  aria-label="Role"
                >
                  <option value="owner">owner</option>
                  <option value="admin">admin</option>
                  <option value="editor">editor</option>
                  <option value="viewer">viewer</option>
                </select>
                {m.role !== 'owner' && (
                  <Button size="sm" variant="secondary" onClick={() => setTransferOpen(m)}>
                    Transfer ownership
                  </Button>
                )}
                <Button size="sm" variant="danger" onClick={() => remove(m)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite teammate"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendInvite}>Send invite</Button>
          </>
        }
      >
        <Field label="Email" htmlFor="invite-email">
          <Input
            id="invite-email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
        </Field>
        <Field label="Role" htmlFor="invite-role">
          <select
            id="invite-role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Member['role'])}
            className="block h-10 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 text-sm"
          >
            <option value="admin">admin</option>
            <option value="editor">editor</option>
            <option value="viewer">viewer</option>
          </select>
        </Field>
      </Modal>

      <Modal
        open={transferOpen !== null}
        onClose={() => setTransferOpen(null)}
        title="Transfer ownership"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTransferOpen(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => transferOpen && transfer(transferOpen.userId)}
            >
              Confirm transfer
            </Button>
          </>
        }
      >
        <p className="text-sm">
          You will become an admin. {transferOpen?.email ?? ''} becomes the new owner. This cannot be
          undone without their consent.
        </p>
      </Modal>
    </section>
  );
};

export const SettingsBilling = (): JSX.Element => {
  const { current } = useTenant();
  const [balance, setBalance] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!current) return;
    api
      .get<{ balance: number }>(`/v1/billing/tenant/${current.id}/balance`)
      .then((r) => setBalance(r.balance))
      .catch(() => undefined);
  }, [current]);

  if (!current) return <p className="text-sm text-[color:var(--color-fg-muted)]">No workspace.</p>;

  const startCheckout = async (planCode: string): Promise<void> => {
    try {
      const r = await api.post<{ url: string }>(
        `/v1/billing/tenant/${current.id}/subscribe/checkout`,
        { planCode },
      );
      window.location.assign(r.url);
    } catch {
      toast.push({ variant: 'error', title: 'Checkout failed' });
    }
  };

  const startTopUp = async (packCode: string): Promise<void> => {
    try {
      const r = await api.post<{ url: string }>(
        `/v1/billing/tenant/${current.id}/topup/checkout`,
        { packCode },
      );
      window.location.assign(r.url);
    } catch {
      toast.push({ variant: 'error', title: 'Checkout failed' });
    }
  };

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>Current plan</CardHeader>
        <CardBody>
          <p className="text-sm">Workspace: {current.displayName}</p>
          <p className="text-sm text-[color:var(--color-fg-muted)]">
            Credit balance: <strong>{balance ?? '…'}</strong>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['studio', 'pro', 'firm'].map((c) => (
              <Button key={c} variant="secondary" onClick={() => startCheckout(c)}>
                Move to {c}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>Top up credits</CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {[
              ['pack100', '100 credits — $19'],
              ['pack500', '500 credits — $79'],
              ['pack2k', '2,000 credits — $269'],
              ['pack10k', '10,000 credits — $1,099'],
            ].map(([code, label]) => (
              <Button key={code} variant="secondary" onClick={() => startTopUp(code as string)}>
                {label}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>
    </section>
  );
};

// AI / Security / Privacy land in Wave 6+ as full pages; export placeholders
// here so the router never has a broken import.

export { SettingsAi } from './settings/Ai';
export { SettingsSecurity } from './settings/Security';
export { SettingsPrivacy } from './settings/Privacy';
