import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import path from 'path'
import svgr from 'vite-plugin-svgr'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import viteImagemin from 'vite-plugin-imagemin'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    base: isProd ? '/todo-react/' : '/',

    plugins: [
      react(),
      svgr(),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/shared/assets/icons')],
        symbolId: 'icon-[name]',
        svgoOptions: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  removeViewBox: false,
                },
              },
            },
            {
              // Видаляємо fill і stroke з усіх елементів — як cleanSymbols в minista
              name: 'removeAttrs',
              params: {
                attrs: ['fill', 'stroke'],
              },
            },
          ],
        },
      }),
      isProd && viteImagemin({
        gifsicle: { optimizationLevel: 7 },
        webp: { quality: 80 },
        mozjpeg: { quality: 80 },
        pngquant: { quality: [0.65, 0.9] },
        svgo: { plugins: [{ removeViewBox: false }] },
      }),
    ],

    server: {
      port: 3000,
      open: true,
    },

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@styles': fileURLToPath(new URL('./src/app/styles', import.meta.url)),
        '@fonts': fileURLToPath(new URL('./src/app/styles/fonts', import.meta.url)),
      }
    },

    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `
            @use "sass:math";
            @use "@styles/settings" as *;
            @use "@styles/includes/index" as *;
          `
        }
      }
    },

    // build: {
    //   rollupOptions: {
    //     output: {
    //       assetFileNames: 'assets/[ext]/[name][extname]',
    //       chunkFileNames: 'assets/js/[name].js',
    //       entryFileNames: 'assets/js/[name].js',
    //     }
    //   }
    // }
  }
})