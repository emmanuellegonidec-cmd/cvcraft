import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cvcraft-five.vercel.app'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/editor`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
    },
  ]
}