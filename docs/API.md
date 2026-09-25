# API

- 기본 경로: `{API 주소}/api/v1`
- 계약(요청·응답 타입, 검증 규칙)의 단일 출처: `packages/shared/src` — 서버는 이 zod 스키마로 검증하고, 화면은 같은 스키마로 먼저 검증한 뒤 `createApiClient()` 로 호출한다. **경로·필드를 바꿀 때는 shared 만 고치면 양쪽이 타입 오류로 알려준다.**
- 인증: `Authorization: Bearer <accessToken>` (15분). 만료되면 클라이언트가 `POST /auth/refresh` 로 자동 갱신 후 재시도.

## 응답 형식

```jsonc
// 성공
{ "data": { ... } }
{ "data": [ ... ], "meta": { "page": 1, "limit": 20, "total": 53, "totalPages": 3 } }   // 목록
// 실패
{ "error": { "code": "VALIDATION_ERROR", "message": "종료일은 시작일과 같거나 이후여야 합니다.", "details": { "fields": [{ "path": "endDate", "message": "…" }] }, "requestId": "3f2a…" } }
```

**요청 ID**: 모든 응답에 `X-Request-Id` 헤더(앞단이 준 값이 `[A-Za-z0-9._-]{8,64}` 이면 이어 씀, 아니면 새 UUID), 모든 오류 본문에 `error.requestId`.
화면은 5xx 일 때 "(오류 ID: 앞 8자리)" 를 보여준다 (`describeApiError`). 로그 찾기: 서버 로그에서 그 값으로 검색.
접근 로그: 5xx=error · 4xx=warn · 나머지 info, 인증된 요청은 `userId`·`orgId` 포함, 헬스체크 제외. URL 안의 초대 토큰(경로)·`token`/`code`/`refreshToken` 쿼리 값은 `[REDACTED]` 로 가려 남긴다.

**목록 페이지 크기**(`?page=&limit=`): 기본 20·최대 100 이 원칙이고, 화면 사용량에 맞춘 예외는 아래와 같다.

| 목록 | 기본 | 최대 |
|---|---|---|
| 장소 `/places` | 50 | 200 |
| 투어 `/tours` | 50 | 100 |
| 리뷰 `/tours/:tourId/reviews` | 100 | 200 |
| 일정 `/schedule/events` | 페이지 없음 (기간 조회) | 1,000건 상한 |
| 대기 초대 `/org/invitations` | 페이지 없음 | 100건 상한 |

**속도 제한 (IP 당, 넘으면 429 `RATE_LIMITED`)**: 전체 `RATE_LIMIT_PER_MINUTE`(300/분) · 로그인·가입·refresh·카카오 로그인·인계 코드 교환 `AUTH_RATE_LIMIT_PER_15MIN`(30/15분) · 이메일 중복 확인·아이디 찾기 10/15분(고정) · 초대 확인·수락 30/15분(고정).

| code | HTTP | 의미 |
|---|---|---|
| `VALIDATION_ERROR` | 400 · 422 | 입력값 오류 (`details.fields` 에 필드별 메시지 — 항상 한국어, `@totem/shared` 의 오류 문구 한국어화). 422 는 형식은 맞지만 처리할 수 없는 요청 — 동선 계산(`/maps/directions`)에서 카카오가 경로를 찾지 못한 경우 |
| `UNAUTHORIZED` / `TOKEN_EXPIRED` | 401 | 로그인 필요 / access 만료 |
| `FORBIDDEN` | 403 | 권한 없음·정지 계정 |
| `NOT_FOUND` | 404 | 없음 **또는 다른 조직 데이터** |
| `CONFLICT` | 409 · 410 | 409 중복·사용 중 / 410 초대가 이미 수락·취소·만료됨 (`/auth/invitations/*`) |
| `RATE_LIMITED` | 429 | 요청 과다 |
| `UPSTREAM_ERROR` | 502 | TourAPI·카카오 등 외부 오류 |
| `NOT_CONFIGURED` | 503 | 서버에 외부 API 키 미설정 |

## 엔드포인트 ↔ 화면

🔓 = 로그인 불필요

