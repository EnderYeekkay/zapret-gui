// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Возвращаем конфиг в зависимости от режима
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    root: 'public/mainwindowr',         // где лежит index.html
    base: isDev ? '/' : './',           // <-- вот оно: / в dev, ./ в prod (file:// friendly)
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: 'public/mainwindowr/index.html',
        output: {
          // опционально: задать человекопонятные имена в dist
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
