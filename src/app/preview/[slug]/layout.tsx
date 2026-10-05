import { ThemeProvider } from '@/components/shared/theme-provider';
import { findClientPreview } from '@/lib/client-preview-source';
import { Analytics } from '@vercel/analytics/next';
import { setRequestLocale } from 'next-intl/server';
import { IBM_Plex_Sans } from 'next/font/google';
import { notFound } from 'next/navigation';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

// The root layout is a passthrough, so this segment owns the document shell.
export default async function PreviewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const preview = await findClientPreview(slug);
  if (!preview) notFound();
  setRequestLocale(preview.locale);

  const htmlLang = preview.locale === 'pt' ? 'pt-BR' : 'en';

  return (
    <html lang={htmlLang} suppressHydrationWarning className={ibmPlexSans.variable}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