### 메인(web) — 로그인·회원가입
| 메서드 | 경로 | 화면 동작 |
|---|---|---|
| POST 🔓 | `/auth/email-check` | 회원가입 1단계 이메일 중복 확인 |
| POST 🔓 | `/auth/signup` | 회원가입 완료 (약관 동의 포함) → 세션 발급, 조직·기본 라벨·무료 구독 생성 |
| POST 🔓 | `/auth/login` | 로그인 |
| POST 🔓 | `/auth/kakao` | 카카오 인가 코드 → 로그인/가입 |
| POST | `/auth/handoff` | 콘솔로 이동할 1회용 코드 발급 |
| POST 🔓 | `/auth/find-email` | 아이디 찾기 (이름+전화 → 마스킹 이메일) |

### 콘솔 공통
| 메서드 | 경로 | 화면 동작 |
|---|---|---|
| POST 🔓 | `/auth/handoff/exchange` | `/auth/callback` 에서 코드 → 세션 |
| POST 🔓 | `/auth/refresh` | 토큰 갱신 (회전, 재사용 탐지) |
| POST 🔓 | `/auth/logout` | 로그아웃 (세션 폐기) |
| GET | `/users/me` | 헤더 사용자명·조직 |

### 일정관리
| 메서드 | 경로 | |
|---|---|---|
| GET | `/schedule/events?from&to&q&labelId` | 달력 범위(겹치는 일정) + 검색(이름·담당자·장소) |
| GET·PATCH·DELETE | `/schedule/events/:id` | |
| POST | `/schedule/events` | |
| GET·POST | `/schedule/labels` | 목록에 `eventCount` 포함 |
| GET·PUT | `/schedule/labels/:id` | |
| DELETE | `/schedule/labels/:id?reassignTo=<id\|none>` | 사용 중이면 409, reassignTo 로 옮긴 뒤 삭제 |

### 대시보드
| 메서드 | 경로 | |
|---|---|---|
| GET | `/dashboard/months?region=jeju` | 데이터가 있는 월 목록 |
| GET | `/dashboard/stats?region&from&to` | 월별 통계 (6개 탭 데이터) |
| GET | `/dashboard/overview?month=YYYY-MM` | 종합 현황판 카드 (전월 대비 포함) |

### 코스메이커
| 메서드 | 경로 | |
|---|---|---|
| GET | `/places?q&category&sort&page&limit&areaCode` | 장소 목록 (검색·카테고리·인기순/외국인 인기순/이름순) |
| GET | `/places/:id` | |
| GET | `/places/sync-status` | (owner·admin) 동기화 상태 — 장소 수·마지막 동기화·다음 가능 시각·키 유무 (설정 > 데이터 관리) |
| POST | `/places/sync` | (owner·admin) TourAPI 에서 지역 전체 동기화. 공용 데이터라 **전역 간격** `PLACE_SYNC_COOLDOWN_HOURS` 안에는 429, 동시 실행 409 |
| GET | `/maps/local-search?query&x&y` | 카카오 키워드 검색 프록시 — 코스메이커 "카카오 검색" 탭. 업종 코드 → `category`(FD6 식당·CE7 카페·AD5 숙소·AT4/CT1 관광지·그 외 기타). 키 없으면 503 |
| POST | `/maps/directions` | 카카오모빌리티 경유지 길찾기 프록시 — 코스메이커 "동선 계산"(버튼 누를 때만, 순서: 시간대 → 숙소). 경로 없으면 422, 키 없으면 503 |
| GET·POST | `/courses` | 목록(`placeCount`·`tourCount` 포함, "내 코스") / "코스 생성 완료" (`tour` 옵션 시 **투어 + 일정관리 일정("투어" 라벨)** 동시 생성) |
| GET·PUT·DELETE | `/courses/:id` | `?courseId=` 편집 모드 / 전체 교체 저장 / 삭제 표시 (연결 투어가 있으면 409 `details.tourCount`) |

