import { fileURLToPath, URL } from 'node:url'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import path from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { customPort } from './src/config/baseConfig'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env': {
      BASE_URL_DEV: process.env.BASE_URL_DEV,
      BASE_URL_PRO: process.env.BASE_URL_PRO,
      CUSTOM_PORT: process.env.CUSTOM_PORT,
    }
  },
  server: {
    port: customPort, 
    open: true 
  },
  plugins: [
    vue(),
    createSvgIconsPlugin({
      iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
      symbolId: 'icon-[dir]-[name]'
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
