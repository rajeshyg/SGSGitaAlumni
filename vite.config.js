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
      "@proto": path.resolve(__dirname, "../SGSDataMgmtCore/prototypes/react-shadcn-platform/src"),
    },
  },
  server: {
    host: '0.0.0.0', // Listen on all interfaces for network access
    fs: {
      // Allow importing files from the prototype workspace
      allow: [
        path.resolve(__dirname, "../SGSDataMgmtCore/prototypes/react-shadcn-platform/src"),
        "..",
      ],
    },
    // Proxy API requests to the backend server
    // Use environment variable or fallback to localhost
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        cache: false
      },
      '/socket.io': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3001',
        changeOrigin: true,
        ws: true,  // Enable WebSocket proxying
        // Retry configuration to handle backend startup delay
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('[vite] WebSocket proxy error (backend may not be ready yet)');
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Log connection attempts in debug mode only
          });
        }
      }
    }
  },
})