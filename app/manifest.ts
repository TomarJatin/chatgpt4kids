// Docs:
// https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const name =
    process.env.NODE_ENV === "development"
      ? "(dev) ChatGPT for Kids"
      : "ChatGPT for Kids";

  return {
    name,
    short_name: name,
    description:
      "A safe, secure AI chatbot specifically for kids aged 3+, with built-in parental controls and monitoring. It's the best way to create a safe and secure environment for your child to begin a relationship with AI, to interact, learn, and grow.",

    // https://github.com/w3c/manifest/wiki/Categories
    categories: ["education", "productivity", "utilities"],

    orientation: "any",

    // https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display
    display: "standalone",

    // https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/theme_color
    //
    // Note: Browsers may override the (background_color and theme_color) manifest values to support
    // any prefers-color-scheme media query defined in your app's CSS.
    background_color: "#fff",
    theme_color: "#fff",

    start_url: "/chat/new",

    icons: [
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48 256x256",
        type: "image/x-icon",
      },
    ],
  };
}
