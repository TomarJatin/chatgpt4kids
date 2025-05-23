import type { Metadata, Viewport } from 'next';
import type { IconDescriptor } from 'next/dist/lib/metadata/types/metadata-types';
import Script from 'next/script';

import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/components/theme-provider';

import happyFavicon from '@/static_assets/happy_favicon_square.png';

import { PostHogProvider } from './provider-posthog';
import { ProviderProgressBar } from './provider-progress-bar';

import './globals.css';

const seo = {
  title: `ChatGPT for Kids | AI for all ages!`,
  description: `A safe, secure AI chatbot specifically for kids aged 3+, with built-in parental controls and monitoring. It's the best way to create a safe and secure environment for your child to begin a relationship with AI, to interact, learn, and grow.`,
  keywords: `chatgpt for kids, chatgpt kids, kids chatgpt, chatgpt4kids, safe chatgpt, ai for kids, safe ai for kids, kids llm, llm for kids, ai chatbot, parental controls, kids, all ages`,
  image: happyFavicon.src,
};

const largeIcon: IconDescriptor = {
  rel: 'icon',
  url: happyFavicon.src,
  type: 'image/png',
  sizes: `${happyFavicon.width}x${happyFavicon.height}`,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://chatgpt4kids.com'),
  icons: {
    // this results in an undesirable order (of the <meta> tags)
    // icon: largeIcon,

    // for some reason, not working:
    // apple: largeIcon,

    other: [
      {
        rel: 'icon',
        url: '/favicon.ico',
        type: 'image/x-icon',
        // Note:
        // $ identify public/favicon.ico
        // app/favicon.ico[0] ICO 16x16 16x16+0+0 8-bit sRGB 0.000u 0:00.005
        // app/favicon.ico[1] ICO 32x32 32x32+0+0 8-bit sRGB 0.000u 0:00.005
        // app/favicon.ico[2] ICO 48x48 48x48+0+0 8-bit sRGB 0.000u 0:00.005
        // app/favicon.ico[3] PNG 256x256 256x256+0+0 8-bit sRGB 50895B 0.000u 0:00.001
        sizes: '16x16 32x32 48x48 256x256',
      },
      largeIcon,
      {
        rel: 'apple-touch-icon',
        url: happyFavicon.src,
        sizes: largeIcon.sizes,

        // "type" is not needed, apple asks for a PNG unconditionally:
        // https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
        // type: largeIcon.type,
      },
    ],
  },
  title: seo.title,
  description: seo.description,
  keywords: seo.keywords,
  twitter: {
    title: seo.title,
    description: seo.description,
    creator: '@chatgpt4kids',
    site: '@chatgpt4kids',
    ...(seo.image
      ? {
          card: 'summary_large_image',
          images: seo.image,
        }
      : {}),
  },
  openGraph: {
    type: 'website',
    title: seo.title,
    description: seo.description,
    ...(seo.image
      ? {
          images: seo.image,
        }
      : {}),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  viewportFit: 'contain',
  userScalable: false,

  themeColor: [
    {
      media: '(prefers-color-scheme: light)',
      color: 'hsl(0 0% 100%)',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: 'hsl(240deg 10% 3.92%)',
    },
  ],
};

function themeColorScriptFn() {
  const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
  const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';

  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta?.setAttribute('content', isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
}
const THEME_COLOR_SCRIPT = `(${themeColorScriptFn.toString()})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
    >
      <head>
        {/* Katex HTML
         *
         * Note:
         * also show mathml via e.g.:
         * <style>{`.katex-mathml { position: relative !important;}`}</style>
         */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css"
          integrity="sha384-zh0CIslj+VczCZtlzBcjt5ppRcsAmDnRem7ESsYwWwg3m/OaJ2l4x7YBZl9Kxxib"
          crossOrigin="anonymous"
          fetchPriority="low"
        />

        <Script
          // https://nextjs.org/docs/app/building-your-application/optimizing/scripts#inline-scripts
          // > Warning: An id property must be assigned for inline scripts in order for Next.js to track and optimize the script.
          id="root-theme-color-script"
          dangerouslySetInnerHTML={{ __html: THEME_COLOR_SCRIPT }}
        />
      </head>
      <body className="antialiased">
        <VercelAnalytics />
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="top-center" />
            <ProviderProgressBar>{children}</ProviderProgressBar>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
