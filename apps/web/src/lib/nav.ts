/** 서비스 소개 메뉴 — 헤더 드롭다운과 /features 탭이 함께 쓴다 */
export const FEATURE_LINKS = [
  { label: "코스메이커", href: "/features/coursemaker" },
  { label: "대시보드", href: "/features/dashboard" },
  { label: "투어관리", href: "/features/tour" },
  { label: "일정관리", href: "/features/schedule" },
  { label: "리뷰관리", href: "/features/review" },
] as const;

export const MAIN_LINKS = [
  { label: "가격안내", href: "/pricing" },
  { label: "리소스", href: "/resources" },
] as const;
