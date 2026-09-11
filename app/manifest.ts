import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KAOUBI PERFUMES',
    short_name: 'KAOUBI',
    description:
      'KAOUBI PERFUMES متجر عطور في دوز، قبلي، تونس. عطور بثبات طويل للنساء والرجال.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6edea',
    theme_color: '#b08a32',
    lang: 'ar',
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
