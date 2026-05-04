/**
 * Sequential phase 05 — workspace creation + dashboard.
 *
 * Renders WorkspaceNew in isolation and asserts the URL slug derives live
 * from the workspace-name input, then asserts Dashboard renders the
 * first-run hero when no ventures exist (and the active-venture hero when
 * one does).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@ilinga/ui';
import { WorkspaceNew } from '../pages/app/WorkspaceNew';
import { Dashboard } from '../pages/app/Dashboard';
import { TenantProvider } from '../lib/tenant';
import { AuthProvider } from '../lib/auth';
import * as apiModule from '../lib/api';

const tenants = [
  { id: 't1', slug: 'northwind-labs', displayName: 'Northwind Labs', role: 'owner' },
];

const stubGet = (extra: Record<string, unknown> = {}): void => {
  const map: Record<string, unknown> = {
    '/v1/auth/me': { userId: 'user1', expiresAt: '2099-01-01' },
    '/v1/tenants': { tenants },
    '/v1/billing/tenant/t1/balance': { balance: 50 },
    ...extra,
  };
  vi.spyOn(apiModule.api, 'get').mockImplementation((path: string) =>
    Promise.resolve(map[path] ?? {}),
  );
};

const wrap = (ui: React.ReactNode): ReturnType<typeof render> =>
  render(
    <ToastProvider>
      <AuthProvider>
        <TenantProvider>
          <MemoryRouter>{ui}</MemoryRouter>
        </TenantProvider>
      </AuthProvider>
    </ToastProvider>,
  );

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('phase 05 · WorkspaceNew', () => {
  it('derives the URL slug live from the workspace name', async () => {
    stubGet({ '/v1/tenants': { tenants } });
    wrap(<WorkspaceNew />);
    const name = screen.getByLabelText(/Workspace name/i);
    await userEvent.type(name, 'Northwind Capital');
    const slug = screen.getByLabelText(/Workspace slug/i) as HTMLInputElement;
    expect(slug.value).toBe('northwind-capital');
  });

  it('posts to /v1/tenants and switches the workspace on submit', async () => {
    stubGet({ '/v1/tenants': { tenants: [] } });
    const post = vi.spyOn(apiModule.api, 'post').mockResolvedValue({ id: 't9', slug: 'newco' });
    wrap(<WorkspaceNew />);
    await userEvent.type(screen.getByLabelText(/Workspace name/i), 'Newco Studio');
    await userEvent.click(screen.getByRole('button', { name: /Create workspace/i }));
    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/v1/tenants', {
        displayName: 'Newco Studio',
      });
    });
  });
});

describe('phase 05 · Dashboard', () => {
  it('renders the first-run hero when the workspace has no ventures', async () => {
    stubGet({
      '/v1/ventures/tenant/t1': { ventures: [] },
    });
    wrap(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/is live\./i)).toBeTruthy();
    });
    expect(screen.getByRole('link', { name: /Brief your first venture/i })).toBeTruthy();
  });

  it('renders the active-venture hero when a venture exists', async () => {
    stubGet({
      '/v1/ventures/tenant/t1': {
        ventures: [
          {
            id: 'v1',
            name: 'Northwind Cargo',
            industry: 'Logistics SaaS',
            geos: ['gb', 'us'],
            brief: { thesis: 'Dispatch + compliance for owner-operators.' },
          },
        ],
      },
      '/v1/ventures/tenant/t1/v1/cycles': {
        cycles: [{ id: 'c1', seq: 1, status: 'open' }],
      },
    });
    wrap(<Dashboard />);
    // Cycle is fetched in a follow-up effect after ventures resolves; wait for
    // the cycle-aware Resume link rather than just the name appearing.
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Resume interview/i }).getAttribute('href')).toBe(
        '/ventures/v1/cycles/c1/interview',
      );
    });
    expect(screen.getAllByText('Northwind Cargo').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Dispatch \+ compliance/)).toBeTruthy();
  });
});
