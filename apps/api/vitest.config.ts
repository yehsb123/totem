import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // 파일마다 별도 프로세스 + 인메모리 MongoDB (mongoose 모델 전역 등록이 파일 간에 섞이지 않게)
    pool: "forks",
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // 테스트는 같은 IP 로 가입·로그인을 반복하므로 인증 rate limit 을 풀고, bcrypt 비용을 낮춘다
    env: { NODE_ENV: "test", BCRYPT_ROUNDS: "4", AUTH_RATE_LIMIT_PER_15MIN: "10000", RATE_LIMIT_PER_MINUTE: "100000" },
  },
});
