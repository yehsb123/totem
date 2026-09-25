# Totem 재구성 백로그

- 브랜치: 모든 작업은 `dev` 에서. `main` 머지 = 운영 배포이므로 책임님 확인 후에만.
- 담당: **M** = 메인 세션(totem) · **S** = 서포트 세션(토템 서포트) · **책임님** = 사람이 해야 하는 일
- 상태: ✅ 완료 · 🔄 진행 중 · ⏳ 대기 · ⛔ 막힘(결정 필요)
- 점검에서 나온 오류 번호(S1, C3 …)는 `docs/AUDIT.md` 참고

## 0. 보안 · 구조

| ID | 담당 | 상태 | 내용 |
|---|---|---|---|
| SEC-001 | M | ✅ | 커밋된 `.env`, `node_modules` 추적 해제 (S1, S6) |
| SEC-002 | 책임님 | ⏳ | **유출 키 재발급**: MongoDB 사용자 비밀번호, JWT 두 개, TourAPI 서비스키, 카카오 REST 키 (S1, S2) |
| SEC-003 | 책임님 | ⛔ | git 히스토리에서 `.env` 영구 삭제 여부 결정 (force push 필요 → 결정 후 M 이 수행) |
| STR-001 | M | ✅ | 모노레포 재편 `apps/{web,console,api}` + `packages/shared`, npm workspaces |
| STR-002 | M | ✅ | 공용 API 계약 `@totem/shared` (zod 스키마·타입·경로·HTTP 클라이언트) |

## 1. API (apps/api) — 담당 M

| ID | 상태 | 내용 |
|---|---|---|
| API-010 | ✅ | 서버 골격: env 검증(zod, 운영에서 누락 시 기동 거부), pino 로거, 응답 봉투 `{data,meta}`/`{error}`, 검증 미들웨어, CORS 다중 origin, rate limit, 404/에러 핸들러 |
| API-011 | ✅ | DB 연결: 실패 시 기동 중단, `MONGO_URI` 없으면 개발용 인메모리 Mongo 자동 기동 + 시드 |
| API-020 | ✅ | Mongoose 모델 14종 + 인덱스 (`docs/DATABASE.md`) |
| API-030 | ✅ | 인증: signup · email-check · login · refresh(회전) · logout(세션 폐기) · handoff(web→console) · find-email · kakao |
| API-031 | ✅ | 사용자: `/users/me` 조회·수정, 알림설정, 비밀번호 변경, 탈퇴(soft delete) |
| API-032 | ✅ | 결제정보: 구독 요약, 결제 내역 |
| API-040 | ✅ | 장소: 목록(검색·카테고리·정렬)·상세·TourAPI 동기화(관리자) |
| API-041 | ✅ | 지도 프록시: 카카오 로컬 검색, 카카오모빌리티 길찾기 (키는 서버에만) |
| API-050 | ✅ | 코스: CRUD, 코스 규칙 검증, 저장 시 투어 동시 생성 옵션 |
| API-051 | ✅ | 투어: CRUD, 타입 목록, 목록에 리뷰 통계 포함 |
| API-052 | ✅ | 리뷰: 투어별 목록·등록·삭제, CSV URL 가져오기(허용 호스트 제한) |
| API-060 | ✅ | 일정: 라벨 CRUD(사용 중 삭제 409 / 재지정), 일정 CRUD(기간·검색) |
| API-070 | ✅ | 대시보드: 월 목록·종합 카드·월별 통계 (기존 FE 정적 데이터를 DB 시드로 이관) |
| API-080 | ✅ | 시드: 데모 조직·계정·라벨·장소·코스·투어·리뷰·결제·통계 |
| API-090 | ✅ | 테스트: vitest + supertest + 인메모리 Mongo (인증·권한·조직 격리·코스 규칙) |

## 2. 메인 사이트 (apps/web, Vercel) — 작업 에이전트(격리 워크트리)가 수행, dev 에 머지

