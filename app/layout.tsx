import type { Metadata, Viewport } from 'next';
import type { IconDescriptor } from 'next/dist/lib/metadata/types/metadata-types';

import { Toaster } from 'sonner';

import { ThemeProvider } from '@/components/theme-provider';

import happyFavicon from '@/static_assets/happy_favicon.png';

import { PostHogProvider } from './provider-posthog';

import './globals.css';

const seo = {
  title: `ChatGPT for Kids | AI for all ages!`,
  description: `ChatGPT for Kids is a safe, secure AI chatbot built specifically for kids aged 3+, with built-in parental controls and monitoring. It's the best way to create a safe and secure environment for your child to begin a relationship with AI, to interact, learn, and grow.`,
  keywords: `chatgpt for kids, chatgpt kids, kids chatgpt, chatgpt4kids, safe chatgpt, ai for kids, safe ai for kids, kids llm, llm for kids, ai chatbot, parental controls, kids, all ages`,
  image: undefined,
};

const largeIcon: IconDescriptor = {
  url: happyFavicon.src,
  sizes: `${happyFavicon.width}x${happyFavicon.height}`,
  type: 'image/png',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://chatgpt4kids.com'),
  icons: {
    icon: largeIcon,
    apple: largeIcon,
  },
  // viewport: 'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,viewport-fit=cover,user-scalable=no',
  title: seo.title,
  description: seo.description,
  keywords: seo.keywords,
  twitter: {
    title: seo.title,
    description: seo.description,
    creator: '@TODO',
    site: '@TODO',
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
  viewportFit: 'cover',
  userScalable: false,
};

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

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
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="top-center" />
            {children}
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
