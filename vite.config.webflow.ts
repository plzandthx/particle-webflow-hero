import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Build config for standalone Webflow bundle
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist-webflow',
    lib: {
      entry: path.resolve(__dirname, 'src/webflow-entry.tsx'),
      name: 'ParticleRevealHero',
      fileName: 'particle-reveal-hero',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
    assetsInlineLimit: 200000,
  },
});
