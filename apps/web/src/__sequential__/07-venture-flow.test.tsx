/**
 * Sequential phase 07 — venture flow.
 *
 * Renders VentureDetail, Interview, Synthesis, and ContentKeys (Outputs)
 * with stubbed APIs and asserts the design idioms (eyebrows, cluster row,
 * cmp table, agent rail, pipeline strip) plus the critical user actions.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@ilinga/ui';
import { VentureDetail } from '../pages/app/VentureDetail';
import { Interview } from '../pages/app/Interview';
import { Synthesis } from '../pages/app/Synthesis';
import { ContentKeys } from '../pages/app/ContentKeys';
import { AuthProvider } from '../lib/auth';
import { TenantProvider } from '../lib/tenant';
import * as apiModule from '../lib/api';

const tenants = [{ id: 't1', slug: 'northwind', displayName: 'Northwind Labs', role: 'owner' }];

const installApi = (overrides: Record<string, unknown> = {}): void => {
  const map: Record<string, unknown> = {
    '/v1/auth/me': { userId: 'u1', expiresAt: '2099-01-01' },
    '/v1/tenants': { tenants },
    '/v1/billing/tenant/t1/balance': { balance: 142 },
    '/v1/ventures/tenant/t1/v1': {
      venture: {
        id: 'v1',
        name: 'Polaris',
        industry: 'fintech',
        geos: ['gb', 'us'],
        brief: { thesis: 'Embedded trade finance.', scope: 'multi' },
        createdAt: new Date().toISOString(),
      },
    },
    '/v1/ventures/tenant/t1/v1/cycles': {
      cycles: [
        { id: 'c1', seq: 1, status: 'open' },
        { id: 'c0', seq: 0, status: 'closed' },
      ],
    },
    '/v1/cycles/c1/answers': { answers: [] },
    '/v1/cycles/c1/questions': { questions: [] },
    '/v1/content-keys/tenant/t1/cycle/c1': {
      keys: [
        {
          id: 'k1',
          code: 'narrative.summary',
          version: 1,
          value: { text: 'Initial executive narrative.' },
          source: 'agent',
          confidence: 78,
        },
        {
          id: 'k2',
          code: 'risk.top',
          version: 1,
          value: 'Adoption risk in pre-seed cohort.',
          source: 'manual',
          confidence: null,
        },
      ],
    },
    ...overrides,
  };
  vi.spyOn(apiModule.api, 'get').mockImplementation(((path: string) =>
    Promise.resolve(map[path] ?? {})) as never);
  vi.spyOn(apiModule.api, 'post').mockResolvedValue({});
  vi.spyOn(apiModule.api, 'patch').mockResolvedValue({});
};

const wrap = (
  ui: React.ReactNode,
  initialPath: string,
  routePattern: string,
): ReturnType<typeof render> =>
  render(
    <ToastProvider>
      <AuthProvider>
        <TenantProvider>
          <MemoryRouter initialEntries={[initialPath]}>
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

describe('phase 07 · VentureDetail', () => {
  it('renders the brief-locked card + cycles table with tonal status tags', async () => {
    installApi();
    wrap(<VentureDetail />, '/ventures/v1', '/ventures/:id');

    await waitFor(() => {
      expect(screen.getAllByText('Polaris').length).toBeGreaterThanOrEqual(1);
    });
    // Brief eyebrow (locked label).
    expect(screen.getByText(/Brief · locked/i)).toBeTruthy();
    // Cycles table contains both rows + status tags.
    expect(screen.getByText(/CYCLE V1/i)).toBeTruthy();
    expect(screen.getByText(/CYCLE V0/i)).toBeTruthy();
    expect(screen.getByText('OPEN')).toBeTruthy();
    expect(screen.getByText('CLOSED')).toBeTruthy();
  });
});

describe('phase 07 · Interview', () => {
  it('renders the 3-column shell with progress map + agent rail', async () => {
    installApi();
    wrap(<Interview />, '/ventures/v1/cycles/c1/interview', '/ventures/:vid/cycles/:cid/interview');

    // Wait for tenant context + interview shell to mount.
    await screen.findByText(/PROGRESS MAP/i, undefined, { timeout: 4000 });
    expect(screen.getAllByText(/Problem/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Market/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/AGENT · LISTENING/i)).toBeTruthy();
    expect(screen.getByText(/Estimated cost if rendered now/i)).toBeTruthy();
  });
});

describe('phase 07 · Synthesis', () => {
  it('renders the pipeline strip + brief textarea + run button', async () => {
    installApi();
    wrap(<Synthesis />, '/ventures/v1/cycles/c1/synthesis', '/ventures/:vid/cycles/:cid/synthesis');

    await screen.findByText(/Synthesis pipeline/i, undefined, { timeout: 4000 });
    for (const stage of ['Parse', 'Cluster', 'Fan out', 'Synthesise', 'Reduce', 'Commit']) {
      expect(screen.getByText(stage)).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: /Run synthesis/i })).toBeTruthy();
  });
});

describe('phase 07 · ContentKeys', () => {
  it('renders the modules rail and shows the active key body', async () => {
    installApi();
    wrap(<ContentKeys />, '/ventures/v1/cycles/c1/keys', '/ventures/:vid/cycles/:cid/keys');

    await waitFor(() => {
      expect(screen.getAllByText('narrative.summary').length).toBeGreaterThanOrEqual(1);
    });
    // Sources tagged correctly
    expect(screen.getByText(/AGENT · V1/i)).toBeTruthy();
    expect(screen.getByText(/CONF 78%/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Save manual override/i })).toBeTruthy();
  });

  it('selecting a different key swaps the body', async () => {
    installApi();
    wrap(<ContentKeys />, '/ventures/v1/cycles/c1/keys', '/ventures/:vid/cycles/:cid/keys');

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /risk\.top/ }).length).toBeGreaterThanOrEqual(1);
    });
    await userEvent.click(screen.getAllByRole('button', { name: /risk\.top/ })[0]!);
    expect(screen.getAllByText('risk.top').length).toBeGreaterThanOrEqual(1);
  });
});
