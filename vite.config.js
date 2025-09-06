import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend/src"),
      "@proto": path.resolve(__dirname, "../SGSDataMgmtCore/prototypes/react-shadcn-platform/src"),
    },
  },
  server: {
    fs: {
      // Allow importing files from the prototype workspace
      allow: [
        path.resolve(__dirname, "../SGSDataMgmtCore/prototypes/react-shadcn-platform/src"),
        "..",
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})