import { env } from "@/lib/env";

/**
 * 사이트 절대 주소 기준 (og:image·canonical·sitemap).
 * NEXT_PUBLIC_SITE_URL 을 우선 쓰고, 비어 있으면 Vercel 이 빌드 때 넣어 주는 운영 도메인으로 대체한다.
 * (둘 다 없으면 localhost 가 박혀 카카오톡·슬랙 미리보기 이미지가 깨진다)
 */
export function siteBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) return env.siteUrl;
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : env.siteUrl;
}

/**
 * 검색엔진에 알릴 공개 페이지 (sitemap.xml). 페이지를 추가·삭제하면 여기도 고친다 —
 * E2E "sitemap" 이 목록의 모든 주소가 200·색인 허용인지, 앱의 공개 페이지가 빠지지 않았는지 검사한다.
 * /invite·/auth/* 는 로그인 흐름 전용(noindex), /features 는 /features/coursemaker 로 영구 이동.
 */
export const PUBLIC_PAGES = [
  "/",
  "/features/coursemaker",
  "/features/schedule",
  "/features/dashboard",
  "/features/tour",
  "/features/review",
  "/pricing",
  "/resources",
  "/resources/guide",
  "/resources/tutorial",
  "/resources/faq",
  "/resources/api",
] as const;
