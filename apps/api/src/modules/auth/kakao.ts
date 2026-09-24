import { env } from "../../config/env";
import { HttpError, badRequest, notConfigured, upstream } from "../../lib/http";

export interface KakaoUser {
  id: string;
  nickname: string | null;
  email: string | null;
  emailVerified: boolean;
}

const TIMEOUT_MS = 8000;

/**
 * 인가 코드 → 카카오 access token → 사용자 정보.
 * redirectUri 는 카카오 콘솔 등록값과 같아야 하고, 서버 허용 목록(KAKAO_REDIRECT_URIS)에도 있어야 한다.
 */
export async function fetchKakaoUser(code: string, redirectUri: string): Promise<KakaoUser> {
  if (!env.KAKAO_REST_API_KEY) throw notConfigured("카카오 로그인(KAKAO_REST_API_KEY)");
  const normalized = redirectUri.replace(/\/+$/, "");
  if (!env.KAKAO_REDIRECT_URIS.includes(normalized)) throw badRequest("허용되지 않은 redirectUri 입니다.");

  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: env.KAKAO_REST_API_KEY,
    redirect_uri: redirectUri,
    code,
  });
  if (env.KAKAO_CLIENT_SECRET) form.set("client_secret", env.KAKAO_CLIENT_SECRET);

  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => {
    throw upstream("카카오 서버에 연결할 수 없습니다.");
  });
  if (!tokenRes.ok) throw new HttpError(401, "UNAUTHORIZED", "카카오 인증 코드가 유효하지 않습니다. 다시 시도해주세요.");
  const { access_token: accessToken } = (await tokenRes.json()) as { access_token: string };

  const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => {
    throw upstream("카카오 서버에 연결할 수 없습니다.");
  });
  if (!meRes.ok) throw upstream("카카오 사용자 정보를 가져오지 못했습니다.");
  const me = (await meRes.json()) as {
    id: number;
    kakao_account?: {
      email?: string;
      is_email_valid?: boolean;
      is_email_verified?: boolean;
      profile?: { nickname?: string };
    };
    properties?: { nickname?: string };
  };

  const acc = me.kakao_account ?? {};
  const emailOk = !!acc.email && acc.is_email_valid !== false;
  return {
    id: String(me.id),
    nickname: acc.profile?.nickname ?? me.properties?.nickname ?? null,
    email: emailOk ? acc.email!.toLowerCase() : null,
    emailVerified: emailOk && acc.is_email_verified === true,
  };
}
