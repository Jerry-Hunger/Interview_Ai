import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // 本地开发将同源 /api 请求转发至 Express，避免浏览器跨域请求。
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 清理已不再被引用的资源，防止历史 PDF worker 残留在发布目录。
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-router')) return 'vendor-react'
          if (id.includes('node_modules/@radix-ui')) return 'vendor-radix'
          // 仅在简历上传/预览时加载解析器；将 DOCX 的 ZIP 实现再拆分，避免单块超过 500KB。
          if (id.includes('node_modules/pdfjs-dist')) return 'vendor-pdf'
          if (id.includes('node_modules/tesseract.js')) return 'vendor-ocr'
          if (id.includes('node_modules/jszip')) return 'vendor-document-zip'
          if (id.includes('node_modules/mammoth')) return 'vendor-document'
        },
      },
    },
  },
})
