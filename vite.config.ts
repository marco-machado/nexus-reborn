import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Node global, typed locally so the build needs no @types/node.
declare const process: { env: Record<string, string | undefined> }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The WebGPU mission is route-split from the 327 kB application shell.
    // Its Three.js renderer is intentionally larger than Vite's generic limit.
    chunkSizeWarningLimit: 1800,
  },
  server: {
    // The harness assigns a port through PORT when 4200 is taken.
    port: Number(process.env.PORT ?? 4200),
  },
})
