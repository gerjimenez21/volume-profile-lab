import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const yahooHeaders = {
  'User-Agent':
    'Mozilla/5.0 (compatible; VolumeProfileLab/1.0; +local-dev)',
  Accept: 'application/json',
}

// Yahoo Finance blocks browser CORS; proxy keeps the client free of API keys.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/yahoo/chart': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/yahoo\/chart/, '/v8/finance/chart'),
        headers: yahooHeaders,
      },
      '/api/yahoo/search': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/yahoo\/search/, '/v1/finance/search'),
        headers: yahooHeaders,
      },
    },
  },
})
