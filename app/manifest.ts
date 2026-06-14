import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Meal Journal',
    short_name: 'Meal Journal',
    description: 'あなたの食事を、やさしく管理する',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F4ED',
    theme_color: '#7A9471',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
