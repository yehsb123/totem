# 정합성 점검 결과 (2026-09-23, 재구성 전 원본 기준)

재구성 전 `main`(fcd56dd) 소스를 화면 → FE API 호출 → BE 라우트 → DB 모델 순으로 전수 대조한 결과다.
각 항목의 처리 백로그 ID 를 같이 적었다 (`docs/BACKLOG.md`).

심각도: **P0** 즉시 조치(보안) · **P1** 기능이 동작하지 않음 · **P2** 동작하지만 틀림/위험 · **P3** 정리

## 1. 보안

| # | 심각도 | 내용 | 처리 |
|---|---|---|---|
| S1 | P0 | **공개(PUBLIC) 레포에 `totemBE/.env` 가 커밋돼 있었다.** `MONGO_URI`(DB 접속정보), `JWT_SECRET`, `JWT_REFRESH_SECRET`, `TOURAPI_SERVICE_KEY` 값이 git 히스토리에 남아 있다. 추적 해제만으로는 히스토리에서 사라지지 않는다. | SEC-001 추적 해제 ✅ / **SEC-002 키 전부 재발급 필요(책임님 조치)** / SEC-003 히스토리 정리(선택) |
| S2 | P0 | 카카오 REST API 키가 FE 소스(`coursemaker/api/kakaolocal.ts`)에 하드코딩돼 브라우저에 노출. | SEC-002 재발급 · API-041 서버 프록시로 이동 |
| S3 | P1 | FE env 에 `NEXT_PUBLIC_TOUR_API_KEY` — `NEXT_PUBLIC_` 은 번들에 그대로 박힌다. TourAPI 키는 서버 전용이어야 한다. | ENV-001 |
| S4 | P2 | JWT 비밀키 미설정 시 `"dev_access_secret"` 으로 **운영에서도** 조용히 동작. | API-010 (운영 모드에서 env 누락 시 기동 거부) |
| S5 | P2 | refresh 토큰 폐기 불가 — 로그아웃이 아무것도 안 함, 탈취 토큰 7일간 유효. | API-030 (세션 테이블 + 회전) |
| S6 | P2 | `node_modules` 8,776개 파일이 커밋돼 있었다. | SEC-001 ✅ |
| S7 | P3 | 아이디 찾기(`find-email`)가 rate limit 없이 이름+전화번호로 사용자 존재 여부를 알려준다. | API-030 (전용 limiter) |

## 2. FE ↔ BE 계약 불일치 (화면이 실제로 동작하지 않던 원인)

| # | 화면 | FE 가 호출한 것 | BE 실제 | 처리 |
|---|---|---|---|---|
| C1 | 로그인 | `POST /users/login` | `POST /auth/login` | WEB-002 |
| C2 | 회원가입 | `POST /users/register` | `POST /auth/signup` | WEB-002 |
| C3 | 전체 | 로그인 시 `userAccessToken` 키로 저장 | apiClient 는 `accessToken` 키를 읽음 → **로그인해도 항상 비인증** | 공용 클라이언트(`@totem/shared`)로 단일화 ✅ |
| C4 | 카카오 로그인 | `GET localhost:8000/api/users/login/kakao`, redirect `localhost:8080`, `Kakao.init("YOUR_KAKAO_JAVASCRIPT_KEY")`, 성공 시 `/dashboard`(존재하지 않는 경로) | 엔드포인트 없음 | API-030 · WEB-003 |
| C5 | 코스메이커 장소목록 | `GET /api/spot/v1/kr?serviceKey={key}` | 없음 (`/tour/spots/*` 만 존재) | API-040 · CON-030 |
| C6 | 코스메이커 장소검색 | `GET localhost:8000/api/spot/local/v1` | 없음 | API-041 |
| C7 | 코스메이커 저장 | `POST /api/plan/v1` body `start_date: 20250101(number)`, 응답 `plan_id` 기대 | BE 는 `startDate` 문자열, `pickupLocation`·`ownerId` 필수, 응답에 `plan_id` 없음(`_id`) → **저장 실패** | API-050 · CON-030 |
| C8 | 코스메이커 저장 | 일차별 장소(schedules)는 서버로 보내지 않고 localStorage 에만 저장 | — | API-050 · CON-030 |
| C9 | 코스메이커 | 토큰 자리에 `"your_access_token_here"` 문자열 | — | CON-030 |
| C10 | 투어관리 | `GET /api/plan/v1` | 없음 (`GET /api/plan/my`) | API-051 · CON-040 |
| C11 | 리뷰관리 | `GET /api/tour/v1`, `/api/review/{id}/v1`, `POST /api/review/import/{id}/v1` | 전부 없음 | API-051/052 · CON-050 |
| C12 | 일정관리 | 외부 서버 `https://api.totembe.shop/api/scheduler/**` | 이 레포에 없음 | API-060 · CON-010 |
| C13 | 설정 | `GET/PATCH/DELETE /api/users/{email}/v1` | 없음 (`/users/me`) | API-031 · CON-060 |

