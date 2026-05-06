// Tests for EasterEgg component.
// next/script is mocked so jsdom can read the inline script body as innerHTML.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/script', () => ({
  default: ({ children, ...rest }: { children?: string; [k: string]: unknown }) => {
    const html = typeof children === 'string' ? children : '';
    return React.createElement('script', { ...rest, dangerouslySetInnerHTML: { __html: html } });
  },
}));

import { render } from '@testing-library/react';
import { EasterEgg } from './easter-egg';

describe('<EasterEgg />', () => {
  it('returns null in the default test environment (NODE_ENV is not production)', () => {
    const { container } = render(<EasterEgg />);
    expect(container.firstChild).toBeNull();
  });

  describe('in production', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('renders a <script> tag with the easter-egg id', () => {
      const { container } = render(<EasterEgg />);
      const scriptEl = container.querySelector('script');
      expect(scriptEl).not.toBeNull();
      expect(scriptEl?.id).toBe('easter-egg');
    });

    it('the script body contains the console.log call with saber-red color', () => {
      const { container } = render(<EasterEgg />);
      const scriptEl = container.querySelector('script');
      expect(scriptEl?.innerHTML).toContain('console.log("%c%s"');
      expect(scriptEl?.innerHTML).toContain('#cd1819');
    });
  });
});
