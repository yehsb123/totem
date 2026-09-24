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
    // 외부 키·DB 주소는 비워서 개발자 PC 의 apps/api/.env 가 테스트 결과를 바꾸지 못하게 한다
    // (dotenv 는 이미 정의된 변수를 덮어쓰지 않으므로 빈 값으로 고정됨 — CI 와 같은 조건)
    env: {
      NODE_ENV: "test",
      BCRYPT_ROUNDS: "4",
      AUTH_RATE_LIMIT_PER_15MIN: "10000",
      RATE_LIMIT_PER_MINUTE: "100000",
      MONGO_URI: "",
      TOURAPI_SERVICE_KEY: "",
      KAKAO_REST_API_KEY: "",
      KAKAO_CLIENT_SECRET: "",
      KAKAO_REDIRECT_URIS: "",
      JWT_ACCESS_SECRET: "",
      SEED_DEMO_PASSWORD: "",
      CORS_ORIGINS: "",
    },
  },
});
