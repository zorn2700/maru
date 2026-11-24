import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:8012",
    trace: "retain-on-failure",
  },
  // WebKit is not installed locally; iPhone coverage is documented as pending.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "python3 -m http.server 8012 --directory site",
    url: "http://127.0.0.1:8012",
    reuseExistingServer: !process.env.CI,
  },
});
