/// <reference types="@vite-pwa/nuxt" />

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [
    'vuetify-nuxt-module',
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],
  vuetify: {
    moduleOptions: {
      prefixComposables: ['useLayout']
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: 'dark',
        themes: {
          dark: {
            dark: true,
            colors: {
              primary: '#1ABA9C',
              background: '#0F0F0F',
              surface: '#1F1F1F',
              'surface-variant': '#2A2A2A',
              'on-background': '#F0F0F0',
              'on-surface': '#F0F0F0',
              'on-primary': '#0F0F0F',
            }
          },
          light: {
            dark: false,
            colors: {
              primary: '#1ABA9C',
              background: '#ffffff',
              surface: '#f0f4f9',
              'surface-variant': '#e9eef6',
              'on-background': '#1f1f1f',
              'on-surface': '#1f1f1f',
              'on-primary': '#0F0F0F',
            }
          }
        }
      }
    }
  },
  css: [
    '~/assets/styles/global.css'
  ],
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@8..144,100..1000&family=Fira+Code:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap' }
      ],
      script: [
        { innerHTML: "(function(){try{var t=localStorage.getItem('brdiagrama-theme');var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&prefersDark)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();", type: 'text/javascript' },
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