## 3. 화면 로직 오류

| # | 심각도 | 화면 | 내용 | 처리 |
|---|---|---|---|---|
| F1 | P1 | 코스메이커 | 장소 데이터에 `type` 이 없어 **숙소를 숙소 슬롯에 넣을 수 없음**(항상 "숙소만 가능" 경고), 카테고리 필터 무의미 | API-040 (category 필드) · CON-030 |
| F2 | P1 | 코스메이커 | 검색어·정렬·카테고리 상태가 목록 조회에 전혀 연결되지 않음 (고정 파라미터) | CON-030 |
| F3 | P1 | 코스메이커 | 장소 1개 제거가 서버의 **해당 일차 전체 삭제** API 를 호출, 저장 전(planId 없음)에는 제거 자체가 불가 | CON-030 (편집은 로컬 상태, 저장 시 전체 교체) |
| F4 | P2 | 코스메이커 | 시간대 목록에 10:00~11:00, 20:00~22:00 누락 | `DEFAULT_TIME_SLOTS` 교정 ✅ |
| F5 | P2 | 코스메이커 | 날짜 계산에 `toISOString()` 사용 → KST 에서 하루 밀릴 수 있음 | CON-030 (`enumerateDates` 공용 함수) |
| F6 | P1 | 코스메이커 | Kakao 지도 키 env 이름 불일치: 코드 `NEXT_PUBLIC_KAKAO_MAP_API_KEY` ↔ .env.local `NEXT_PUBLIC_KAKAO_API_KEY` → 지도 미표시 | ENV-001 (`NEXT_PUBLIC_KAKAO_MAP_APP_KEY` 로 통일) |
| F7 | P2 | 투어관리 | 담당자=`note`, 타입=`nation`, 상태=항상 `Planned` 로 억지 매핑. 상태·좌석 변경이 저장되지 않음 | API-051 · CON-040 |
| F8 | P2 | 투어관리 | `window.location.href="/toolpage/coursemaker"` — GitHub Pages basePath(`/totem`)에서 404 | CON-040 (next/link) |
| F9 | P2 | 리뷰관리 | 투어 수만큼 리뷰 API 를 N번 호출해 평균 계산 | API-051 (목록에 reviewStats 포함) |
| F10 | P3 | 리뷰관리 | "PDF로 내보내기" 는 alert 만 뜸 | CON-050 |
| F11 | P1 | 일정관리 | 라벨이 0개면 일정 조회를 아예 안 해 로딩이 끝나지 않음 | CON-010 |
| F12 | P2 | 일정관리 | 새 일정 생성 시 `typeId: 1, planId: 1` 고정, 장소 시간 `11:00` 고정 | CON-010 |
| F13 | P2 | 설정 | 기본값 `홍길동`으로 조회, 화면 열 때마다 alert, 비밀번호 변경 미구현, 결제정보 하드코딩 | API-031/032 · CON-060 |
| F14 | P3 | 회원가입 | 약관 동의를 서버에 저장하지 않음 | API-030 (agreements 저장) ✅계약 |
| F15 | P3 | 전체 | 페이지마다 Material Icons CSS 를 `<head>`에 중복 삽입 | CON-070 |
| F16 | P3 | 대시보드 | 모든 통계가 FE 정적 파일. "해외 소비 비율" 이름의 함수가 실제로는 방문객 비율을 반환 | API-070 · CON-020 |
| F17 | P3 | 메인 | 이미지 7개 누락: `example_coursemaker.png`, `images/review-combined-example.png`, `images/schedule-intro.png`, `images/schedule-calendar-example.png`, `images/tourmanage-toggle-example.png`, `images/guide_*.png`(4) | WEB-004 |
| F18 | P3 | 공통 | `<html lang="en">`, title "Create Next App" | WEB-006 · CON-001 |

## 4. BE 내부 오류

