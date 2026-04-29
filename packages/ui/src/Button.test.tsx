import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button.js';

afterEach(() => cleanup());

describe('Button', () => {
  it('renders its label', () => {
    render(<Button onClick={vi.fn()}>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
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
