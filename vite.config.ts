import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import type { ServerResponse } from 'node:http'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('error', (err, _req, res) => {
            const code = (err as NodeJS.ErrnoException | undefined)?.code

            // ECONNREFUSED tanpa penjelasan bikin debugging sia-sia.
            // Hampir selalu berarti API belum jalan.
            if (code !== 'ECONNREFUSED') return

            const hint =
              '\n\n  API belum jalan. Vite hanya proxy ke http://localhost:4000.\n' +
              '  Jalankan:\n' +
              '    npm run dev        # frontend + backend sekaligus (disarankan)\n' +
              '    npm run dev:api    # atau backend saja, di terminal terpisah\n'

            console.error(`\n  [proxy] Tidak bisa konek ke API (localhost:4000).${hint}`)

            // http-proxy mengirim Socket untuk streaming dan ServerResponse untuk HTTP biasa.
            // Hanya ServerResponse yang bisa kita balas sendiri, jadi yang ini dicek dulu.
            const httpRes = res as ServerResponse

            if (!httpRes.headersSent && typeof httpRes.writeHead === 'function') {
              httpRes.writeHead(503, { 'Content-Type': 'application/json' })
              httpRes.end(
                JSON.stringify({
                  error: 'API belum berjalan',
                  hint: 'Jalankan `npm run dev` di root, atau `npm run dev:api` untuk backend saja.',
                })
              )
            }
          })
        }
      },
    },
  },
})