| # | 심각도 | 내용 | 처리 |
|---|---|---|---|
| B1 | P1 | **같은 `courses` 컬렉션에 서로 다른 모델 2개**(`Course`(coursesSchema), `Courses`(plansSchema))가 붙어 있음 | API-020 (모델 재설계) |
| B2 | P1 | `planRouter` 에서 `/:planId/v1` 이 `/courses/v1` 보다 먼저 등록 → `GET /api/plan/courses/v1` 이 planId="courses" 로 잡혀 500 | API-050 |
| B3 | P1 | plans 스키마 `timeSlot` 정규식(`HH:MM~HH:MM`)과 dataConverter 가 만드는 값(`"시간대 1"`)이 달라 저장 항상 실패 | API-050 |
| B4 | P2 | 시작일 < 종료일 **엄격** 비교 → 당일 코스 저장 불가 (FE 는 당일 허용) | 계약에서 `≤` 로 통일 ✅ |
| B5 | P2 | DB 연결 실패해도 로그만 찍고 서버는 떠 있음 → 모든 요청이 타임아웃 | API-011 |
| B6 | P2 | CORS origin 1개만 허용 — web·console 두 도메인 필요 | API-010 |
| B7 | P3 | 죽은 코드: `backendFunctions.js`(미사용), `routes/rootRouter.js`(없는 파일 import), `models/mongoose.js`(.js 확장자 없는 import), `tourScheduleSchema`(미사용) | API-010 (재작성) |
| B8 | P3 | `tourRouter` 가 `/tour`, `/api/tour` 두 곳에 마운트 | API-010 |
| B9 | P2 | 회원 탈퇴 시 사용자만 지우고 그 사용자의 코스·일정은 고아 데이터로 남음 | API-031 (soft delete + 조직 단위 데이터) |
| B10 | P3 | 관광지 캐시 `contentid` unique 아님 → 중복 적재 가능 | API-020 (unique 인덱스 + upsert) |

## 5. 빌드·배포

| # | 심각도 | 내용 | 처리 |
|---|---|---|---|
| D1 | P2 | 배포 워크플로가 `public/index.html` 로 Next 의 `out/index.html` 을 덮어씀 (리다이렉트 꼼수) | OPS-002 |
| D2 | P3 | `next.config.js` 와 `next.config.ts` 가 동시에 존재 | ✅ 제거 |
| D3 | P3 | basePath `/totem` 하드코딩 | ✅ `NEXT_PUBLIC_BASE_PATH` |
| D4 | P3 | README 에 없는 기술(D3, FullCalendar, DnD Kit) 표기, 설치만 되고 미사용 의존성 | DOC-001 · ✅ 의존성 정리 |
| D5 | P3 | 미사용 프로토타입 `my-dashboard-app`, 루트 `totemFE/package.json`(d3 등) | ✅ 제거 |

## 6. 재작성 중 추가로 발견한 것

| # | 심각도 | 화면 | 내용 | 처리 |
|---|---|---|---|---|
| X1 | P1 | 코스메이커 | 이미 배치된 장소를 빈 칸으로 끌어 놓으면 `{id,index}` 객체가 장소로 저장돼 깨진 항목이 생김 | ✅ 드래그 종류 분리(목록/칸 이동) |
| X2 | P2 | 코스메이커 | 칸 순서 변경이 hover 할 때마다 실행돼 끌기 도중 순서가 뒤섞임 | ✅ drop 시 1회 교환 |
| X3 | P1 | 코스메이커 | 지도 인포윈도우에 장소명(외부 데이터)을 HTML 로 그대로 삽입 — XSS | ✅ 이스케이프 |
| X4 | P2 | 콘솔 공통 | `globals.css` 의 `--foreground: #ffffff` 로 색 미지정 글자가 흰 배경에서 안 보임 | ✅ |
| X5 | P3 | 대시보드 | 설치된 Recharts 버전에서 툴팁 formatter 타입 오류 7건 (빌드 실패 원인) | ✅ |
| X6 | P3 | 일정관리 | 새 일정 모달의 "색상" 선택이 서버에 저장되지 않음, 설정·알림·더보기 버튼은 동작 없음 | ✅ 색상은 라벨에서, 가짜 버튼 제거 |
| X7 | ⛔ 확인 필요 | 대시보드 | 관광소비 금액의 원본 단위 미검증. 한국관광데이터랩은 **천원** 단위로 공개하는 경우가 많아, 그렇다면 화면 금액이 1/1000 로 표시되는 것 | 현재 "원" 유지. 원본 파일 확인 후 결정 |
| X8 | P3 | 콘솔 | 로그인 후 이동 경로가 존재하지 않는 `/dashboard`(카카오) 또는 basePath 없는 절대경로 | ✅ handoff + next 파라미터 |

## 7. 의존성 취약점 (npm audit, 2026-09-25)

| 패키지 | 심각도 | 영향 | 조치 |
|---|---|---|---|
| vitest / @vitest/mocker | 중간 | 테스트 도구의 모킹 경로 조작 (운영 코드 미포함) | ✅ vitest 5 로 업그레이드, 테스트 25건 통과 |
| esbuild 0.27 (tsup 이 고정) | 중간 | **Windows 에서 esbuild 개발 서버(serve) 를 띄울 때만** 임의 파일 읽기. 우리는 tsup 빌드만 쓰고 serve 를 쓰지 않음 | 수용. tsup 이 esbuild 0.28 을 허용하는 버전을 내면 업데이트 |
| postcss (next 15 내장) | 높음 | 공격자가 만든 CSS 를 빌드할 때의 XSS·파일 읽기. 우리는 자체 CSS 만 빌드 | ✅ Next 16.3.6 업그레이드(AUTO-09)로 해소 |

