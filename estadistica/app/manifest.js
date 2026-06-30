export default function manifest() {
  return {
    name: 'Parchita Tracker - Control Agrícola',
    short_name: 'Parchita',
    description: 'Sistema PWA para el registro y análisis de hitos agrícolas de maracuyá / parchita.',
    start_url: '/',
    display: 'standalone',
    background_color: '#022c22', // bg-emerald-950
    theme_color: '#059669', // text-emerald-600
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  };
}
