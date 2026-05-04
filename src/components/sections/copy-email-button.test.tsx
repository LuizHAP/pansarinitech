// Tests for CopyEmailButton client component.
// Covers EN/PT labels, clipboard success, execCommand fallback, and total failure paths.
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

import { render, screen } from '@/test/render';
import { CopyEmailButton } from './copy-email-button';

const TEST_EMAIL = 'test@example.com';

describe('<CopyEmailButton />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset isSecureContext to true before each test.
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    // Stub navigator.clipboard with a resolving writeText.
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    // Reset execCommand to a no-op by default.
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Test 1 (EN): renders a button with "Copy email" label and aria-live="polite"', () => {
    render(<CopyEmailButton email={TEST_EMAIL} />, { locale: 'en' });

    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-live', 'polite');
    expect(btn).toHaveTextContent('Copy email');
  });

  it('Test 2 (PT): renders "Copiar email" label in PT locale', () => {
    render(<CopyEmailButton email={TEST_EMAIL} />, { locale: 'pt' });

    expect(screen.getByRole('button')).toHaveTextContent('Copiar email');
  });

  it('Test 3 (clipboard success): calls writeText with the email and shows success toast', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextSpy },
    });

    render(<CopyEmailButton email={TEST_EMAIL} />, { locale: 'en' });

    await user.click(screen.getByRole('button'));

    expect(writeTextSpy).toHaveBeenCalledWith(TEST_EMAIL);
    expect(toast.success).toHaveBeenCalledWith('Email copied');
    // Button text should flip to "Email copied" after success.
    expect(screen.getByRole('button')).toHaveTextContent('Email copied');
  });

  it('Test 4 (clipboard fails + execCommand fails): shows error toast', async () => {
    const user = userEvent.setup();

    // Make writeText reject AND execCommand return false (already set in beforeEach).
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });

    render(<CopyEmailButton email={TEST_EMAIL} />, { locale: 'en' });

    await user.click(screen.getByRole('button'));

    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't copy — please use Cmd+C",
    );
  });

  it('Test 5 (execCommand fallback success): uses execCommand when clipboard unavailable', async () => {
    const user = userEvent.setup();

    // Remove clipboard availability and make execCommand succeed.
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    });

    render(<CopyEmailButton email={TEST_EMAIL} />, { locale: 'en' });

    await user.click(screen.getByRole('button'));

    expect(toast.success).toHaveBeenCalledWith('Email copied');
  });
});