## 8. 전 화면 정합성 재점검 (AUTO-08, 2026-09-25)

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| R1 | 계약 | 클라이언트 메서드 ↔ 서버 경로를 자동 대조하는 장치가 없었다 | ✅ `contract.test.ts`: 전 메서드 호출 + ROUTES↔서버 라우트 표 정적 대조 (돌연변이 시험으로 검출 확인) |
| R2 | 보안 | 인증 미들웨어가 `"/maps"`·`"/schedule"` 같은 **접두사**로 걸려 있어, 계약 경로가 접두사 밖으로 옮겨지면 인증이 조용히 빠질 수 있었다 | ✅ 공개 경로 목록 밖 전 경로 × 전 메서드 무토큰 401 검사 (돌연변이 시험으로 검출 확인) |
| R3 | 문구 | FAQ "메모를 추가하면 자동으로 캘린더 등록" — 실제는 '투어관리에 등록' 시만 | ✅ 실제 흐름으로 교정 |
| R4 | 문구 | FAQ "1:1 채팅·이메일·전화" — 지원 채널 없음, 고객 지원 페이지는 준비 중 | ✅ 준비 중으로 교정, 오류 ID 안내 · ⛔ 연락처는 책임님 결정 |
| R5 | 문구 | FAQ "정기적으로 업데이트" — 고정 12개월 데이터, 갱신 절차 없음 | ✅ 실제 범위 명시 · ⛔ 갱신 주기 결정 필요 |
| R6 | 문구 | 튜토리얼 "팀원과 협업하기"·"프로젝트" — 멤버 초대 기능·프로젝트 개념 없음 | ✅ 실제 기능 주제로 교체 · AUTO-10 멤버 초대 큐 추가 |
| R7 | 문구 | 설정 결제 "문의: 고객센터" — 존재하지 않음 | ✅ 교정 |
| R8 | 브랜드 | 메인 문구 "TOTEM" 15곳 ↔ 로고·사이트명 "ToTem" | ✅ ToTem 통일 |
| R9 | 문서 | 백로그 "모델 13종" ↔ 실제 14종 | ✅ |
| R10 | 환경변수 | 코드 ↔ .env.example ↔ ENV.md 이름 대조 (api·web·console) | 불일치 없음 |

## 9. 재점검 2차 (큐 소진 후, 2026-09-25)

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| Q1 | 기능 | TourAPI 동기화가 API 만 있고 화면이 없어 운영에서 실제 장소를 불러올 방법이 없음(샘플 17곳뿐) | ✅ 설정 > 데이터 관리 (AUTO-12) |
| Q2 | 보안 | 장소는 **전 조직 공용**인데, 누구나 가입만 하면 소유자가 되어 동기화를 반복 호출 → TourAPI 호출 한도 소진 가능 | ✅ 전역 간격(429)·동시 실행 잠금(409)·상태 API |
| Q3 | 라우팅 | 새 고정 경로 `/places/sync-status` 를 `/places/:id` 뒤에 두면 가로채짐 (정적 계약 검사로는 못 잡는 종류) | ✅ 파라미터 경로를 맨 뒤로 + 실행 테스트로 고정 |
| Q4 | 테스트 | API 테스트·E2E 가 개발자 PC 의 `apps/api/.env`(실제 TourAPI 키)를 읽어 결과가 PC 마다 달라짐 | ✅ vitest·playwright 환경에서 외부 키·DB 주소를 빈 값으로 고정 |
| Q5 | 목록 | 리뷰 200건·투어 100건 상한에서 조용히 잘리고, 리뷰 평균을 잘린 목록으로 계산 | ✅ 서버 요약 API(전체 기준 항목별 평균)·페이지·전체 건수 표시·투어 선택 검색 (AUTO-13) |
| Q6 | 권한 | 멤버도 투어·코스·리뷰 삭제 가능 | ⛔ 책임님 결정 (WORKLOG) |

## 10. 재점검 3차 — 보안·입력 검증 (2026-09-25)

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| T1 | 보안 | 초대 미리보기 `GET /auth/invitations/<토큰>` 의 토큰이 접근 로그에 평문 → 로그 열람자가 초대를 가로채 가입 가능 | ✅ 로그 URL 마스킹(경로 토큰, token·code·refreshToken 쿼리), 실제 서버 로그로 원문 0건 확인 (AUTO-14) |
| T2 | 검증 | 시간 `24:59` 통과, 시간대 끝<시작 허용 | ✅ 시각 00:00~23:59, 시간대 끝 ≤24:00·시작<끝 (AUTO-15) |
| T3 | 문서 | refresh token localStorage 보관의 XSS 맞교환이 문서에 없음 | ✅ docs/SECURITY.md — 통제·근거 코드·테스트, 맞교환 R1~R8 (AUTO-16) |
| T4 | 보안 | 문서 작성 중 대조: 콘솔 `next` 검증이 `/\`(브라우저가 `//` 로 해석)를 막지 않음 — web 과 규칙이 달랐다 (유효한 1회용 코드가 필요해 실제 악용은 어려움) | ✅ 검증을 `@totem/shared sanitizeNext` 하나로 통일 + 테스트 |

