import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020'
  },
  server: {
    port: 3000
  },
  preview: {
    // Public preview tunnels (e.g. *.trycloudflare.com) rotate hostnames,
    // so the static preview server must accept any Host header.
    allowedHosts: true
  }
})
