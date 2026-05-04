/**
 * Sequential phase 01 — design system smoke.
 *
 * If this file fails, every later page test will also fail because they all
 * depend on the earth-palette tokens and utility classes shipped from
 * packages/ui/src/styles.css. Keep this test cheap and stable.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Button, Card, Eyebrow, IconLogo, Icons, Kbd, ProgressBar, Tag } from '@ilinga/ui';

describe('phase 01 · design system', () => {
  it('exports the earth-palette primitives the rest of the app relies on', () => {
    // The import alone covers the public surface; render to make sure each
    // mounts without throwing.
    const { container } = render(
      <div>
        <Eyebrow>section · 01</Eyebrow>
        <Tag tone="signal" dot>
          live
        </Tag>
        <Kbd>⌘K</Kbd>
        <ProgressBar value={42} ariaLabel="x" />
        <Card>card</Card>
        <Button variant="signal" size="lg">
          continue
        </Button>
        <IconLogo />
        <Icons.arrow />
      </div>,
    );
    expect(container.querySelector('.eyebrow')).toBeTruthy();
    expect(container.querySelector('.tag.signal')).toBeTruthy();
    expect(container.querySelector('.tag.signal .dot')).toBeTruthy();
    expect(container.querySelector('.kbd')).toBeTruthy();
    expect(container.querySelector('.bar > i')).toBeTruthy();
    expect(container.querySelector('.card')).toBeTruthy();
    expect(container.querySelector('.btn.signal.lg')).toBeTruthy();
    expect(container.querySelectorAll('svg').length).toBeGreaterThanOrEqual(2);
  });
});
