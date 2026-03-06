import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: '/kuntapeli/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      scope: '/kuntapeli/',
      manifest: {
        name: 'Kuntapeli - Arvaa kunta',
        short_name: 'Kuntapeli',
        description: 'Arvaa suomalainen kunta joka päivä!',
        start_url: '/kuntapeli/',
        display: 'standalone',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/coats\/.*\.png$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'coat-images',
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /\/shapes\/.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'shape-data',
              expiration: {
                maxEntries: 400,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /\/regions\/.*\.png$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'region-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
});
