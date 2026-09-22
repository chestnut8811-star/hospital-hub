import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5180,
    strictPort: false,
    // 同じ Wi-Fi のスマホから開けるように、すべてのネットワークインターフェースで待ち受ける。
    // 起動時に表示される「Network:」の URL をスマホで開く。
    host: true,
  },
  preview: {
    port: 4180,
    strictPort: false,
    host: true,
  },
})
