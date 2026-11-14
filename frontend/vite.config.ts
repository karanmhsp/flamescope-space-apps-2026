import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Serve curated NASA telemetry stored beside the frontend workspace.
      allow: ['../data/curated'],
    },
  },
})
