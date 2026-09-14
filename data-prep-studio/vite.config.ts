import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'ag-grid': ['ag-grid-react', 'ag-grid-community'],
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm']
  }
})
