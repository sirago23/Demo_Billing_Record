import { defineConfig } from "@playwright/test";

const PORT = 3100;
export const E2E_PASSWORD = "e2e-password";

// Own port, own database and fixed credentials; ANTHROPIC_API_KEY is blank so Claude can never be called.
export default defineConfig({
  testDir: "e2e",
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `node scripts/e2e-setup.mjs && npm run db:migrate && npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_PATH: "./data/e2e.db",
      APP_PASSWORD: E2E_PASSWORD,
      SESSION_SECRET: "e2e-session-secret-0123456789abcdefghijkl",
      ANTHROPIC_API_KEY: "",
    },
  },
});
