import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },  server: {
    port: 3000,
    // Removendo o proxy pois vamos usar uma solução diferente para desenvolvimento
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
