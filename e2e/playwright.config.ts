import { defineConfig, devices } from '@playwright/test';
import { env } from './setup/env';

const defaultRetries = process.env.CI ? 2 : 1;
const retries = Number(process.env.PLAYWRIGHT_RETRIES ?? defaultRetries);
const workers = Number(process.env.PLAYWRIGHT_WORKERS ?? (process.env.CI ? 4 : 2));

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries,
  workers,
  metadata: {
    e2eTarget: env.target,
    readOnly: env.readOnly,
  },
  
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  use: {
    baseURL: env.baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: Number(process.env.PLAYWRIGHT_ACTION_TIMEOUT ?? 10_000),
    navigationTimeout: Number(process.env.PLAYWRIGHT_NAV_TIMEOUT ?? 30_000)
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup']
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup']
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup']
    }
  ],

  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown.ts')
});
