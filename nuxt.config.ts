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
      icons: false,
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
      htmlAttrs: {
        lang: 'pt-BR'
      },
      title: 'BrDiagrama - Modelagem de Banco de Dados e Diagramas ER Online',
      meta: [
        { name: 'description', content: 'A ferramenta gratuita e 100% brasileira para você transformar scripts SQL (DDL) em diagramas ER de forma automática e offline.' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { name: 'author', content: 'BrDiagrama Team - FMP' },
        { name: 'language', content: 'Portuguese' },
        { name: 'theme-color', content: '#1abc9c' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'BrDiagrama' },
        { property: 'og:locale', content: 'pt_BR' },
        { property: 'og:url', content: 'https://brdiagrama.com/' },
        { property: 'og:title', content: 'BrDiagrama - Transforme SQL em Diagramas ER Automaticamente' },
        { property: 'og:description', content: 'Ferramenta brasileira gratuita que gera diagramas ER a partir de SQL em tempo real. Detecta relacionamentos, cardinalidade e herança automaticamente.' },
        { property: 'og:image', content: 'https://brdiagrama.com/og-cover-social.png' },
        { property: 'og:image:secure_url', content: 'https://brdiagrama.com/og-cover-social.png' },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'BrDiagrama - Interface do gerador de diagramas ER' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'BrDiagrama - SQL para Diagrama ER Instantâneo' },
        { name: 'twitter:description', content: 'Ferramenta gratuita que converte SQL em diagramas ER visuais. Detecta cardinalidade automaticamente. 100% offline e sem cadastro.' },
        { name: 'twitter:image', content: 'https://brdiagrama.com/og-cover-social.png' },
        { name: 'twitter:image:alt', content: 'BrDiagrama - Gerador de diagramas ER' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
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
