import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Water of Gold',
    short_name: 'Water of Gold',
    description:
      'Parfumerie a Sousse, Tunisie. Fragrances de longue tenue pour femmes et hommes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0b0b',
    theme_color: '#c9a44a',
    lang: 'fr',
    icons: [
      {
        src: '/logo.webp',
        sizes: '512x512',
        type: 'image/webp',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
