import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright 配置（占位，安装后启用）
 * 依据：docs/frontend-overview.md §11.2
 *
 * 安装：cd twinbuddy/frontend && pnpm add -D @playwright/test
 * 安装浏览器：pnpm exec playwright install
 * 跑法：pnpm exec playwright test
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  fullyParallel: false, // SPA 单线程跑更稳
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
    actionTimeout: 5000,
    navigationTimeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['iPhone 14 Pro'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    timeout: 60 * 1000,
    reuseExistingServer: true,
  },
})
