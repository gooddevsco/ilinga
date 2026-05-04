/**
 * Sequential phase 04 — app shell.
 *
 * Mounts AppLayout with a stubbed auth + tenant context and asserts the
 * sidebar (Brand, WorkspacePill, NavList, CreditsBox), the topbar
 * (breadcrumb, page title, search hint), and the credits balance fetch.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { ToastProvider } from '@ilinga/ui';
import { AppLayout } from '../layouts/AppLayout';
import { AuthProvider } from '../lib/auth';
import { TenantProvider } from '../lib/tenant';
import * as apiModule from '../lib/api';

const stubApi = (overrides: Record<string, unknown> = {}): void => {
  const map: Record<string, unknown> = {
    '/v1/auth/me': { userId: 'user_abcd1234efgh', expiresAt: '2099-01-01' },
    '/v1/tenants': {
      tenants: [{ id: 't1', slug: 'northwind', displayName: 'Northwind Labs', role: 'owner' }],
    },
    '/v1/billing/tenant/t1/balance': { balance: 142 },
    ...overrides,
  };
  vi.spyOn(apiModule.api, 'get').mockImplementation(
    (path: string) => Promise.resolve(map[path] ?? {}) as Promise<never>,
  );
};

const renderShell = (path = '/dashboard'): ReturnType<typeof render> =>
  render(
    <ToastProvider>
      <AuthProvider>
        <TenantProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<div>dashboard body</div>} />
                <Route path="/ventures" element={<div>ventures body</div>} />
                <Route path="/workspaces/new" element={<div>workspace-new body</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </TenantProvider>
      </AuthProvider>
    </ToastProvider>,
  );

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(apiModule.api, 'post').mockResolvedValue({});
});

describe('phase 04 · app shell', () => {
  it('renders the sidebar with workspace + nav + credit balance', async () => {
    stubApi();
    renderShell('/dashboard');

    // Sidebar renders twice (desktop + mobile drawer); both should resolve.
    await waitFor(() => {
      expect(screen.getAllByText('Northwind Labs').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByText('OWNER').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /Dashboard/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /Ventures/i }).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole('link', { name: /Credits & billing/i }).length,
    ).toBeGreaterThanOrEqual(1);
    await waitFor(() => {
      expect(screen.getAllByText('142').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getAllByRole('button', { name: /Top up/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('topbar shows the breadcrumb + page title for the current route', async () => {
    stubApi();
    renderShell('/dashboard');
    await waitFor(() => expect(screen.getByText('Northwind Labs /')).toBeTruthy());
    // "Dashboard" appears in the topbar AND as the active nav link.
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Search modules, reports/)).toBeTruthy();
  });

  it('redirects users with no workspace to /workspaces/new', async () => {
    stubApi({ '/v1/tenants': { tenants: [] } });
    renderShell('/dashboard');
    await waitFor(() => {
      expect(screen.getByText('workspace-new body')).toBeTruthy();
    });
  });
});
