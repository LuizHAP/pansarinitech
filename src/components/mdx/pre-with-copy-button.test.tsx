// Tests for PreWithCopyButton client component.
// Covers: initial render, clipboard success, execCommand fallback, both-fail, and state revert.
import React from 'react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useTranslations: vi.fn().mockReturnValue((key: string) => {
      if (key === 'button') return 'Copy code';
      if (key === 'success') return 'Code copied';
      if (key === 'error') return "Couldn't copy — please use Cmd+C";
      return key;
    }),
  };
});

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    CopyIcon: () => React.createElement('span', { 'data-testid': 'copy-icon' }),
    CheckIcon: () => React.createElement('span', { 'data-testid': 'check-icon' }),
  };
});

// Stub motion/react so AnimatePresence renders children without animation delays.
vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion: new Proxy(actual.motion, {
      get(_target, prop) {
        const tag = String(prop);
        return ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) =>
          React.createElement(
            tag,
            Object.fromEntries(
              Object.entries(props).filter(
                ([k]) => !['initial', 'animate', 'exit', 'transition', 'variants'].includes(k),
              ),
            ),
            children,
          );
      },
    }),
  };
});

import { act, render, screen } from '@/test/render';
import { PreWithCopyButton } from './pre-with-copy-button';

const CODE_CHILD = React.createElement('span', { 'data-line': '' }, 'const x = 1');

function renderComponent() {
  return render(React.createElement(PreWithCopyButton, {}, CODE_CHILD), { locale: 'en' });
}

describe('<PreWithCopyButton />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Test 1 (initial render): button with aria-label="Copy code" and CopyIcon visible', () => {
    renderComponent();
    const btn = screen.getByRole('button', { name: 'Copy code' });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('min-w-12');
    expect(btn.className).toContain('min-h-12');
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('check-icon')).toBeNull();
    // output element exists but empty on initial render
    const output = document.querySelector('output');
    expect(output).toBeInTheDocument();
    expect(output?.textContent).toBe('');
  });

  it('Test 2 (clipboard success): shows CheckIcon and calls toast.success', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextSpy },
    });
    renderComponent();
    const btn = screen.getByRole('button', { name: 'Copy code' });
    await act(async () => {
      btn.click();
    });
    expect(writeTextSpy).toHaveBeenCalledWith('const x = 1');
    expect(toast.success).toHaveBeenCalledWith('Code copied');
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('copy-icon')).toBeNull();
    const output = document.querySelector('output');
    expect(output?.textContent).toBe('Code copied');
  });

  it('Test 3 (execCommand fallback): calls toast.success when clipboard unavailable', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });
    renderComponent();
    const btn = screen.getByRole('button', { name: 'Copy code' });
    await act(async () => {
      btn.click();
    });
    expect(toast.success).toHaveBeenCalledWith('Code copied');
  });

  it('Test 4 (both fail): calls toast.error when clipboard rejects and execCommand fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    // execCommand already returns false from beforeEach
    renderComponent();
    const btn = screen.getByRole('button', { name: 'Copy code' });
    await act(async () => {
      btn.click();
    });
    expect(toast.error).toHaveBeenCalledWith("Couldn't copy — please use Cmd+C");
  });

  it('Test 5 (revert): CopyIcon reappears after 2 seconds', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextSpy },
    });
    renderComponent();
    const btn = screen.getByRole('button', { name: 'Copy code' });
    await act(async () => {
      btn.click();
    });
    // After click: check-icon shown
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    // Advance 2001ms — setTimeout callback fires, setCopied(false)
    await act(() => {
      vi.advanceTimersByTime(2001);
    });
    // CopyIcon should reappear
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('check-icon')).toBeNull();
    vi.useRealTimers();
  });
});