## 11. 재점검 4차 — 프런트 방어선 (2026-09-25)

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| U1 | 보안 | 프런트에 CSP 없음 → XSS 시 localStorage 토큰을 임의 서버로 전송 가능 (SECURITY R1·R2) | ✅ web 응답 헤더·console meta CSP, connect-src 를 API 로 제한. 운영 빌드(`next start`·정적 out) 브라우저 점검: 로그인 인계·5개 화면 위반 0건, 외부 fetch 차단 확인 (AUTO-17) |
| U2 | 접근성 | 일정관리·코스메이커가 `<main>` 을 중첩 | ✅ section + aria-label, 인쇄 시 안쪽 스크롤 영역 펼침 (AUTO-18) |

## 12. 재점검 5차 — 문서↔코드 전수 대조·화면 문구 (2026-09-25)

라우터↔계약↔API.md 의 경로·메서드·권한은 전부 일치. 아래는 그 밖의 불일치.

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| V1 | 보안 | `SEED_ON_EMPTY=true` + 영속 DB(스테이징 등) → `NODE_ENV` 만 보고 `demo1234` 로 데모 계정 생성. 문서·.env.example·주석은 "비우면 미생성" | ✅ 기본 비밀번호는 인메모리 DB 에서만(`demoPasswordFor`) + 테스트 (AUTO-19) |
| V2 | 날짜 | 리뷰 제출일·결제일 `slice(0,10)` = UTC 날짜 (F5 규칙 위반), 시드 날짜도 UTC | ✅ 로컬 날짜·시드는 Asia/Seoul (AUTO-20) |
| V3 | 문구 | 알림 설정 "이메일로 받습니다" — 발송 수단 없음 / 결제 내역 최근 24건만, 안내 없음 / "관광지 추천" — 추천 기능 없음(검색해 담기) | ✅ 준비 중 안내, "최근 N건만(전체 M건)", "골라 담기"·"검색·코스 설계" (AUTO-21) |
| V4 | 문서 | API: 410·422 가 오류표에 없음, 가져오기 응답 `batchId`·오류 100건 상한 누락, 목록별 페이지 크기·고정 속도 제한 미기재 / DATABASE: `purgedAt`·인덱스 2건·provider `local`·`source`·인계 코드 삭제 누락, 결제 5년 뒤 삭제는 미구현인데 "5년 보존"만 기재 / ENV: og `VERCEL_URL` 대체 | ✅ 문서를 코드에 맞춤 (AUTO-22) |

## 13. 재점검 6차 — 역할 경계 (2026-09-25)

API 의 역할 검사(`requireRole`·라우터 내 조건)와 콘솔의 노출 조건(탭·버튼·선택지)을 1:1 대조. 역할은 매 요청 DB 에서 읽어 변경이 즉시 반영됨을 확인.

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| W1 | 권한 | 관리자 초대를 만들 권한이 없는 관리자가 그 초대를 취소하거나, 같은 이메일을 멤버로 재초대해 무효화할 수 있음 | ✅ 둘 다 소유자만 (취소는 404, 재초대는 403) + 화면에서 취소 버튼 숨김 + 테스트 (AUTO-23) |
| W2 | 화면 | 소유권 이전 후 화면이 계속 소유자 컨트롤을 보여 줌("새로고침하면 반영") | ✅ 이전 직후 세션 갱신 + E2E (AUTO-24) |

