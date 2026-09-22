import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

/**
 * GitHub Pages は SPA のフォールバックを持たないので、
 * index.html と同じ内容の 404.html を置いて、どのパスを直接開いても
 * アプリが起動するようにする。
 */
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(import.meta.dirname, 'dist')
      const index = path.join(dist, 'index.html')
      if (existsSync(index)) copyFileSync(index, path.join(dist, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages はリポジトリ名のサブディレクトリで配信されるため、
  // ここと router の basename、manifest の相対パスを揃える。
  // 院内サーバのルート直下に置くときは '/' に戻す。
  base: '/hospital-hub/',
  plugins: [react(), tailwindcss(), spaFallback()],
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