| ID | 상태 | 내용 |
|---|---|---|
| WEB-001 | ✅ | 앱 골격: root `layout.tsx`(lang=ko, metadata) + `MarketingShell` 을 레이아웃 컴포넌트로, 경로 `/`, `/pricing`, `/resources/*`, `/features/*` 확정 · 내부 링크 전수 교체(`/mainpage/...` 제거) |
| WEB-002 | ✅ | 로그인·회원가입 모달 → `@totem/shared` 클라이언트 (emailCheck → signup(agreements 포함) / login) → 성공 시 `createHandoff()` → `${NEXT_PUBLIC_CONSOLE_URL}/auth/callback/?code=...` 로 이동 |
| WEB-003 | ✅ | 카카오 로그인: JS SDK `Kakao.Auth.authorize({ redirectUri: ${SITE_URL}/auth/kakao/callback })` → 콜백 페이지에서 `api.auth.kakao({code, redirectUri})` → handoff 이동 |
| WEB-004 | ✅ | 누락 이미지 7건(AUDIT F17): 이미지 받기 전까지 자리표시 컴포넌트, 경로는 `public/images/` 로 통일 |
| WEB-005 | ✅ | vw 단위 인라인 스타일 → Tailwind, 모바일 대응 |
| WEB-006 | ✅ | SEO: 페이지별 metadata, OG 이미지, favicon |
| WEB-007 | ✅ | Vercel: Root Directory `apps/web`, env 3종 등록 방법 문서화 |

## 3. 콘솔 (apps/console, GitHub Pages) — 담당 M (서포트 세션 종료로 메인이 수행)

| ID | 상태 | 내용 |
|---|---|---|
| CON-001 | ✅ | 골격: root layout + `ConsoleShell`, 경로 `/schedule` `/dashboard` `/coursemaker` `/tours` `/reviews` `/settings`, `/` → `/schedule`, `/auth/callback`(handoff 교환), 인증 가드(토큰 없으면 `NEXT_PUBLIC_WEB_URL` 로), 헤더에 실제 사용자명·로그아웃 |
| CON-002 | ✅ | `src/lib/api.ts` 싱글톤 = `createApiClient({ baseUrl: NEXT_PUBLIC_API_BASE_URL, onUnauthorized })` · 구 `services/apiClient.ts`, 각 `*Api.ts`, axios 제거 |
| CON-010 | ✅ | 일정관리 → `api.schedule.*` (id 는 문자열, 색상은 `LabelColor` 키 → tailwind 매핑표), F11·F12 |
| CON-020 | ✅ | 대시보드 → `api.dashboard.*`, `dashboard/data/*` 삭제 |
| CON-030 | ✅ | 코스메이커 → `api.places.list`(검색·카테고리·정렬 연결), 편집은 로컬 상태 → `api.courses.create/update`, `?courseId=` 편집 모드, `DEFAULT_TIME_SLOTS`/`HOTEL_SLOT_INDEX`/`enumerateDates` 공용 사용, F1~F6 |
| CON-040 | ✅ | 투어관리 → `api.tours.*`, 상태·좌석 인라인 PATCH, 필터는 서버 쿼리, F7·F8 |
| CON-050 | ✅ | 리뷰관리 → `tours.list`(reviewStats) + `reviews.*`, CSV 가져오기 결과(성공/실패 행) 표시, PDF 는 `window.print()` 전용 스타일 |
| CON-060 | ✅ | 설정 → `users.me/updateMe/updateNotifications/changePassword/withdraw`, `billing.summary/payments` |
| CON-070 | ✅ | Material Icons 제거 → lucide-react 통일 |
| CON-080 | ✅ | basePath(`/totem`) 하위에서 모든 링크·이미지·라우팅 검증 (`next/link`, `next/image` 만 사용) |

## 4. 환경변수 · 배포 · 문서 — 담당 M