## 14. 재점검 7차 — 세션 만료·오류 상태 (2026-09-25)

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| X1 | 세션 | 콘솔 탭 2개 이상이 동시에 만료 → 각 탭이 같은 refresh token 으로 갱신 → 서버 재사용 탐지가 **전 세션 폐기** → 정상 사용자가 강제 로그아웃. (탭 안의 중복 방지만 있었음) | ✅ Web Locks 로 탭 간 직렬화 + 이미 교체됐으면 재시도. Chrome 두 탭 점검: refresh 1회·두 탭 유지 (AUTO-25) |
| X2 | 세션 | refresh 요청이 네트워크 오류·5xx 로 실패해도 토큰 삭제 → 잠깐 끊긴 것만으로 로그아웃 | ✅ 서버가 거절(4xx)할 때만 로그아웃, 그 외는 연결 오류 안내 (AUTO-25) |
| X3 | 저장 | 일정관리 저장·삭제(일정·라벨 5개 동작)와 리뷰 추가·가져오기·삭제가 "저장 → 목록 갱신" 을 한 묶음으로 기다림 → 갱신만 실패해도 저장 실패로 표시, 입력 창이 남아 다시 누르면 **중복 생성** | ✅ 갱신 실패는 저장과 분리(일정: 화면 오류·재시도로, 리뷰: 안내 토스트). Chrome 점검: 저장 후 조회를 끊어도 창 닫힘·성공 안내·서버 1건 (AUTO-26) |
| X4 | 빈 상태 | 새 조직 투어관리 "조건에 맞는 투어가 없습니다"(필터 없음) / 대시보드 빈 상태가 고객에게 개발 명령(`npm run seed`) 안내 / 일정표에 코스가 없으면 오류 화면 | ✅ "아직 등록한 투어가 없습니다", 준비 중 안내, 코스메이커로 가는 안내 (AUTO-27). 빈 조직으로 7개 화면 순회 — 콘솔 오류 0건 |

## 15. 재점검 8차 — 입력 한계값 (2026-09-25)

zod 입력 스키마의 길이·숫자 상한과 Mongoose 모델(maxlength)을 필드별 대조: 코스·투어·일정 이름 100, 라벨 30, 이름 50, 회사 100 — 일치.

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| Y1 | 문구 | 스키마에 문구를 적지 않은 길이·숫자·정수·형식 오류가 zod 기본 **영어**로 표시 (투어명 101자 → "String must contain at most 100 character(s)") — 콘솔·web 폼과 API 400 `details` 모두 | ✅ `@totem/shared` 에 한국어 오류 문구 등록(세 앱이 같은 zod 인스턴스) — "100자 이하로 입력해주세요." 등. 스키마에 적은 문구가 우선. 테스트 2건(등록을 빼면 실패 확인), 콘솔 번들 포함·실제 폼 문구 확인 (AUTO-28) |
| Y2 | 검증 | 아이디 찾기 이름·전화에 상한 없음 (저장 규칙은 50자·20자) | ✅ 같은 상한 (AUTO-28) |

## 16. 재점검 9차 — 메인 사이트 SEO·접근성 (2026-09-25)

운영 빌드(`next start`)의 16개 경로를 데스크톱·375px 로 자동 점검: 제목·설명·canonical·og:image·h1 개수·제목 단계·대체 텍스트·이름 없는 링크/버튼·main 개수·가로 넘침. 375px 가로 넘침 0, 대체 텍스트·이름 없는 컨트롤 0.

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| Z1 | SEO | `robots.txt`·`sitemap.xml` 404 | ✅ Next 메타데이터 경로로 생성(주소 기준은 og 와 같은 `siteBaseUrl`), 로그인 흐름(/invite·/auth/) 색인 차단 (AUTO-29) |
| Z2 | SEO | `/features` → `/features/coursemaker` 가 임시 이동(307) | ✅ 영구 이동(308) (AUTO-29) |
| Z3 | 접근성 | 기능 소개 카드 제목이 h3 인데 위에 h2 가 없는 페이지(코스메이커) — 화면 읽기 프로그램의 제목 탐색이 끊김 | ✅ 카드 묶음에 화면 읽기용 h2 (AUTO-29) |

고정 장치: E2E `web-seo.spec.ts` — 앱의 page.tsx 목록과 sitemap 이 일치하는지(페이지를 추가하고 sitemap 을 빠뜨리면 실패), 모든 주소가 200·색인 허용·canonical 일치·h1 하나·제목 단계 연속, robots 규칙·308.

## 17. 재점검 10차 — 키보드 조작 (2026-09-25)

클릭 처리가 붙은 비대화형 요소(div·li·tr 등)를 여러 줄 태그까지 전수 검색: 배경 닫기(마우스 편의, 닫기 버튼·Esc 있음)와 달력 칸(날짜 버튼이 따로 있음)뿐 — 키보드로 못 하는 동작 없음. 코스메이커 끌어 놓기는 [담기] 버튼이 대체.

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| K1 | 모달 | 콘솔 공용 모달(7곳)·메인 로그인 모달: Tab 이 모달 뒤 화면으로 빠짐, 닫으면 포커스가 사라짐(처음으로 돌아감). 콘솔 모달은 autoFocus 가 없는 창에서 첫 포커스 없음, 모달 위 모달에서 Esc 한 번에 둘 다 닫힘 | ✅ Tab 가두기, 연 버튼으로 포커스 복귀(자식 autoFocus 가 먼저 포커스를 옮기는 경우까지 — 모달 밖 마지막 포커스 추적), 첫 입력칸 포커스, 맨 위 모달만 Esc, `aria-labelledby` (AUTO-30) |

