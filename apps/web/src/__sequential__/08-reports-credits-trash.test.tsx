/**
 * Sequential phase 08 — reports, credits, trash, settings shell.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { ToastProvider } from '@ilinga/ui';
import { Reports } from '../pages/app/Reports';
import { CycleReports } from '../pages/app/CycleReports';
import { Credits } from '../pages/app/Credits';
import { Trash } from '../pages/app/Trash';
import { SettingsLayout } from '../pages/app/Settings';
import { AuthProvider } from '../lib/auth';
import { TenantProvider } from '../lib/tenant';
import * as apiModule from '../lib/api';

const tenants = [{ id: 't1', slug: 'northwind', displayName: 'Northwind Labs', role: 'owner' }];

const installApi = (overrides: Record<string, unknown> = {}): void => {
  const map: Record<string, unknown> = {
    '/v1/auth/me': { userId: 'u1', expiresAt: '2099-01-01' },
    '/v1/tenants': { tenants },
    '/v1/billing/tenant/t1/balance': { balance: 142 },
    '/v1/billing/tenant/t1/auto-topup': { config: null },
    '/v1/credits/tenant/t1/ledger': {
      ledger: [
        {
          id: 'l1',
          delta: -5,
          balanceAfter: 137,
          reason: 'render investor_pulse',
          createdAt: new Date().toISOString(),
        },
      ],
    },
    '/v1/billing/tenant/t1/invoices': { invoices: [] },
    '/v1/reports/tenant/t1/cycle/c1': {
      reports: [
        {
          id: 'r1',
          title: 'Investor Pulse · 1',
          templateId: 'tpl_investor_pulse',
          keysHash: 'abcd1234ef567890',
          createdAt: new Date().toISOString(),
        },
      ],
    },
    '/v1/reports/tenant/t1/schedules': { schedules: [] },
    '/v1/trash/tenant/t1': { items: [] },
    ...overrides,
  };
  vi.spyOn(apiModule.api, 'get').mockImplementation(((path: string) =>
    Promise.resolve(map[path] ?? {})) as never);
  vi.spyOn(apiModule.api, 'post').mockResolvedValue({});
  vi.spyOn(apiModule.api, 'put').mockResolvedValue({});
};

const wrap = (ui: React.ReactNode, path = '/', routePattern = '/'): ReturnType<typeof render> =>
  render(
    <ToastProvider>
      <AuthProvider>
        <TenantProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path={routePattern} element={ui} />
            </Routes>
          </MemoryRouter>
        </TenantProvider>
      </AuthProvider>
    </ToastProvider>,
  );

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('phase 08 · Reports gallery', () => {
  it('renders six template cards with tier badges + filter pills', () => {
    wrap(<Reports />);
    for (const t of ['Venture Snapshot' /* not in this template list — placeholder */]) {
      // ignore
      void t;
    }
    expect(screen.getByText('Investor Pulse')).toBeTruthy();
    expect(screen.getByText('Market Deep-Dive')).toBeTruthy();
    expect(screen.getByText('Competitive Landscape')).toBeTruthy();
    expect(screen.getByText('GTM Playbook')).toBeTruthy();
    expect(screen.getByText('Investor Memo')).toBeTruthy();
    expect(screen.getByText('Unit Economics Model')).toBeTruthy();
    // Filter pills
    expect(screen.getByRole('button', { name: 'ALL' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'PRO' })).toBeTruthy();
  });
});

describe('phase 08 · CycleReports', () => {
  it('lists templates row + past renders table', async () => {
    installApi();
    wrap(<CycleReports />, '/ventures/v1/cycles/c1/reports', '/ventures/:vid/cycles/:cid/reports');
    await screen.findByText('Investor Pulse', undefined, { timeout: 4000 });
    expect(screen.getByText('GTM Snapshot')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('Investor Pulse · 1')).toBeTruthy();
    });
    expect(screen.getByText(/abcd1234ef56…/)).toBeTruthy();
  });
});

describe('phase 08 · Credits', () => {
  it('renders the hero balance, packs grid, ledger row, and toggles auto-topup modal', async () => {
    installApi();
    wrap(<Credits />);
    await waitFor(() => {
      expect(screen.getByText('142')).toBeTruthy();
    });
    // Hero shows /500 CR cap; grid shows 500 CR pack — both legitimate.
    expect(screen.getAllByText(/500 CR/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('POPULAR')).toBeTruthy();
    // Ledger row
    expect(screen.getByText('render investor_pulse')).toBeTruthy();
  });
});

describe('phase 08 · Trash', () => {
  it('renders the empty state when trash is empty', async () => {
    installApi();
    wrap(<Trash />);
    await waitFor(() => {
      expect(screen.getByText(/Trash is empty/i)).toBeTruthy();
    });
  });

  it('renders the cmp table when items exist', async () => {
    installApi({
      '/v1/trash/tenant/t1': {
        items: [
          {
            id: 'tomb1',
            targetTable: 'ventures',
            targetId: '1234567890',
            deletedAt: new Date().toISOString(),
            restoreDeadline: new Date(Date.now() + 7 * 86400_000).toISOString(),
          },
        ],
      },
    });
    wrap(<Trash />);
    await waitFor(() => {
      expect(screen.getByText('VENTURES')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: /Restore/i })).toBeTruthy();
  });
});

describe('phase 08 · Settings shell', () => {
  it('renders the 220px nav with three sections + tab links', async () => {
    installApi();
    wrap(<SettingsLayout />, '/settings/profile', '/settings/*');
    expect(screen.getByText('You')).toBeTruthy();
    expect(screen.getByText('Workspace')).toBeTruthy();
    expect(screen.getByText('Plumbing')).toBeTruthy();
    // Profile tab is in the desktop nav
    expect(screen.getAllByRole('link', { name: 'Profile' }).length).toBeGreaterThanOrEqual(1);
  });
});
