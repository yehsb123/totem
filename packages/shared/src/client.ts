import type { ApiErrorBody, ApiSuccess, ErrorCode, PageMeta } from "./common";
import type {
  AuthSession,
  AuthTokens,
  EmailCheckRequest,
  EmailCheckResponse,
  FindEmailRequest,
  FindEmailResponse,
  HandoffCodeResponse,
  KakaoLoginRequest,
  LoginRequest,
  SignupRequest,
} from "./auth";
import type {
  ChangePasswordRequest,
  UpdateNotificationsRequest,
  UpdateProfileRequest,
  UserProfile,
  WithdrawRequest,
} from "./users";
import type { BillingSummary, Payment } from "./billing";
import type {
  AcceptInvitationRequest,
  CreateInvitationRequest,
  CreatedInvitation,
  Invitation,
  InvitationPreview,
  Member,
  TransferOwnershipRequest,
  UpdateMemberRequest,
} from "./members";
import type {
  DirectionsRequest,
  DirectionsResult,
  LocalSearchItem,
  LocalSearchQuery,
  Place,
  PlaceListQuery,
  PlaceSyncRequest,
  PlaceSyncResult,
  PlaceSyncStatus,
} from "./places";
import type { Course, CourseListQuery, CourseSummary, CreateCourseRequest, UpdateCourseRequest } from "./courses";
import type { CreateTourRequest, Tour, TourListQuery, UpdateTourRequest } from "./tours";
import type { CreateReviewRequest, ImportReviewsResult, Review, ReviewListQuery, ReviewSummary } from "./reviews";
import type {
  CreateEventRequest,
  EventListQuery,
  ScheduleEvent,
  ScheduleLabel,
  UpdateEventRequest,
  UpsertLabelRequest,
} from "./schedules";
import type { DashboardMonths, DashboardOverview, DashboardQuery, MonthlyTourismStats, OverviewQuery } from "./dashboard";
import { API_PREFIX, ROUTES } from "./routes";

/** 서버가 { error } 로 응답했거나 네트워크가 실패했을 때 던지는 오류 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode | "NETWORK_ERROR",
    message: string,
    public readonly details?: unknown,
    /** 문의할 때 알려주면 서버 로그에서 바로 찾을 수 있는 ID */
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 화면에 보여줄 오류 문구 (web·console 공통).
 * 서버 오류(5xx)면 "오류 ID" 를 덧붙인다 — 사용자가 이 값을 알려주면 서버 로그(X-Request-Id)에서 바로 찾을 수 있다.
 */
export function describeApiError(e: unknown, fallback = "알 수 없는 오류가 발생했습니다."): string {
  if (e instanceof ApiError) {
    const msg = e.message || fallback;
    return e.status >= 500 && e.requestId ? `${msg} (오류 ID: ${e.requestId.slice(0, 8)})` : msg;
  }
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

export interface TokenStore {
  get(): AuthTokens | null;
  set(tokens: AuthTokens): void;
  clear(): void;
}

const STORAGE_KEY = "totem.auth";

/** 브라우저 localStorage 기반 토큰 저장소 (SSR 에서는 항상 비어 있음) */
export const browserTokenStore: TokenStore = {
  get() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthTokens) : null;
    } catch {
      return null;
    }
  },
  set(tokens) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};

export interface ApiClientOptions {
  /** 예: https://api.totem.example.com (끝의 / 없이). API_PREFIX 는 자동으로 붙는다 */
  baseUrl: string;
  tokenStore?: TokenStore;
  /** refresh 까지 실패해 재로그인이 필요할 때 호출 (로그인 화면으로 보내기 등) */
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  /** false 면 Authorization 헤더를 붙이지 않고 401 시 refresh 도 하지 않는다 */
  auth?: boolean;
}

export interface Paged<T> {
  items: T;
  meta: PageMeta;
}

function toQueryString(query?: Query): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

type RefreshResult = "ok" | "invalid" | "network";
/** 탭 사이 refresh 직렬화용 Web Locks 이름 */
const REFRESH_LOCK = "totem.auth.refresh";

