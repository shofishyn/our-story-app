import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'src/public'),

  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  base: '/',

  // Plugin untuk copy service worker dan manifest
  plugins: [
    {
      name: 'copy-pwa-files',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        
        // 1. Copy service-worker.js
        const swSrc = resolve(__dirname, 'src/service-worker.js');
        const swDest = resolve(distDir, 'service-worker.js');
        
        if (existsSync(swSrc)) {
          copyFileSync(swSrc, swDest);
          console.log('✓ Service worker copied to dist/service-worker.js');
        } else {
          console.warn('⚠️  Warning: src/service-worker.js not found!');
          console.warn('   Looking for file at:', swSrc);
        }

        // Copy manifest.json (jika belum ada di dist)
        const manifestSrc = resolve(__dirname, 'src/manifest.json');
        const manifestDest = resolve(distDir, 'manifest.json');
        
        if (existsSync(manifestSrc) && !existsSync(manifestDest)) {
          copyFileSync(manifestSrc, manifestDest);
          console.log('✓ Manifest copied to dist/manifest.json');
        }

        // Copy favicon (jika ada)
        const faviconSrc = resolve(__dirname, 'src/favicon.png');
        const faviconDest = resolve(distDir, 'favicon.png');
        
        if (existsSync(faviconSrc)) {
          copyFileSync(faviconSrc, faviconDest);
          console.log('✓ Favicon copied to dist/favicon.png');
        }

        // Copy images folder (untuk icons)
        const imagesSrc = resolve(__dirname, 'src/images');
        const imagesDest = resolve(distDir, 'images');
        
        if (existsSync(imagesSrc)) {
          if (!existsSync(imagesDest)) {
            mkdirSync(imagesDest, { recursive: true });
          }
          
          const { readdirSync } = require('fs');
          const files = readdirSync(imagesSrc);
          
          files.forEach(file => {
            const srcFile = resolve(imagesSrc, file);
            const destFile = resolve(imagesDest, file);
            copyFileSync(srcFile, destFile);
          });
          
          console.log(`✓ ${files.length} image files copied to dist/images/`);
        }

        console.log('PWA files copy complete!');
      }
    }
  ],
});