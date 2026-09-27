import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/pages",
  use: {
    baseURL: "http://127.0.0.1:4175/naval-acquisition-learning/",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 800 } },
    },
  ],
  webServer: {
    command: "npm run preview -- --mode pages --port 4175 --strictPort",
    url: "http://127.0.0.1:4175/naval-acquisition-learning/",
    reuseExistingServer: false,
  },
  reporter: "list",
});
