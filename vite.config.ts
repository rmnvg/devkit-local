/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import securityHeaders from './config/security-headers.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['icons/*.svg', 'icons/apple-touch-icon.png', 'theme-init.js'],
      manifest: {
        name: 'devkit-local — dev toolbox for AI engineers',
        short_name: 'devkit-local',
        description: 'Token counter, LLM cost calculator, JWT, JSON, regex and more. Everything runs locally.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#0b0f17',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache everything, including lazy tool chunks, workers and tokenizer ranks (large).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        globIgnores: ['og.png'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  worker: { format: 'es' },
  // No data: URIs for assets (e.g. small font subsets): the CSP allows fonts from 'self' only.
  build: { assetsInlineLimit: 0 },
  // Serve the production headers locally so e2e tests run under the real CSP.
  preview: { headers: securityHeaders },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