고정 장치: E2E `keyboard.spec.ts` — 두 모달 모두 키보드로 열기 → 입력칸 포커스 → Tab·Shift+Tab 25회 동안 모달 안 → Esc → 연 버튼 포커스.

## 18. 재점검 11차 — API 성능 (2026-09-25)

방법: 테스트용 MongoDB 에 `notablescan`(인덱스 없이 전체를 훑는 조회는 오류)을 켜고 API 테스트 전체 실행 → 전체 스캔 조회를 모두 드러냄. 목록 조회의 조회 반복(N+1)은 전수 검색 — 코스 목록 투어 수는 집계 1회, 반복 조회는 리뷰 가져오기뿐.

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| P1 | 인덱스 | users.email 의 unique 가 부분 인덱스(문자열만)라 평범한 `{ email }` 조회에 쓰이지 않음 → **로그인·가입·이메일 중복 확인·초대가 사용자 전체 스캔** (테스트 66개 중 49개가 여기서 실패) | ✅ 조회용 일반 인덱스 (email, _id) (AUTO-31) |
| P2 | 인덱스 | 조직 영구 삭제의 review_imports(organizationId)·auth_handoffs(userId) 전체 스캔 | ✅ 인덱스 (AUTO-31) |
| P3 | 속도 | 리뷰 CSV 가져오기가 행마다 저장 요청 — 2MB 시트(수천 행)면 원격 DB 에서 분 단위 → 요청 시간 초과 | ✅ 한 번에 저장(ordered:false, 중복만 건너뜀·행 번호 유지). 3,000행 5초 이내 테스트 (AUTO-32) |
| P4 | 정확성 | 날짜 열이 없는 시트는 "지금" 시각으로 채운 값이 중복 판정에 들어가 **다시 가져올 때마다 같은 리뷰가 또 쌓임** | ✅ 중복 판정은 시트에 적힌 원본 값으로 (AUTO-32) |

고정 장치: API 테스트는 이제 항상 `notablescan` 으로 돈다 — 새 조회에 인덱스를 빠뜨리면 테스트가 실패. `review-import.test.ts`(재가져오기 중복·3,000행) — 수정 전 코드로 2건 모두 실패 확인.

## 19. 재점검 12차 — 운영 준비 (2026-09-25)

배포 문서(DEPLOY.md 3절)대로 실제로 따라 함. 로컬 Docker 데몬이 꺼져 있어 이미지의 각 단계(빌드·운영 의존성·실행)를 같은 명령으로 재현하고, 운영 모드(`NODE_ENV=production`)로 별도 MongoDB 에 붙여 기동.

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| O1 | 배포 | **API 이미지가 빌드되지 않음**: 실행 단계가 api package.json 만으로 `npm install --omit=dev` → npm 이 devDependencies 까지 해석하며 `@totem/shared`(워크스페이스 패키지, 레지스트리에 없음) 404. 또 lockfile 없이 `^` 범위라 빌드마다 버전이 달라질 수 있음 | ✅ 운영 의존성 단계를 워크스페이스 lockfile 로 `npm ci --omit=dev` (버전 고정, 25MB). 각 단계를 로컬에서 재현해 확인 (AUTO-33) |
| O2 | 문서 | 운영 시드가 `npm run seed -w @totem/api` → tsx(개발 의존성)라 운영 이미지에서 실행 불가 | ✅ `node dist/db/seed/run.js`·`start:seed`/`start:purge` 스크립트, 문서 5곳 교정 (AUTO-33) |

정상 확인: 필수 환경변수 없으면 기동 거부(메시지에 빠진 이름), 헬스체크 200·DB 정보, JSON 로그, 운영 시드(데모 계정 미생성)·정리 동작.
고정 장치: CI `api-image` 잡 — 매 push 마다 이미지 빌드 → 운영 모드 기동·헬스체크 → 같은 이미지로 시드·정리 → 필수값 없으면 기동 거부. 첫 실행(run 36080854878) 통과: 이미지 빌드·운영 기동 헬스 200·시드(통계 12·장소 17)·정리·기동 거부 모두 로그로 확인.

## 20. 재점검 13차 — 콘솔 배포(GitHub Pages) (2026-09-25)

워크플로(deploy-console.yml) ↔ 빌드 결과(out/) 대조 + GitHub Pages 동작(디렉터리 끝 / 301, 없는 경로 404.html)을 흉내 낸 로컬 서버로 확인. 하위 경로(/totem) 자산·깊은 주소·쿼리(`itinerary/?courseId=`)·`.nojekyll`·404.html 생성·배포 경로 필터(콘솔·shared·lockfile) 정상.

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| G1 | 화면 | 없는 콘솔 주소 → Next 기본 **영어** 404, 링크 없음 | ✅ 한국어 404 + 콘솔 첫 화면(하위 경로 자동)·메인 버튼. Pages 흉내 서버에서 상태 404·스타일·링크 확인 (AUTO-34) |
| G2 | 배포 | `CONSOLE_API_BASE_URL`·`CONSOLE_WEB_URL` 에 http 주소도 통과 → https 페이지에서 API 요청이 혼합 콘텐츠로 차단, CSP 에도 잘못 들어감 | ✅ 워크플로가 https 가 아니면 실패 (AUTO-34) |

