import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // The HTML report is what CI uploads when a run fails; locally the
  // terminal list is enough.
  reporter: process.env['CI'] ? [['line'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    // A failed CI run is only debuggable from its trace; locally you just
    // rerun it headed.
    trace: process.env['CI'] ? 'retain-on-failure' : 'on-first-retry',
    // Headless Chrome otherwise refuses to start an AudioContext without a
    // real gesture, which would make the transport test untestable.
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
  },
  projects: [{ name: 'mobile', use: { ...devices['Pixel 7'] } }],
  webServer: {
    // CI builds once, in its own step, and serves that dist here. Building
    // again would be the same two seconds of work for the same bytes — and
    // would mean the tests no longer ran against the artifact that ships.
    command: process.env['CI']
      ? 'npx vite preview --port 4173'
      : 'npm run build && npx vite preview --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
})
