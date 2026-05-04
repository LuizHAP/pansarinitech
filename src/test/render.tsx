import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import type { ReactElement, ReactNode } from 'react';
import enMessages from '../../messages/en.json';
import ptMessages from '../../messages/pt.json';
import type { Locale } from '@/i18n/routing';

const MESSAGES = { en: enMessages, pt: ptMessages } as const;

export function renderWithLocale(
  ui: ReactElement,
  {
    locale = 'en' as Locale,
    theme = 'light' as 'light' | 'dark',
    ...options
  }: {
    locale?: Locale;
    theme?: 'light' | 'dark';
  } & Omit<RenderOptions, 'wrapper'> = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="UTC">
        <ThemeProvider attribute="class" defaultTheme={theme} enableSystem={false}>
          {children}
        </ThemeProvider>
      </NextIntlClientProvider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Default export is the wrapped render so tests can `import { render } from '@/test/render'`.
export { renderWithLocale as render };
export * from '@testing-library/react';
