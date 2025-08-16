import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5178,
    strictPort: true, // Всегда использовать порт 5178, не искать другой
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Optimize for SEO and performance
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs to debug API issues
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Optimize chunk splitting
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
          'query-vendor': ['react-query', 'axios'],
        },
      },
    },
    // Enable source maps for better debugging
    sourcemap: false,
    // Optimize assets
    assetsInlineLimit: 4096,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Set chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
  },
})