import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

const shared = resolve(__dirname, 'src/shared')

const CSP =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; font-src 'self'; media-src 'self' data:; connect-src 'self'"

/** CSP'yi sadece uretim ciktisina ekler; dev sunucusunun HMR'ini bozmaz. */
function cspPlugin(): Plugin {
  return {
    name: 'mola-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`
      )
    }
  }
}

export default defineConfig({
  main: {
    resolve: { alias: { '@shared': shared } },
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: { input: { index: resolve(__dirname, 'src/main/index.ts') } }
    }
  },
  preload: {
    resolve: { alias: { '@shared': shared } },
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: { input: { index: resolve(__dirname, 'src/preload/index.ts') } }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    resolve: {
      alias: {
        '@shared': shared,
        '@': resolve(__dirname, 'src/renderer/src')
      }
    },
    plugins: [react(), cspPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
          overlay: resolve(__dirname, 'src/renderer/overlay.html')
        }
      }
    }
  }
})
