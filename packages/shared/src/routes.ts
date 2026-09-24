/**
 * API 경로의 단일 출처. 서버 라우터와 클라이언트가 같은 상수를 쓴다.
 * 모든 경로는 API_PREFIX 아래에 붙는다.
 */
export const API_PREFIX = "/api/v1";

export const ROUTES = {
  health: "/health",

  auth: {
    signup: "/auth/signup",
    emailCheck: "/auth/email-check",
    login: "/auth/login",
    kakao: "/auth/kakao",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    handoff: "/auth/handoff",
    handoffExchange: "/auth/handoff/exchange",
    findEmail: "/auth/find-email",
    invitation: (token: string) => `/auth/invitations/${token}`,
    acceptInvitation: "/auth/invitations/accept",
  },

  org: {
    members: "/org/members",
    member: (id: string) => `/org/members/${id}`,
    transferOwnership: "/org/transfer-ownership",
    invitations: "/org/invitations",
    invitation: (id: string) => `/org/invitations/${id}`,
  },

  users: {
    me: "/users/me",
    notifications: "/users/me/notifications",
    password: "/users/me/password",
  },

  billing: {
    summary: "/billing",
    payments: "/billing/payments",
  },

  places: {
    list: "/places",
    detail: (id: string) => `/places/${id}`,
    sync: "/places/sync",
    syncStatus: "/places/sync-status",
  },

  maps: {
    localSearch: "/maps/local-search",
    directions: "/maps/directions",
  },

  courses: {
    list: "/courses",
    detail: (id: string) => `/courses/${id}`,
  },

  tours: {
    list: "/tours",
    types: "/tours/types",
    detail: (id: string) => `/tours/${id}`,
    reviews: (tourId: string) => `/tours/${tourId}/reviews`,
    reviewImport: (tourId: string) => `/tours/${tourId}/reviews/import`,
    reviewSummary: (tourId: string) => `/tours/${tourId}/reviews/summary`,
  },

  reviews: {
    detail: (id: string) => `/reviews/${id}`,
  },

  schedule: {
    events: "/schedule/events",
    event: (id: string) => `/schedule/events/${id}`,
    labels: "/schedule/labels",
    label: (id: string) => `/schedule/labels/${id}`,
  },

  dashboard: {
    months: "/dashboard/months",
    overview: "/dashboard/overview",
    stats: "/dashboard/stats",
  },
} as const;
