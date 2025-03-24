import type { MetadataRoute } from "next";

// Allegedly, Google ignores <priority> and <changefreq> values.
//
// Docs:
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap#additional-notes-about-xml-sitemaps

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://chatgpt4kids.com",
      lastModified: "2025-03-24T05:38:02.920Z",
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
    {
      url: "https://chatgpt4kids.com/privacy-policy",
      lastModified: "2025-03-24T06:38:02.920Z",
      priority: 0.1,
    },
    {
      url: "https://chatgpt4kids.com/terms-of-use",
      lastModified: "2025-03-24T06:38:02.920Z",
      priority: 0.1,
    },
  ];
}