| ID | 상태 | 내용 |
|---|---|---|
| ENV-001 | ✅ | env 전수 정의 `docs/ENV.md` + 앱별 `.env.example` 3개 (S3, F6) |
| OPS-001 | ✅ | CI: PR/`dev` push 에 lint · typecheck · test · build |
| OPS-002 | ✅ | 콘솔 배포: `main` push → 정적 export → GitHub Pages (D1 제거) |
| OPS-003 | 책임님 | 메인 배포: Vercel 프로젝트 연결 (Git 연동, Root `apps/web`) — 절차 docs/DEPLOY.md §2 |
| OPS-004 | ⛔ | **API 배포 대상 결정 필요** (Render / Fly.io / Railway / 사내 VM). 결정 전까지 Dockerfile + 헬스체크만 준비 |
| DOC-001 | ✅ | README 재작성(구조 포함), `docs/API.md`, `docs/DATABASE.md`, `docs/DEPLOY.md` |
| DOC-002 | ✅ | 작업 로그 `docs/WORKLOG.md` (지시사항·결정 누적) |

## 4-1. 의존성

| ID | 담당 | 상태 | 내용 |
|---|---|---|---|
| DEP-001 | M | ✅ | Next 15 → 16 업그레이드 (postcss 취약점 해소, `next lint` 제거 대응 → eslint CLI) |

## 5. 검증 기록 (2026-09-25)

| 항목 | 결과 |
|---|---|
| 타입 검사 (shared·api·web·console) | 통과 |
| API 테스트 (vitest, 인메모리 MongoDB) | 25/25 |
| 빌드 (api·web·console, console basePath=/totem) | 통과 |
| 공용 클라이언트 E2E (라이브 API, 전 화면 흐름) | 17/17 |
| 실제 브라우저 E2E (Chrome: 미로그인 차단 → 메인 로그인 → 콘솔 인계 → 투어·일정·대시보드·코스메이커(드래그·숙소 규칙·저장)·리뷰·설정 → 로그아웃) | 10/10 |
| web 단독 브라우저 E2E (에이전트, 목 API) | 32/32 |
| 남은 후속 | WEB 누락 스크린샷 9장 실제 이미지로 교체 · OG 전용 이미지 · 카카오 로그인 실제 키로 검증 |

## 6. 자율 작업 큐 (2026-09-25 책임님 1박 2일 부재 중, 10분 루프)

지시: "내가 원하는 결과물 꼼꼼하게, 정합성 100%, 필요한 기능 계속 만들어, 묻지 말고 다 작업"
규칙: `dev` 에만 커밋·푸시(작성자 yehsb123, AI 표기 금지) · 매 항목 typecheck·test·build·브라우저 확인 후 커밋 ·
**하지 않음**: main 머지(운영 배포), force push/히스토리 삭제, 키·비밀번호·.env 변경, 외부 서비스 설정 → 해당 사항은 기록만

