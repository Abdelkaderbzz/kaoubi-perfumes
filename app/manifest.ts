import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KAOUBI PERFUMES',
    short_name: 'KAOUBI',
    description:
      'Parfumerie a Douz, Kébili. Parfums femme et homme, soins MRAZIG et bakhoor traditionnel. Livraison en Tunisie.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6e2e7',
    theme_color: '#b08a32',
    lang: 'fr',
    icons: [
      {
        src: '/logo-mark.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-mark.webp',
        sizes: '512x512',
        type: 'image/webp',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
