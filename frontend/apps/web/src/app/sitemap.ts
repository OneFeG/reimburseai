import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.reimburseai.app'
  const lastModified = new Date()
  
  // Main pages - these help Google create sitelinks
  const mainPages = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sign-up`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/demo`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ]

  // Hash sections on homepage (helps with sitelinks)
  const hashSections = [
    { path: '/#features', priority: 0.6 },
    { path: '/#how-it-works', priority: 0.6 },
    { path: '/#security', priority: 0.5 },
    { path: '/#faq', priority: 0.5 },
  ].map(({ path, priority }) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority,
  }))

  return [...mainPages, ...hashSections]
}
