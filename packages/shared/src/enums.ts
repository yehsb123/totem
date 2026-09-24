/**
 * 화면에 표시되는 선택지/상태값의 단일 출처.
 * 값(value)은 DB·API 에 저장되는 영문 코드, label 은 화면 표기.
 */

export const USER_ROLES = ["owner", "admin", "member"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  owner: "소유자",
  admin: "관리자",
  member: "멤버",
};

export const USER_STATUSES = ["active", "suspended", "withdrawn"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const AUTH_PROVIDERS = ["local", "kakao"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const PLAN_TIERS = ["free", "premium", "enterprise"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];
export const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  free: "무료",
  premium: "프리미엄",
  enterprise: "엔터프라이즈",
};

export const SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due", "canceled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const PAYMENT_STATUSES = ["paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "결제 완료",
  failed: "결제 실패",
  refunded: "환불",
};

/** 코스메이커 장소 분류 (필터 버튼과 1:1) */
export const PLACE_CATEGORIES = ["attraction", "restaurant", "hotel", "cafe", "etc"] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];
export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  attraction: "관광지",
  restaurant: "식당",
  hotel: "숙소",
  cafe: "카페",
  etc: "기타",
};

export const PLACE_SORTS = ["popularity", "foreignPopularity", "title"] as const;
export type PlaceSort = (typeof PLACE_SORTS)[number];

/** 투어관리 상태 드롭다운 */
export const TOUR_STATUSES = ["planned", "in_progress", "completed", "canceled"] as const;
export type TourStatus = (typeof TOUR_STATUSES)[number];
export const TOUR_STATUS_LABELS: Record<TourStatus, string> = {
  planned: "예정",
  in_progress: "진행중",
  completed: "종료",
  canceled: "취소",
};

export const REVIEW_SOURCES = ["manual", "csv"] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

/** 일정관리 라벨 색상 — 화면은 이 키를 tailwind 클래스로 매핑한다 */
export const LABEL_COLORS = ["blue", "red", "purple", "green", "yellow", "teal", "indigo", "pink", "gray"] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];
export const LABEL_COLOR_LABELS: Record<LabelColor, string> = {
  blue: "파랑색",
  red: "빨강색",
  purple: "보라색",
  green: "초록색",
  yellow: "노랑색",
  teal: "청록색",
  indigo: "남색",
  pink: "분홍색",
  gray: "회색",
};

export const NATIONS = ["KR", "JP", "CN", "TW", "HK", "US", "SEA", "EU", "OTHER"] as const;
export type Nation = (typeof NATIONS)[number];
export const NATION_LABELS: Record<Nation, string> = {
  KR: "한국",
  JP: "일본",
  CN: "중국",
  TW: "대만",
  HK: "홍콩",
  US: "미국",
  SEA: "동남아",
  EU: "유럽",
  OTHER: "기타",
};
