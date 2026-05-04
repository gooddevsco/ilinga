/**
 * Sequential phase 03 — auth shell.
 *
 * Verifies SignIn and SignUp render the new earth-palette layout, expose the
 * controls the magic-link flow needs, and surface friendly error states.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '@ilinga/ui';
import { SignIn } from '../pages/auth/SignIn';
import { SignUp } from '../pages/auth/SignUp';
import * as apiModule from '../lib/api';

const wrap = (ui: React.ReactNode) =>
  render(
    <ToastProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ToastProvider>,
  );

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('phase 03 · SignIn', () => {
  it('renders the welcome headline + magic-link mode by default', () => {
    wrap(<SignIn />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/Welcome back/);
    const magic = screen.getByRole('button', { name: /Magic link/i });
    expect(magic.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Email me a link/i })).toBeTruthy();
  });

  it('rejects an invalid email with the .shake error', () => {
    wrap(<SignIn />);
    const form = screen.getByRole('button', { name: /Email me a link/i }).closest('form')!;
    fireEvent.change(screen.getByLabelText(/Work email/i), {
      target: { value: 'not-an-email' },
    });
    fireEvent.submit(form);
    expect(form.classList.contains('shake')).toBe(true);
    expect(screen.getByText(/Use your work email/i)).toBeTruthy();
  });

  it('switches to the "sent" state after a valid magic-link request', async () => {
    const post = vi.spyOn(apiModule.api, 'post').mockResolvedValue({});
    wrap(<SignIn />);
    await userEvent.type(screen.getByLabelText(/Work email/i), 'ada@northwind.co');
    await userEvent.click(screen.getByRole('button', { name: /Email me a link/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(
        /Magic link on the way/,
      );
    });
    expect(post).toHaveBeenCalledWith('/v1/auth/magic-link/request', {
      email: 'ada@northwind.co',
      purpose: 'signin',
    });
  });
});

describe('phase 03 · SignUp', () => {
  it('renders the step indicator + role chips', () => {
    wrap(<SignUp />);
    expect(screen.getByText(/Step 1 \/ 3 · Account/i)).toBeTruthy();
    for (const role of ['Founder', 'Operator', 'Consultant', 'PM', 'Investor']) {
      expect(screen.getByRole('radio', { name: role })).toBeTruthy();
    }
  });

  it('blocks submission until the terms checkbox is ticked', async () => {
    const post = vi.spyOn(apiModule.api, 'post').mockResolvedValue({});
    wrap(<SignUp />);
    await userEvent.type(screen.getByLabelText(/Full name/i), 'Ada Okonkwo');
    await userEvent.type(screen.getByLabelText(/Work email/i), 'ada@northwind.co');
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));
    expect(post).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: /Create account/i }));
    expect(post).toHaveBeenCalledWith(
      '/v1/auth/magic-link/request',
      expect.objectContaining({ email: 'ada@northwind.co', purpose: 'signup' }),
    );
  });
});
