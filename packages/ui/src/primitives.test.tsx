import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Eyebrow } from './Eyebrow.js';
import { Kbd } from './Kbd.js';
import { Tag } from './Tag.js';
import { ProgressBar } from './ProgressBar.js';
import { Toggle } from './Toggle.js';
import { OtpInput } from './OtpInput.js';
import { IconLogo, Icons } from './Icon.js';

afterEach(() => cleanup());

describe('Eyebrow', () => {
  it('renders an .eyebrow span', () => {
    render(<Eyebrow>Cluster · 03</Eyebrow>);
    const el = screen.getByText('Cluster · 03');
    expect(el.tagName).toBe('SPAN');
    expect(el.classList.contains('eyebrow')).toBe(true);
  });
});

describe('Kbd', () => {
  it('renders a <kbd> element with the .kbd class', () => {
    render(<Kbd>⌘K</Kbd>);
    const el = screen.getByText('⌘K');
    expect(el.tagName).toBe('KBD');
    expect(el.classList.contains('kbd')).toBe(true);
  });
});

describe('Tag', () => {
  it('default tone is neutral (no tonal class)', () => {
    render(<Tag>NEUTRAL</Tag>);
    const el = screen.getByText('NEUTRAL');
    expect(el.classList.contains('tag')).toBe(true);
    for (const tone of ['signal', 'ochre', 'indigo', 'green', 'danger']) {
      expect(el.classList.contains(tone)).toBe(false);
    }
  });

  it.each(['signal', 'ochre', 'indigo', 'green', 'danger'] as const)(
    'tone=%s adds the matching tonal class',
    (tone) => {
      render(<Tag tone={tone}>{tone}</Tag>);
      expect(screen.getByText(tone).classList.contains(tone)).toBe(true);
    },
  );

  it('renders a leading dot when dot is set', () => {
    render(<Tag dot>LIVE</Tag>);
    const el = screen.getByText('LIVE');
    expect(el.querySelector('.dot')).toBeTruthy();
  });
});

describe('ProgressBar', () => {
  it('clamps the bar between 0 and 100 percent', () => {
    const { rerender, container } = render(<ProgressBar value={140} />);
    let inner = container.querySelector('.bar > i') as HTMLElement;
    expect(inner.style.width).toBe('100%');
    rerender(<ProgressBar value={-5} />);
    inner = container.querySelector('.bar > i') as HTMLElement;
    expect(inner.style.width).toBe('0%');
  });

  it('exposes the rounded value via aria-valuenow', () => {
    const { container } = render(<ProgressBar value={42.6} ariaLabel="Cluster" />);
    const root = container.querySelector('[role="progressbar"]')!;
    expect(root.getAttribute('aria-valuenow')).toBe('43');
    expect(root.getAttribute('aria-label')).toBe('Cluster');
  });
});

describe('Toggle', () => {
  it('mirrors checked into aria-checked and toggles on click', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Toggle checked={false} onChange={onChange} ariaLabel="Notifications" />,
    );
    const btn = screen.getByRole('switch', { name: 'Notifications' });
    expect(btn.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(btn);
    expect(onChange).toHaveBeenCalledWith(true);
    rerender(<Toggle checked={true} onChange={onChange} ariaLabel="Notifications" />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });
});

describe('OtpInput', () => {
  const setup = (initial = '') => {
    const onChange = vi.fn();
    const onComplete = vi.fn();
    const utils = render(<OtpInput value={initial} onChange={onChange} onComplete={onComplete} />);
    return { onChange, onComplete, ...utils };
  };

  it('renders a cell per length', () => {
    const { container } = setup();
    expect(container.querySelectorAll('.otp-cell').length).toBe(6);
  });

  const otpCells = (container: HTMLElement): HTMLInputElement[] =>
    Array.from(container.querySelectorAll<HTMLInputElement>('input.otp-cell'));

  it('typing a digit advances focus and reports the new value', () => {
    const { onChange, container } = setup();
    const cells = otpCells(container);
    fireEvent.change(cells[0]!, { target: { value: '1' } });
    expect(onChange).toHaveBeenCalledWith('1');
    expect(document.activeElement).toBe(cells[1]);
  });

  it('rejects non-digit characters', () => {
    const { onChange, container } = setup();
    const cells = otpCells(container);
    fireEvent.change(cells[0]!, { target: { value: 'a' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('paste-fills the entire code and fires onComplete', () => {
    const { onChange, onComplete, container } = setup();
    const cells = otpCells(container);
    fireEvent.paste(cells[0]!, {
      clipboardData: { getData: () => '123456' },
    });
    expect(onChange).toHaveBeenLastCalledWith('123456');
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('backspace from an empty cell walks focus left', () => {
    const { container } = setup('1');
    const cells = otpCells(container);
    cells[1]!.focus();
    fireEvent.keyDown(cells[1]!, { key: 'Backspace' });
    expect(document.activeElement).toBe(cells[0]);
  });
});

describe('Icon set', () => {
  it('IconLogo renders an SVG with the brand mark id', () => {
    const { container } = render(<IconLogo />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('all named glyphs render an SVG element', () => {
    for (const name of Object.keys(Icons) as (keyof typeof Icons)[]) {
      const { container, unmount } = render(Icons[name]());
      expect(container.querySelector('svg'), `Icons.${name}`).toBeTruthy();
      unmount();
    }
  });
});
