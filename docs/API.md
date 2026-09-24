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
{ "error": { "code": "VALIDATION_ERROR", "message": "종료일은 시작일과 같거나 이후여야 합니다.", "details": { "fields": [{ "path": "endDate", "message": "…" }] } } }
```

| code | HTTP | 의미 |
|---|---|---|
| `VALIDATION_ERROR` | 400 | 입력값 오류 (`details.fields` 에 필드별 메시지) |
| `UNAUTHORIZED` / `TOKEN_EXPIRED` | 401 | 로그인 필요 / access 만료 |
| `FORBIDDEN` | 403 | 권한 없음·정지 계정 |
| `NOT_FOUND` | 404 | 없음 **또는 다른 조직 데이터** |
| `CONFLICT` | 409 | 중복·사용 중 |
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
| POST | `/places/sync` | (owner·admin) TourAPI 에서 지역 전체 동기화 |
| GET | `/maps/local-search?query&x&y` | 카카오 키워드 검색 프록시 |
| POST | `/maps/directions` | 카카오모빌리티 경유지 길찾기 프록시 |
| GET·POST | `/courses` | 목록 / "코스 생성 완료" (`tour` 옵션 시 투어 동시 생성) |
| GET·PUT·DELETE | `/courses/:id` | `?courseId=` 편집 모드 / 전체 교체 저장 / 삭제 표시 |

코스 규칙 (서버·화면 공통, `validateCourseRules`): 시작 ≤ 종료(최대 31일) · 기간의 모든 날짜가 1일차부터 순서대로 · 시간대 칸 범위·중복 금지 · 숙소는 0번 칸에만, 0번 칸엔 숙소만 · 장소 1개 이상

### 투어관리
| 메서드 | 경로 | |
|---|---|---|
| GET | `/tours?q&date&type&status&page&limit` | 표 (date = 그날 진행 중) · `reviewStats` 포함 |
| GET | `/tours/types` | 타입 필터 항목 |
| POST | `/tours` | 코스 없이 투어 추가 |
| GET·PATCH·DELETE | `/tours/:id` | 인라인 수정(상태·좌석, 예약 ≤ 예상 검증) / 삭제 표시 |

### 리뷰관리
| 메서드 | 경로 | |
|---|---|---|
| GET·POST | `/tours/:tourId/reviews` | 투어별 목록 / 직접 입력 |
| POST | `/tours/:tourId/reviews/import` | `{ csvUrl }` 구글 시트·CSV 가져오기 → `{ totalRows, imported, skipped, errors[] }` |
| DELETE | `/reviews/:id` | |

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
