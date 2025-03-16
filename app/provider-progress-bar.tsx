"use client";

import { ProgressProvider } from "@bprogress/next/app";

export function ProviderProgressBar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProgressProvider
      height="1.5px"
      color="hsl(var(--primary) / 0.5)"
      options={{
        // looks bad on mobile, albeit decent on desktop:
        showSpinner: false,
      }}
      startOnLoad
      shallowRouting
      /*
       * Note: we use this (with disableAnchorClick={false}) to make the animation
       * happen for anchor clicks/navigations.
       *
       * Currently, our landing page sections are all on one page, with #anchor's
       * and links to them for Pricing, Features, FAQ, etc.
       *
       * This way it's even more clear to non-tech-savy users that a navigation has
       * occurred following their click (sometimes it's less clear that something
       * has changed, because it happens faster than the blink of an eye).
       */
      disableSameURL={false}
    >
      {children}
    </ProgressProvider>
  );
}
