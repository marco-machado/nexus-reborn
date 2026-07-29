import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The WebGPU mission is route-split from the 327 kB application shell.
    // Its Three.js renderer is intentionally larger than Vite's generic limit.
    chunkSizeWarningLimit: 1800,
  },
  server: {
    port: 4200,
  },
})
