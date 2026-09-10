import path from 'node:path';
import { defineConfig } from '@playwright/test';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.resolve('.playwright-browsers');

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  // Authenticated E2E specs use the Better Auth test account supplied by env.
  // Run them in one worker so one test cannot invalidate another test's session.
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
    headless: true,
  },
});
