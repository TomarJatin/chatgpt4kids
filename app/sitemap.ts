import type { MetadataRoute } from "next";

// Allegedly, Google ignores <priority> and <changefreq> values.
//
// Docs:
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#additional-notes-about-xml-sitemaps

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://chatgpt4kids.com",
      lastModified: "2025-03-16T00:29:13.795Z",
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://chatgpt4kids.com/login",
      lastModified: "2025-03-16T00:29:13.795Z",
      priority: 0.1,
    },
    {
      url: "https://chatgpt4kids.com/register",
      lastModified: "2025-03-16T00:29:13.795Z",
      priority: 0.1,
    },
  ];
}
