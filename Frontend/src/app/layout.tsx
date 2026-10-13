import type { Metadata } from 'next';
import { env } from '@/config/env';
import { jsonLd } from '@/lib/utils';
import Providers from './providers';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: 'Elementry Media Technology | Broadcast Solutions',
    template: '%s | Elementry Media Technology',
  },
  description:
    'Broadcast equipment, studio solutions, and system integration from Elementry Media Technology.',
  openGraph: {
    type: 'website',
    siteName: 'Elementry Media Technology',
    title: 'Elementry Media Technology | Broadcast Solutions',
    description: 'Broadcast equipment, studio solutions, and system integration.',
    images: ['/opengraph-image'],
  },
  twitter: { card: 'summary_large_image', images: ['/opengraph-image'] },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a
          href="#main-content"
          className="sr-only z-50 rounded bg-background p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Elementry Media Technology',
              url: env.appUrl,
            }),
          }}
        />
      </body>
    </html>
  );
}
