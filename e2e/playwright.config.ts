import { defineConfig, devices } from "@playwright/test";

/**
 * 세 앱(api·web·console)을 개발 서버로 띄우고 실제 브라우저로 전체 흐름을 검증한다.
 * api 는 MONGO_URI 를 비워 인메모리 MongoDB + 데모 데이터(demo@totem.dev / demo1234)로 뜬다.
 * 로컬: 이미 떠 있는 서버가 있으면 재사용. CI: 새로 띄운다.
 * 브라우저: 로컬은 설치된 Chrome(E2E_CHANNEL=chrome), CI 는 playwright 번들 chromium.
 */
const CI = !!process.env.CI;
const root = "..";

export default defineConfig({
  testDir: "./tests",
  // 데모 데이터를 순서대로 만지므로 병렬 금지
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "ko-KR",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
    channel: process.env.E2E_CHANNEL || undefined,
  },
  webServer: [
    {
      command: "npm run dev -w @totem/api",
      cwd: root,
      url: "http://localhost:8000/api/v1/health",
      env: { MONGO_URI: "", LOG_LEVEL: "warn", AUTH_RATE_LIMIT_PER_15MIN: "1000" },
      reuseExistingServer: !CI,
      timeout: 180_000,
    },
    {
      command: "npm run dev -w @totem/web",
      cwd: root,
      url: "http://localhost:3100",
      env: { NEXT_TELEMETRY_DISABLED: "1" },
      reuseExistingServer: !CI,
      timeout: 180_000,
    },
    {
      command: "npm run dev -w @totem/console",
      cwd: root,
      url: "http://localhost:3200",
      env: { NEXT_TELEMETRY_DISABLED: "1" },
      reuseExistingServer: !CI,
      timeout: 180_000,
    },
  ],
});
