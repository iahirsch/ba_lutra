/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../node_modules/.vite/frontend',
  server: {
    port: 4200,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    port: 4200,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Lutra Editor',
        short_name: 'Lutra',
        start_url: '/editor',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-180.png', sizes: '180x180', type: 'image/png', purpose: 'apple touch icon' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/companion\//,
            handler: 'CacheFirst',
            options: { cacheName: 'companion-assets', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //   plugins: () => [ nxViteTsPaths() ],
  // },
  build: {
    outDir: '../dist/frontend',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
