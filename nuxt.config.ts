/// <reference types="@vite-pwa/nuxt" />

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap' }
      ],
      script: [
        { src: 'https://cdn.tailwindcss.com' }
      ]
    }
  },
  pwa: {
    devOptions: {
      enabled: true,
      type: 'module'
    },
    registerType: 'autoUpdate',
    manifest: {
      name: 'BrDiagrama - Gerador de Diagrama ER',
      short_name: 'BrDiagrama',
      description: 'Transforme SQL DDL em diagramas ER visuais instantaneamente',
      theme_color: '#1abc9c',
      background_color: '#0F172A',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        {
          src: '/web-app-manifest-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/web-app-manifest-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
      navigateFallback: null,
      maximumFileSizeToCacheInBytes: 5000000,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/cdn\.tailwindcss\.com\/.*/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'tailwind-cache',
            expiration: {
              maxEntries: 5,
              maxAgeSeconds: 60 * 60 * 24 * 7
            }
          }
        }
      ]
    }
  },
  routeRules: {
    '/gerador': { ssr: false }
  }
})