export function createApiClient(options: ApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "") + API_PREFIX;
  const store = options.tokenStore ?? browserTokenStore;
  const doFetch = options.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  // 동시에 여러 요청이 401 을 받아도 refresh 는 한 번만 한다 (탭 안)
  let refreshing: Promise<RefreshResult> | null = null;

  /**
   * refresh token 은 1회용(회전)이고, 이미 교체된 토큰이 다시 오면 서버는 탈취로 보고 **모든 세션을 폐기**한다.
   * 콘솔 탭 여러 개는 localStorage 의 같은 토큰을 쓰므로 탭끼리도 겹치면 안 된다:
   *  1) Web Locks 로 탭 사이에서도 한 번에 하나만 refresh
   *  2) 락을 잡은 뒤 저장된 access token 이 실패한 요청의 것과 다르면 → 다른 탭(또는 앞 요청)이 이미 교체함 → 그대로 재시도
   * 네트워크 오류·5xx 는 로그아웃 사유가 아니다 ("network") — 서버가 refresh 를 거절(4xx)할 때만 "invalid".
   */
  async function refreshTokens(usedAccessToken: string | undefined): Promise<RefreshResult> {
    const run = async (): Promise<RefreshResult> => {
      const current = store.get();
      if (!current?.refreshToken) return "invalid";
      if (usedAccessToken && current.accessToken !== usedAccessToken) return "ok";
      let res: Response;
      try {
        res = await doFetch(`${baseUrl}${ROUTES.auth.refresh}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: current.refreshToken }),
        });
      } catch {
        return "network";
      }
      if (res.status >= 500) return "network";
      if (!res.ok) return "invalid";
      const json = (await res.json().catch(() => null)) as ApiSuccess<AuthTokens> | null;
      if (!json?.data?.accessToken) return "network";
      store.set(json.data);
      return "ok";
    };
    const locks = typeof navigator !== "undefined" ? (navigator as Navigator & { locks?: LockManager }).locks : undefined;
    return locks ? locks.request(REFRESH_LOCK, run) : run();
  }

  async function raw<T>(method: string, path: string, opts: RequestOptions = {}, retried = false): Promise<ApiSuccess<T>> {
    const useAuth = opts.auth !== false;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    const tokens = useAuth ? store.get() : null;
    if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;

    let res: Response;
    try {
      res = await doFetch(`${baseUrl}${path}${toQueryString(opts.query)}`, {
        method,
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      });
    } catch (e) {
      throw new ApiError(0, "NETWORK_ERROR", "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.", e);
    }

    if (res.status === 401 && useAuth && !retried) {
      refreshing ??= refreshTokens(tokens?.accessToken).finally(() => {
        refreshing = null;
      });
      const result = await refreshing;
      if (result === "ok") return raw<T>(method, path, opts, true);
      if (result === "network") throw new ApiError(0, "NETWORK_ERROR", "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
      store.clear();
      options.onUnauthorized?.();
    }

    if (res.status === 204) return { data: undefined as T };

    const json = (await res.json().catch(() => null)) as ApiSuccess<T> | ApiErrorBody | null;
    if (!res.ok || !json || "error" in json) {
      const err = json && "error" in json ? json.error : null;
      throw new ApiError(
        res.status,
        err?.code ?? "INTERNAL_ERROR",
        err?.message ?? `요청 실패 (${res.status})`,
        err?.details,
        err?.requestId ?? res.headers.get("x-request-id") ?? undefined,
      );
    }
    return json;
  }

  const get = async <T>(path: string, query?: Query, auth?: boolean) => (await raw<T>("GET", path, { query, auth })).data;
  const paged = async <T>(path: string, query?: Query): Promise<Paged<T>> => {
    const r = await raw<T>("GET", path, { query });
    return { items: r.data, meta: r.meta! };
  };
  const send = async <T>(method: "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown, auth?: boolean) =>
    (await raw<T>(method, path, { body, auth })).data;

  const saveSession = (s: AuthTokens) => {
    store.set({ accessToken: s.accessToken, refreshToken: s.refreshToken, expiresIn: s.expiresIn });
  };

  return {
    tokens: store,
    isLoggedIn: () => store.get() !== null,

    auth: {
      emailCheck: (body: EmailCheckRequest) => send<EmailCheckResponse>("POST", ROUTES.auth.emailCheck, body, false),
      signup: async (body: SignupRequest) => {
        const s = await send<AuthSession>("POST", ROUTES.auth.signup, body, false);
        saveSession(s);
        return s;
      },
      login: async (body: LoginRequest) => {
        const s = await send<AuthSession>("POST", ROUTES.auth.login, body, false);
        saveSession(s);
        return s;
      },
      kakao: async (body: KakaoLoginRequest) => {
        const s = await send<AuthSession>("POST", ROUTES.auth.kakao, body, false);
        saveSession(s);
        return s;
      },
      /** web → console 이동용 1회용 코드 발급 (로그인 상태 필요) */
      createHandoff: () => send<HandoffCodeResponse>("POST", ROUTES.auth.handoff),
      /** console 진입 시 코드 → 토큰 교환 */
      exchangeHandoff: async (code: string) => {
        const s = await send<AuthSession>("POST", ROUTES.auth.handoffExchange, { code }, false);
        saveSession(s);
        return s;
      },
      logout: async () => {
        const t = store.get();
        store.clear();
        if (t) await send<void>("POST", ROUTES.auth.logout, { refreshToken: t.refreshToken }, false).catch(() => undefined);
      },
      findEmail: (body: FindEmailRequest) => send<FindEmailResponse>("POST", ROUTES.auth.findEmail, body, false),
      /** 초대 링크 확인 (로그인 불필요) */
      previewInvitation: (token: string) => get<InvitationPreview>(ROUTES.auth.invitation(encodeURIComponent(token)), undefined, false),
      /** 초대 수락 → 그 조직 계정으로 로그인 */
      acceptInvitation: async (body: AcceptInvitationRequest) => {
        const s = await send<AuthSession>("POST", ROUTES.auth.acceptInvitation, body, false);
        saveSession(s);
        return s;
      },
    },

    org: {
      members: () => get<Member[]>(ROUTES.org.members),
      updateMember: (id: string, body: UpdateMemberRequest) => send<Member>("PATCH", ROUTES.org.member(id), body),
      removeMember: (id: string) => send<void>("DELETE", ROUTES.org.member(id)),
      transferOwnership: (body: TransferOwnershipRequest) => send<Member[]>("POST", ROUTES.org.transferOwnership, body),
      invitations: () => get<Invitation[]>(ROUTES.org.invitations),
      invite: (body: CreateInvitationRequest) => send<CreatedInvitation>("POST", ROUTES.org.invitations, body),
      revokeInvitation: (id: string) => send<void>("DELETE", ROUTES.org.invitation(id)),
    },

    users: {
      me: () => get<UserProfile>(ROUTES.users.me),
      updateMe: (body: UpdateProfileRequest) => send<UserProfile>("PATCH", ROUTES.users.me, body),
      updateNotifications: (body: UpdateNotificationsRequest) => send<UserProfile>("PATCH", ROUTES.users.notifications, body),
      changePassword: (body: ChangePasswordRequest) => send<void>("PUT", ROUTES.users.password, body),
      withdraw: async (body: WithdrawRequest) => {
        await send<void>("DELETE", ROUTES.users.me, body);
        store.clear();
      },
    },

    billing: {
      summary: () => get<BillingSummary>(ROUTES.billing.summary),
      payments: (query?: { page?: number; limit?: number }) => paged<Payment[]>(ROUTES.billing.payments, query),
    },

    places: {
      list: (query?: Partial<PlaceListQuery>) => paged<Place[]>(ROUTES.places.list, query),
      get: (id: string) => get<Place>(ROUTES.places.detail(id)),
      sync: (body: PlaceSyncRequest = {}) => send<PlaceSyncResult>("POST", ROUTES.places.sync, body),
      syncStatus: (areaCode = "39") => get<PlaceSyncStatus>(ROUTES.places.syncStatus, { areaCode }),
    },

    maps: {
      localSearch: (query: LocalSearchQuery) => get<LocalSearchItem[]>(ROUTES.maps.localSearch, query as Query),
      directions: (body: DirectionsRequest) => send<DirectionsResult>("POST", ROUTES.maps.directions, body),
    },

    courses: {
      list: (query?: CourseListQuery) => paged<CourseSummary[]>(ROUTES.courses.list, query),
      get: (id: string) => get<Course>(ROUTES.courses.detail(id)),
      create: (body: CreateCourseRequest) => send<{ course: Course; tour: Tour | null }>("POST", ROUTES.courses.list, body),
      update: (id: string, body: UpdateCourseRequest) => send<Course>("PUT", ROUTES.courses.detail(id), body),
      remove: (id: string) => send<void>("DELETE", ROUTES.courses.detail(id)),
    },

    tours: {
      list: (query?: TourListQuery) => paged<Tour[]>(ROUTES.tours.list, query as Query),
      types: () => get<string[]>(ROUTES.tours.types),
      get: (id: string) => get<Tour>(ROUTES.tours.detail(id)),
      create: (body: CreateTourRequest) => send<Tour>("POST", ROUTES.tours.list, body),
      update: (id: string, body: UpdateTourRequest) => send<Tour>("PATCH", ROUTES.tours.detail(id), body),
      remove: (id: string) => send<void>("DELETE", ROUTES.tours.detail(id)),
    },

    reviews: {
      listByTour: (tourId: string, query?: ReviewListQuery) => paged<Review[]>(ROUTES.tours.reviews(tourId), query),
      summary: (tourId: string) => get<ReviewSummary>(ROUTES.tours.reviewSummary(tourId)),
      create: (tourId: string, body: CreateReviewRequest) => send<Review>("POST", ROUTES.tours.reviews(tourId), body),
      importCsv: (tourId: string, csvUrl: string) =>
        send<ImportReviewsResult>("POST", ROUTES.tours.reviewImport(tourId), { csvUrl }),
      remove: (id: string) => send<void>("DELETE", ROUTES.reviews.detail(id)),
    },

    schedule: {
      events: (query?: EventListQuery) => get<ScheduleEvent[]>(ROUTES.schedule.events, query as Query),
      event: (id: string) => get<ScheduleEvent>(ROUTES.schedule.event(id)),
      createEvent: (body: CreateEventRequest) => send<ScheduleEvent>("POST", ROUTES.schedule.events, body),
      updateEvent: (id: string, body: UpdateEventRequest) => send<ScheduleEvent>("PATCH", ROUTES.schedule.event(id), body),
      removeEvent: (id: string) => send<void>("DELETE", ROUTES.schedule.event(id)),
      labels: () => get<ScheduleLabel[]>(ROUTES.schedule.labels),
      label: (id: string) => get<ScheduleLabel>(ROUTES.schedule.label(id)),
      createLabel: (body: UpsertLabelRequest) => send<ScheduleLabel>("POST", ROUTES.schedule.labels, body),
      updateLabel: (id: string, body: UpsertLabelRequest) => send<ScheduleLabel>("PUT", ROUTES.schedule.label(id), body),
      /** 사용 중인 라벨은 409(CONFLICT). reassignTo 를 주면 해당 라벨로 옮긴 뒤 삭제 */
      removeLabel: (id: string, reassignTo?: string) =>
        raw<void>("DELETE", ROUTES.schedule.label(id), { query: { reassignTo } }).then(() => undefined),
    },

    dashboard: {
      months: (region = "jeju") => get<DashboardMonths>(ROUTES.dashboard.months, { region }),
      overview: (query: OverviewQuery) => get<DashboardOverview>(ROUTES.dashboard.overview, query as Query),
      stats: (query?: DashboardQuery) => get<MonthlyTourismStats[]>(ROUTES.dashboard.stats, query as Query),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
