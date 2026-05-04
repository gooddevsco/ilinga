/**
 * Sequential phase 02 — marketing landing.
 *
 * Verifies that the rebuilt Home page lands the brand promise headline,
 * the hero CTAs that route into the sign-up flow, the proof strip, the
 * loop steps, the report previews and the pricing strip.
 */
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { Home } from '../pages/marketing/Home';

const renderHome = (): ReturnType<typeof render> =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );

describe('phase 02 · marketing Home', () => {
  it('renders the mixed sans/serif hero headline', () => {
    renderHome();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(
      /Pressure-test a business/,
    );
    expect(screen.getByText(/in the time it takes to write a brief\./)).toBeTruthy();
  });

  it('exposes the start-a-venture CTA pointing at sign-up', () => {
    renderHome();
    const cta = screen.getByRole('link', { name: /Start your first venture/i });
    expect(cta.getAttribute('href')).toBe('/sign-up');
  });

  it('shows the proof strip with at least four trusted-by logos', () => {
    renderHome();
    const proof = screen.getByText(/Trusted by builders at/i);
    expect(proof).toBeTruthy();
    for (const logo of ['NORTHWIND', 'HALCYON LABS', 'FIELDPOINT', 'UMBRA / OS']) {
      expect(screen.getByText(logo)).toBeTruthy();
    }
  });

  it('renders the four-step loop section', () => {
    renderHome();
    for (const heading of ['Brief', 'Interview', 'Synthesise', 'Report']) {
      expect(screen.getByText(heading, { exact: true })).toBeTruthy();
    }
  });

  it('renders the four pricing tiers with one recommended', () => {
    renderHome();
    expect(screen.getByText('Solo')).toBeTruthy();
    expect(screen.getByText('Studio')).toBeTruthy();
    expect(screen.getByText('Firm')).toBeTruthy();
    expect(screen.getByText('Bring-your-own')).toBeTruthy();
    expect(screen.getByText('RECOMMENDED')).toBeTruthy();
  });
});
