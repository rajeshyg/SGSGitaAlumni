import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { visualizer } from 'rollup-plugin-visualizer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - run with ANALYZE=true npm run build
    process.env.ANALYZE && visualizer({
      filename: './reports/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "lib/": path.resolve(__dirname, "./src/lib"),
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
    // Backend proxy removed - using mock data layer instead
    // Previous configuration:
    // '/api': { target: 'http://localhost:8000', changeOrigin: true, secure: false },
    // '/health': { target: 'http://localhost:8000', changeOrigin: true, secure: false }
  },
})