| 순서 | ID | 상태 | 내용 |
|---|---|---|---|
| 1 | AUTO-01 | ✅ | 브라우저 E2E 를 레포에 정식 편입 (`e2e/`, Playwright) + CI 잡 — 회귀 방지 |
| 2 | AUTO-02 | ✅ | 코스메이커 "내 코스" 목록(불러오기·삭제) — 지금은 투어관리 링크로만 진입 가능 |
| 3 | AUTO-03 | ✅ | 코스메이커 장소 직접 추가: 카카오 로컬 검색(`/maps/local-search`) 결과를 일정에 담기 (키 없으면 안내) |
| 4 | AUTO-04 | ✅ | 코스메이커 일차 동선 요약: 카카오모빌리티 길찾기로 이동거리·시간 (키 없으면 숨김) |
| 5 | AUTO-05 | ✅ | 메인 OG 전용 이미지 (1200×630) |
| 6 | AUTO-06 | ✅ | 콘솔 모바일 레이아웃 점검·수정 (375px) |
| 7 | AUTO-07 | ✅ | API 요청 ID·접근 로그 정리, 404/500 로그 품질 |
| 8 | AUTO-08 | ✅ | 전 화면 정합성 재점검 (화면 문구 ↔ API ↔ DB ↔ 문서) 후 AUDIT 갱신 |
| 9 | AUTO-09 | ✅ | DEP-001 Next 16 업그레이드 — 별도 브랜치에서 전 검증 통과 시에만 dev 머지 |
| 10 | AUTO-10 | ✅ | 조직 멤버 초대·역할 관리 (owner/admin/member 는 모델에만 있고 초대 기능이 없음 — B2B 핵심, AUTO-08 에서 발견) |
| 11 | AUTO-11 | ✅ | 탈퇴 소유자의 조직 데이터 정리 정책 문서화 + 조직 삭제 표시 후 API 접근 차단 확인 |
| 12 | AUTO-12 | ✅ | 관광정보(TourAPI) 동기화 관리자 화면 — API(places.sync)만 있고 화면이 없어 운영에서 실제 장소를 불러올 방법이 없음 (재점검 발견) |
| 13 | AUTO-13 | ✅ | 조용히 잘리는 목록: 리뷰 200건 상한인데 평균을 불러온 것만으로 계산(서버 평균과 불일치), 투어 목록·선택 100건 상한 → 페이지·서버 집계 (재점검 발견) |
| 14 | AUTO-14 | ✅ | 초대 토큰이 URL 경로(GET /auth/invitations/:token)라 접근 로그에 평문으로 남음 → 로그 경로 마스킹 (재점검 3차) |
| 15 | AUTO-15 | ✅ | 시간 검증 느슨함: "24:59" 통과, 시간대 "15:00~09:00" 처럼 끝<시작 허용 (재점검 3차) |
| 16 | AUTO-16 | ✅ | 보안 설계 문서(SECURITY.md): 통제 목록 + 알려진 맞교환(refresh token 을 localStorage 에 보관 → XSS 시 탈취 가능, 회전·재사용 탐지로 완화) (재점검 3차) |
| 17 | AUTO-17 | ✅ | 프런트 CSP (SECURITY R2) — web 응답 헤더, console meta. connect-src 를 API 로 제한해 XSS 시 토큰 외부 유출 차단 (재점검 4차) |
| 18 | AUTO-18 | ✅ | 콘솔 일정관리·코스메이커가 셸 `<main>` 안에 `<main>` 을 또 둠(랜드마크 중복, 화면 읽기 프로그램 혼란) → section + aria-label. 인쇄 시 안쪽 스크롤 영역이 잘리지 않게 (AUTO-17 브라우저 점검 중 발견) |
| 19 | AUTO-19 | ✅ | 보안: `SEED_ON_EMPTY` 로 영속 DB(운영 아님)에 기동하면 알려진 비밀번호 `demo1234` 로 데모 계정 생성 — 문서·주석은 "비우면 미생성" (재점검 5차) |
| 20 | AUTO-20 | ✅ | 날짜: 리뷰 제출일·결제일을 UTC 로 잘라 표시(오전 9시 전 하루 전 날짜), 시드 "오늘" 투어도 UTC (재점검 5차) |
| 21 | AUTO-21 | ✅ | 문구: 알림 설정이 없는 발송 기능을 약속, 결제 내역 24건에서 잘림 안내 없음, "관광지 추천"(추천 기능 없음) (재점검 5차) |
| 22 | AUTO-22 | ✅ | 문서↔코드: API 오류표(410·422)·목록 크기·속도 제한, DATABASE(purgedAt·인덱스·provider·source·인계 코드 삭제·결제 5년 삭제 미구현), ENV(VERCEL_URL) (재점검 5차) |
| 23 | AUTO-23 | ✅ | 권한: 관리자는 관리자 초대를 만들 수 없는데 취소는 가능, 같은 이메일을 멤버로 재초대해 소유자의 관리자 초대를 무효화 가능 (재점검 6차) |
| 24 | AUTO-24 | ✅ | 소유권 이전 뒤 "새로고침하면 권한이 반영됩니다" — 화면이 계속 소유자 버튼을 보여 누르면 403. 이전 직후 세션 갱신 + E2E (재점검 6차) |
| 25 | AUTO-25 | ✅ | 세션: 콘솔 탭 여러 개가 동시에 만료되면 같은 refresh token 으로 각각 갱신 → 서버가 재사용(탈취)으로 판단해 **전 세션 폐기**(강제 로그아웃). refresh 중 네트워크 오류·5xx 도 로그아웃 처리 (재점검 7차) |
