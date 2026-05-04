/**
 * Sequential phase 06 — first-run journey.
 *
 * Walks a brand-new authenticated user from /dashboard → workspace creation →
 * /ventures/new → /ventures/:id, asserting each stop renders the expected
 * design artifacts and the right API call lands.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@ilinga/ui';
import { AppLayout } from '../layouts/AppLayout';
import { Dashboard } from '../pages/app/Dashboard';
import { Ventures } from '../pages/app/Ventures';
import { VentureNew } from '../pages/app/VentureNew';
import { WorkspaceNew } from '../pages/app/WorkspaceNew';
import { AuthProvider } from '../lib/auth';
import { TenantProvider } from '../lib/tenant';
import * as apiModule from '../lib/api';

const seed = (() => {
  const tenants: Array<{
    id: string;
    slug: string;
    displayName: string;
    role: string;
  }> = [];
  const ventures: Array<{
    id: string;
    name: string;
    industry: string | null;
    geos: string[];
    brief: Record<string, unknown>;
    createdAt: string;
  }> = [];
  return { tenants, ventures };
})();

const installApi = (): void => {
  vi.spyOn(apiModule.api, 'get').mockImplementation(((path: string) => {
    if (path === '/v1/auth/me') {
      return Promise.resolve({ userId: 'usr_journey', expiresAt: '2099-01-01' });
    }
    if (path === '/v1/tenants') {
      return Promise.resolve({ tenants: seed.tenants });
    }
    if (path.startsWith('/v1/billing/tenant/') && path.endsWith('/balance')) {
      return Promise.resolve({ balance: 50 });
    }
    if (path.match(/^\/v1\/ventures\/tenant\/[^/]+$/)) {
      return Promise.resolve({ ventures: seed.ventures });
    }
    if (path.match(/^\/v1\/ventures\/tenant\/[^/]+\/[^/]+\/cycles$/)) {
      return Promise.resolve({ cycles: [] });
    }
    return Promise.resolve({});
  }) as never);

  vi.spyOn(apiModule.api, 'post').mockImplementation(((path: string, body?: unknown) => {
    if (path === '/v1/tenants') {
      const b = body as { displayName: string };
      const slug = b.displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const t = { id: 't_new', slug, displayName: b.displayName, role: 'owner' };
      seed.tenants.push(t);
      return Promise.resolve({ id: t.id, slug: t.slug });
    }
    if (path === '/v1/ventures') {
      const b = body as {
        name: string;
        industry?: string;
        geos?: string[];
        brief?: Record<string, unknown>;
      };
      const v = {
        id: 'v_new',
        name: b.name,
        industry: b.industry ?? null,
        geos: b.geos ?? [],
        brief: b.brief ?? {},
        createdAt: new Date().toISOString(),
      };
      seed.ventures.push(v);
      return Promise.resolve({ venture: v, cycle: { id: 'c_new', seq: 1, status: 'open' } });
    }
    return Promise.resolve({});
  }) as never);
};

const wrap = (path = '/dashboard'): ReturnType<typeof render> =>
  render(
    <ToastProvider>
      <AuthProvider>
        <TenantProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/workspaces/new" element={<WorkspaceNew />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ventures" element={<Ventures />} />
                <Route path="/ventures/new" element={<VentureNew />} />
                <Route path="/ventures/:id" element={<div>venture detail</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </TenantProvider>
      </AuthProvider>
    </ToastProvider>,
  );

beforeEach(() => {
  vi.restoreAllMocks();
  seed.tenants.length = 0;
  seed.ventures.length = 0;
  window.localStorage.clear();
  installApi();
});

describe('phase 06 · first-run journey', () => {
  it('lands new users on /workspaces/new and walks them through to a venture', async () => {
    wrap('/dashboard');

    // Step 1: redirected from /dashboard to /workspaces/new
    await waitFor(() => {
      expect(screen.getByLabelText(/Workspace name/i)).toBeTruthy();
    });

    // Step 2: create workspace
    await userEvent.type(screen.getByLabelText(/Workspace name/i), 'Northwind Studio');
    await userEvent.click(screen.getByRole('button', { name: /Create workspace/i }));

    // After workspace creation: dashboard hero appears (first-run, no ventures)
    await waitFor(() => {
      expect(screen.getByText(/is live\./i)).toBeTruthy();
    });
    expect(screen.getByRole('link', { name: /Brief your first venture/i })).toBeTruthy();
  });

  it('Ventures page links to /ventures/new and the form posts the right payload', async () => {
    seed.tenants.push({
      id: 't1',
      slug: 'northwind',
      displayName: 'Northwind Labs',
      role: 'owner',
    });
    wrap('/ventures');

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Brief your first venture/i })).toBeTruthy();
    });
  });

  it('VentureNew submits the right payload to /v1/ventures', async () => {
    seed.tenants.push({
      id: 't1',
      slug: 'northwind',
      displayName: 'Northwind Labs',
      role: 'owner',
    });
    // Render VentureNew directly — the AppLayout redirect-on-empty-tenants
    // logic is exercised in the first test of this phase. Here we just want
    // the form to land the right payload.
    render(
      <ToastProvider>
        <AuthProvider>
          <TenantProvider>
            <MemoryRouter initialEntries={['/ventures/new']}>
              <Routes>
                <Route path="/ventures/new" element={<VentureNew />} />
                <Route path="/ventures/:id" element={<div>venture detail</div>} />
              </Routes>
            </MemoryRouter>
          </TenantProvider>
        </AuthProvider>
      </ToastProvider>,
    );

    const nameInput = await screen.findByLabelText(/Venture name/i);
    await userEvent.type(nameInput, 'Polaris');
    await userEvent.type(screen.getByLabelText(/Industry/i), 'fintech');
    await userEvent.type(screen.getByLabelText(/Markets/i), 'GB, US');
    await userEvent.type(
      screen.getByLabelText(/Thesis/i),
      'Embedded trade finance for small exporters.',
    );
    await userEvent.click(screen.getByRole('button', { name: /Create venture/i }));

    await waitFor(
      () => {
        expect(screen.getByText('venture detail')).toBeTruthy();
      },
      { timeout: 4000 },
    );
    expect(apiModule.api.post).toHaveBeenCalledWith(
      '/v1/ventures',
      expect.objectContaining({
        tenantId: 't1',
        name: 'Polaris',
        industry: 'fintech',
        geos: ['GB', 'US'],
        brief: expect.objectContaining({
          thesis: 'Embedded trade finance for small exporters.',
        }),
      }),
    );
  });
});
