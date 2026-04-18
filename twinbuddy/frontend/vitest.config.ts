import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Prevent plugin from pre-bundling React — jsdom loads its own React
      babel: {
        plugins: [],
      },
    }),
  ],
  root: __dirname,
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, 'src/vitest.setup.ts')],
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['e2e/**', 'test-results/**', 'playwright-report/**'],
    // Prevent React pre-bundling in jsdom
    deps: {
      noExternal: [],
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
    },
  },
});
