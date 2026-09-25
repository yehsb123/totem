/** 서비스 소개 메뉴 — 헤더 드롭다운과 /features 탭이 함께 쓴다 */
export const FEATURE_LINKS = [
  { label: "코스메이커", href: "/features/coursemaker" },
  { label: "대시보드", href: "/features/dashboard" },
  { label: "투어관리", href: "/features/tour" },
  { label: "일정관리", href: "/features/schedule" },
  { label: "리뷰관리", href: "/features/review" },
] as const;

export const MAIN_LINKS = [
  { label: "요금제", href: "/pricing" }, // 페이지 제목("요금제 안내")·콘솔 안내 문구와 같은 이름
  { label: "리소스", href: "/resources" },
] as const;
