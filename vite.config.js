import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Относительные пути к ассетам — работает и на GitHub Pages, и на любом хостинге
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
})
