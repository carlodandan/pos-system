import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
    plugins: [
        react({
          babel: {
            plugins: [['babel-plugin-react-compiler']],
          },
        }),
        VitePWA({
          registerType: 'autoUpdate',
          workbox: {
            globPatterns: [
              '**/*.{js,css,html,ico,png,jpg,jpeg,webp,svg,woff,woff2,ttf,eot}']
          }
        }),
        tailwindcss(),
    ],
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
    // Tauri-compatible server settings
    clearScreen: false,
    server: {
        port: 5173,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                  protocol: 'ws',
                  host,
                  port: 5174,
              }
            : undefined,
        watch: {
            ignored: ['**/src-tauri/**'],
        },
    },
    envPrefix: ['VITE_', 'TAURI_ENV_*'],
});
