import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  main: {
    build: {
      lib: {
        entry: resolve(__dirname, 'main.js') // Explicitly define the entry point
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    build: {
      lib: {
        entry: resolve(__dirname, 'preload.js') // Explicitly define the entry point
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src')
      }
    },
    plugins: [tailwindcss(), react()]
  }
})
