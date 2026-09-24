import { z } from "zod";
import { passwordSchema as password } from "./common";
import type { UserProfile } from "./users";

const email = z.string().trim().toLowerCase().email("이메일 형식이 올바르지 않습니다.");

/** 회원가입 모달 3단계(이메일 → 정보 → 약관) 최종 제출 */
export const signupRequest = z.object({
  email,
  password,
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(50),
  companyName: z.string().trim().min(1, "회사 이름을 입력해주세요.").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9\-+() ]{8,20}$/, "전화번호 형식이 올바르지 않습니다.")
    .optional(),
  agreements: z.object({
    terms: z.literal(true, { errorMap: () => ({ message: "이용약관에 동의해주세요." }) }),
    privacy: z.literal(true, { errorMap: () => ({ message: "개인정보 처리방침에 동의해주세요." }) }),
    marketing: z.boolean().default(false),
  }),
});
export type SignupRequest = z.infer<typeof signupRequest>;

/** 회원가입 1단계 — 이메일 중복 확인 */
export const emailCheckRequest = z.object({ email });
export type EmailCheckRequest = z.infer<typeof emailCheckRequest>;
export interface EmailCheckResponse {
  available: boolean;
}

export const loginRequest = z.object({
  email,
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});
export type LoginRequest = z.infer<typeof loginRequest>;

export const kakaoLoginRequest = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url(),
});
export type KakaoLoginRequest = z.infer<typeof kakaoLoginRequest>;

export const refreshRequest = z.object({ refreshToken: z.string().min(1) });
export type RefreshRequest = z.infer<typeof refreshRequest>;

export const logoutRequest = z.object({ refreshToken: z.string().min(1) });
export type LogoutRequest = z.infer<typeof logoutRequest>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** access token 만료까지 남은 초 */
  expiresIn: number;
}

export interface AuthSession extends AuthTokens {
  user: UserProfile;
}

/**
 * 메인(web, Vercel) → 콘솔(console, GitHub Pages) 은 도메인이 달라 localStorage 를 공유할 수 없다.
 * web 에서 로그인 후 1회용 코드를 발급받아 콘솔 URL 로 넘기고, 콘솔이 코드를 토큰으로 교환한다.
 */
export interface HandoffCodeResponse {
  code: string;
  /** 코드 만료까지 남은 초 */
  expiresIn: number;
}
export const handoffExchangeRequest = z.object({ code: z.string().min(16) });
export type HandoffExchangeRequest = z.infer<typeof handoffExchangeRequest>;

export const findEmailRequest = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(8),
});
export type FindEmailRequest = z.infer<typeof findEmailRequest>;
export interface FindEmailResponse {
  /** 마스킹된 이메일 (abc***@gmail.com) */
  maskedEmail: string;
}
