import { createApiClient } from "@totem/shared";
import { env } from "./env";

/** 메인 사이트 전용 API 클라이언트. 토큰은 브라우저 localStorage 에 저장된다. */
export const api = createApiClient({ baseUrl: env.apiBaseUrl });