코스 규칙 (서버·화면 공통, `validateCourseRules`): 시작 ≤ 종료(최대 31일) · 기간의 모든 날짜가 1일차부터 순서대로 · 시간대 칸 범위·중복 금지 · 숙소는 0번 칸에만, 0번 칸엔 숙소만 · 장소 1개 이상

### 투어관리
| 메서드 | 경로 | |
|---|---|---|
| GET | `/tours?q&date&type&status&page&limit` | 표 (date = 그날 진행 중) · `reviewStats` 포함 |
| GET | `/tours/types` | 타입 필터 항목 |
| POST | `/tours` | 코스 없이 투어 추가 |
| GET·PATCH·DELETE | `/tours/:id` | 인라인 수정(상태·좌석, 예약 ≤ 예상 검증 — 저장된 값과 합쳐서) — **연결된 일정의 날짜·이름·담당자도 맞춤** / 삭제 표시(연결된 일정은 연결만 끊음) |

### 리뷰관리
| 메서드 | 경로 | |
|---|---|---|
| GET·POST | `/tours/:tourId/reviews` | 투어별 목록 / 직접 입력 |
| GET | `/tours/:tourId/reviews/summary` | 전체 리뷰 기준 항목별 평균 — 리뷰관리 "전체 평균" 행 (목록 페이지와 무관) |
| POST | `/tours/:tourId/reviews/import` | `{ csvUrl }` 구글 시트·CSV 가져오기 → `{ batchId, totalRows, imported, skipped, errors[] }` (errors 는 앞 100건까지) |
| DELETE | `/reviews/:id` | |

### 멤버 관리 (설정 > 멤버 관리, 메인 /invite)
| 메서드 | 경로 | |
|---|---|---|
| GET 🔓 | `/auth/invitations/:token` | 초대 미리보기(조직·이메일·역할). 수락·취소·만료는 410 |
| POST 🔓 | `/auth/invitations/accept` | 초대 수락 = 그 조직·역할 계정 생성 + 로그인 |
| GET | `/org/members` | 멤버 목록 (모든 역할) |
| PATCH | `/org/members/:id` | 역할 변경 `{role: admin\|member}` — 소유자만 |
| DELETE | `/org/members/:id` | 제외(개인정보 삭제·세션 폐기) — 관리자 이상, 관리자 제외는 소유자만 |
| POST | `/org/transfer-ownership` | `{userId}` 소유권 이전 — 소유자만, 기존 소유자는 관리자 |
| GET·POST | `/org/invitations` | 초대 내역 / 링크 만들기(토큰은 이 응답에만) — 관리자 이상, 관리자 초대는 소유자만 |
| DELETE | `/org/invitations/:id` | 대기 중 초대 취소. 관리자 초대는 소유자만(관리자에게는 404) — 관리자가 같은 이메일을 멤버로 재초대해 덮어쓰는 것도 403 |

### 설정
| 메서드 | 경로 | |
|---|---|---|
| GET·PATCH·DELETE | `/users/me` | 프로필 / 수정(이름·전화) / 탈퇴(`{ password?, confirm: "탈퇴합니다" }`) |
| PATCH | `/users/me/notifications` | 알림 토글 |
| PUT | `/users/me/password` | 비밀번호 변경 → 모든 세션 폐기 |
| GET | `/billing` | 구독 플랜·다음 결제일·결제 수단 |
| GET | `/billing/payments` | 결제 내역 |

### 운영
| GET 🔓 | `/health` | DB 연결 상태 포함 (DB down 이면 503) |
|---|---|---|

## 로그인 흐름 (메인 ↔ 콘솔)

메인(Vercel)과 콘솔(GitHub Pages)은 도메인이 달라 브라우저 저장소를 공유할 수 없다.

```
[web] 로그인/가입 ─▶ POST /auth/login  → 토큰(web 에 저장)
      ─▶ POST /auth/handoff            → 1회용 code (60초)
      ─▶ 이동: {CONSOLE_URL}/auth/callback/?code=…&next=/schedule/
[console] POST /auth/handoff/exchange  → 토큰(console 에 저장) → next 로 이동
[console] 토큰 없음/refresh 실패 ─▶ {WEB_URL}/?login=1&next=<원래 경로>
```
