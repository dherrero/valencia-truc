import { defineConfig } from '@playwright/test';

process.env.ROOM_DISCONNECT_GRACE_PERIOD_MS ??= '1000';

export default defineConfig({
  testDir: './src',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 120_000,
  globalSetup: './src/global-setup',
  globalTeardown: './src/global-teardown',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },
  reporter: [['list']],
});
