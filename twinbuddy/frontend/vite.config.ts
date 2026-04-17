import { defineConfig } from 'vite'

export default defineConfig({
  // No @vitejs/plugin-react — tsconfig handles JSX via react-jsx transform
  // This avoids React version conflicts between Vite bundling and jsdom testing
  server: {
    port: 5173,
    host: true,
  },
})
