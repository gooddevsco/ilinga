import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button.js';

afterEach(() => cleanup());

describe('Button', () => {
  it('renders its label', () => {
    render(<Button onClick={vi.fn()}>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });

  it('default variant is primary (ink button) with .btn.primary classes', () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn.classList.contains('btn')).toBe(true);
    expect(btn.classList.contains('primary')).toBe(true);
  });

  it('signal variant produces .btn.signal', () => {
    render(<Button variant="signal">Top up</Button>);
    expect(screen.getByRole('button', { name: 'Top up' }).classList.contains('signal')).toBe(true);
  });

  it('ghost and danger variants map to their utility classes', () => {
    render(
      <>
        <Button variant="ghost">cancel</Button>
        <Button variant="danger">delete</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'cancel' }).classList.contains('ghost')).toBe(true);
    expect(screen.getByRole('button', { name: 'delete' }).classList.contains('danger')).toBe(true);
  });

  it('size=sm and size=lg add .sm / .lg modifiers', () => {
    render(
      <>
        <Button size="sm">a</Button>
        <Button size="lg">b</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'a' }).classList.contains('sm')).toBe(true);
    expect(screen.getByRole('button', { name: 'b' }).classList.contains('lg')).toBe(true);
  });

  it('is disabled and shows aria-busy when loading', () => {
    render(
      <Button loading onClick={vi.fn()}>
        Saving
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Saving' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn.querySelector('.spinner')).toBeTruthy();
  });

  it('does not invoke onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
