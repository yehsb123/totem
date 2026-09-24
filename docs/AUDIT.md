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
| postcss (next 15 내장) | 높음 | 공격자가 만든 CSS 를 빌드할 때의 XSS·파일 읽기. 우리는 자체 CSS 만 빌드 | 수용(위험 낮음). **Next 16 업그레이드(DEP-001)** 시 해소 |

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
