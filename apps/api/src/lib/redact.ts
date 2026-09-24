/**
 * 접근 로그에 남기기 전에 URL 안의 비밀값을 가린다.
 * - 경로: /auth/invitations/<초대 토큰> (수락용 /accept 는 그대로)
 * - 쿼리: token·code·refreshToken 값
 * 로그를 볼 수 있는 사람이 초대 링크를 가로채 남의 조직에 가입하는 것을 막는다.
 */
const SECRET_QUERY = /([?&](?:token|code|refreshToken)=)[^&#]*/gi;
const INVITATION_PATH = /(\/auth\/invitations\/)(?!accept(?:[/?#]|$))[^/?#]+/g;

export function redactUrl(url: string | undefined): string {
  if (!url) return "";
  return url.replace(INVITATION_PATH, "$1[REDACTED]").replace(SECRET_QUERY, "$1[REDACTED]");
}