## 21. 재점검 14차 — 메인 사이트(Vercel) 배포 (2026-09-25)

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| V1 | 배포 | Vercel 에 필수 공개 변수(`NEXT_PUBLIC_API_BASE_URL`·`NEXT_PUBLIC_CONSOLE_URL`)가 없어도 빌드 성공 → 코드 기본값 localhost 가 번들·CSP 에 박혀 **배포는 되는데 모든 사용자의 로그인이 실패** | ✅ Vercel 빌드(`VERCEL=1`)에서 없거나 https 가 아니면 빌드 실패. 3가지(없음·http·정상)와 일반 CI 빌드 영향 없음을 확인 (AUTO-35) |
| V2 | 로그인 | 카카오 redirect 가 `NEXT_PUBLIC_SITE_URL`(비우면 localhost) 기준 — og·sitemap 은 Vercel 도메인 자동 대체라 둘이 어긋남 | ✅ redirect 는 브라우저 현재 주소로 (인가·코드 교환 동일). `localhost`·`127.0.0.1` 로 열어 각각 그 주소가 되는 것 확인 (AUTO-35) |

정상 확인(운영 빌드 `next start`): 응답 헤더 CSP·X-Frame-Options·nosniff·Referrer-Policy, **카카오 로그인 SDK 가 CSP 아래에서 로드·위반 0건**(AUTO-17 에서 키가 없어 못 했던 확인). 인가 자체는 등록된 앱 키가 있어야 해 확인 불가.

## 22. 재점검 15차 — 공용 계약(@totem/shared) (2026-09-25)

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| C1 | 계약 | 실제 응답 모양이 공용 스키마와 같은지 확인하는 장치 없음 (화면은 스키마 타입만 믿음) | ✅ `response-shapes.test.ts`: 데모 조직의 읽기 API 14개 응답을 **중첩까지 strict** 로 대조 — 계약에 없는 필드(내부 id·해시 등) 누출·누락·형식. 현재 불일치 0 (자체 점검으로 검출력 확인) |
| C2 | 계약 | 속도 제한(429) 본문만 `requestId` 없음 — 다른 오류(잘못된 JSON 400·본문 초과 413·없는 경로 404)는 모두 형식 일치 | ✅ limiter 3곳을 공용 `limiter()` 로 모아 같은 오류 본문 + requestId, 테스트 (AUTO-36) |
| C3 | 테스트 | 인메모리 MongoDB 기동 한도 기본 10초 — 테스트 파일 11개가 동시에 띄우면 넘겨 **테스트가 통째로 건너뛰어짐**(5회 중 2회) | ✅ 한도 60초. 연속 4회 73/73 (AUTO-36) |

사용되지 않는 공용 내보내기 점검: 앱에서 직접 쓰지 않는 것은 요청·응답 타입과 클라이언트 내부용뿐(계약 공개용) — 제거 대상 없음. 오류 코드는 서버가 `ErrorCode` 타입으로만 만들어 목록과 일치.

## 23. 재점검 16차 — 처음 온 개발자로 문서 따라 하기 (2026-09-25)

dev 브랜치를 새로 clone 해 README 만 보고 수행: `npm install`(42초) → env 파일 없이 `npm run dev` → 헬스 200·web 200·console 200·데모 계정 시드 → 빈 조직으로 콘솔 7개 화면(오류 0) → `typecheck`·`lint`·`test`(73)·`build`·`seed` 모두 성공. 문서 안 상대 링크·경로 표기 전수 검사 — 끊긴 것 없음(`.env.local` 2건은 로컬 전용 파일이라 의도).

| # | 영역 | 발견 | 처리 |
|---|---|---|---|
| D1 | 문서 | README: Next.js 15 → 실제 16, 컬렉션 14 → 15, org 모듈·/invite·itinerary·robots/sitemap·csp·lib 누락, SECURITY 문서 누락, CI 범위(lint·E2E·이미지) 누락 | ✅ 코드 기준으로 교정 (AUTO-37) |
| D2 | 문서 | 세 앱을 한 번에 띄우는 `npm run dev` 가 README 에 없음, env 파일 없이 바로 뜬다는 점·복사할 파일 이름(.env / .env.local)이 불명확 | ✅ 시작하기를 실제 순서대로 (AUTO-37) |

참고: `npm audit` 낮음 1건(esbuild — 개발 도구, 운영 이미지에 없음).
