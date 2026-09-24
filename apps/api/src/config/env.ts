import "dotenv/config";
import { z } from "zod";

/**
 * API 서버 환경변수의 단일 정의. 여기 없는 값은 코드에서 읽지 않는다.
 * 설명·예시·어디에 등록하는지는 docs/ENV.md 참고.
 */
const csv = z
  .string()
  .default("")
  .transform((v) =>
    v
      .split(",")
      .map((s) => s.trim().replace(/\/+$/, ""))
      .filter(Boolean),
  );

const bool = z
  .enum(["true", "false", "1", "0", ""])
  .default("")
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(8000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  /** 리버스 프록시(Render·Fly·Nginx) 뒤라면 1 — rate limit 이 실제 클라이언트 IP 를 보게 한다 */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  /** 비우면 개발/테스트에서 인메모리 MongoDB 를 띄운다 (운영에서는 필수) */
  MONGO_URI: z.string().default(""),
  MONGO_DB_NAME: z.string().default("totem"),
  /** DB 가 비어 있으면 데모 데이터를 넣는다 (개발 전용) */
  SEED_ON_EMPTY: bool,

  /** 브라우저 호출을 허용할 출처 (web·console). 쉼표 구분, 끝 / 없이 */
  CORS_ORIGINS: csv,

  JWT_ACCESS_SECRET: z.string().default(""),
  /** access token 수명 (jsonwebtoken 형식: 15m, 1h …) */
  JWT_ACCESS_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(14),
  /** web → console 로그인 인계 코드 수명(초) */
  AUTH_HANDOFF_TTL_SECONDS: z.coerce.number().int().min(10).max(600).default(60),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(300),
  AUTH_RATE_LIMIT_PER_15MIN: z.coerce.number().int().min(1).default(30),

  /** 한국관광공사 TourAPI (공공데이터포털 서비스키, Decoding 값) */
  TOURAPI_SERVICE_KEY: z.string().default(""),
  TOURAPI_BASE_URL: z.string().url().default("https://apis.data.go.kr/B551011/KorService2"),

  /** 공용 장소 데이터(TourAPI) 동기화 간 최소 간격(시간) — 아무 조직 관리자나 반복 호출해 호출 한도를 소진하지 못하게 */
  PLACE_SYNC_COOLDOWN_HOURS: z.coerce.number().min(0).max(720).default(6),

  /** 카카오 REST API 키 — 로컬 검색·길찾기·카카오 로그인 토큰 교환에 사용 (서버 전용) */
  KAKAO_REST_API_KEY: z.string().default(""),
  /** 카카오 로그인 보안 > Client Secret 을 켰다면 입력 */
  KAKAO_CLIENT_SECRET: z.string().default(""),
  /** 카카오 로그인 redirect_uri 로 허용할 주소 (쉼표 구분) — 임의 주소로의 코드 교환 방지 */
  KAKAO_REDIRECT_URIS: csv,

  /** 리뷰 CSV 가져오기 허용 호스트 (SSRF 방지) */
  REVIEW_IMPORT_ALLOWED_HOSTS: csv.default("docs.google.com,googleusercontent.com"),
  REVIEW_IMPORT_MAX_BYTES: z.coerce.number().int().default(2_000_000),

  /** 삭제 표시된 조직을 영구 삭제하기까지의 유예 일수 (npm run purge) — 기간은 책임님 결정 사항 */
  ORG_PURGE_AFTER_DAYS: z.coerce.number().int().min(1).max(3650).default(30),

  /** 시드 데모 계정 비밀번호 (비우면 시드가 데모 계정을 만들지 않는다) */
  SEED_DEMO_PASSWORD: z.string().default(""),
});

export type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`환경변수 오류:\n${lines.join("\n")}`);
  }
  const env = parsed.data;
  const missing: string[] = [];

  if (env.NODE_ENV === "production") {
    if (!env.MONGO_URI) missing.push("MONGO_URI");
    if (env.JWT_ACCESS_SECRET.length < 32) missing.push("JWT_ACCESS_SECRET (32자 이상)");
    if (env.CORS_ORIGINS.length === 0) missing.push("CORS_ORIGINS");
  } else if (!env.JWT_ACCESS_SECRET) {
    // 개발·테스트 전용 기본값. 운영에서는 위에서 기동을 거부한다.
    env.JWT_ACCESS_SECRET = "dev-only-access-secret-change-me-0000000";
  }
  if (env.NODE_ENV !== "production" && env.CORS_ORIGINS.length === 0) {
    env.CORS_ORIGINS = ["http://localhost:3100", "http://localhost:3200"];
  }

  if (missing.length) {
    throw new Error(`운영 모드 필수 환경변수가 없습니다: ${missing.join(", ")}`);
  }
  return env;
}

export const env = load();
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
