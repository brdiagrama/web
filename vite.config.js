import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.svg'],
      manifest: {
        name: 'BrDiagrama - Gerador de Diagrama ER',
        short_name: 'BrDiagrama',
        description: 'Transforme SQL DDL em diagramas ER visuais instantaneamente',
        theme_color: '#1abc9c',
        background_color: '#0F172A',
        display: 'standalone',
        start_url: '/gerador',
        icons: [
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        // NÃO cacheia HTMLs no precache - só JS, CSS, assets
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
        // Ignora HTMLs no precache
        globIgnores: ['**/index.html', '**/editor.html'],
        // Desabilita navigateFallback para evitar erro
        navigateFallback: null,
        navigateFallbackDenylist: [/^\//],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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
          },
          {
            // QUALQUER navegação HTML: SEMPRE da rede, NUNCA do cache
            urlPattern: ({ request }) => request.destination === 'document' || request.mode === 'navigate',
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: '/',
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        editor: resolve(__dirname, 'editor.html'), 
      },
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia'],
          'monaco': ['@guolao/vue-monaco-editor'],
          'svg-utils': ['svg-pan-zoom'],
          'sql-parser': ['node-sql-parser'],
          'icons': ['lucide-vue-next'],
        }
      }
    },
  },
});