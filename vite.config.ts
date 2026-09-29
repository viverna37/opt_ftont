import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Уникальный id каждой сборки — используется UpdateChecker'ом (см.
// src/shared/ui/UpdateChecker) для обнаружения, что открытая копия
// мини-аппа устарела, если WebView держит страницу в памяти без
// перезагрузки (Telegram не перезапускает webview между сессиями).
const buildVersion = String(Date.now())

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'write-build-version',
      writeBundle(options) {
        writeFileSync(join(options.dir ?? 'dist', 'version.txt'), buildVersion)
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
  },
  server: {
    host: true,
    // Needed to test through an ngrok/cloudflared tunnel from inside Telegram —
    // Vite rejects requests whose Host header it doesn't recognize otherwise.
    allowedHosts: true,
  },
})
