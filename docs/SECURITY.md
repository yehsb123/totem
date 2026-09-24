# 보안 설계

현재 적용된 통제와, 알고 받아들인 맞교환(위험)을 적는다. 수치는 코드 기본값이며 환경변수로 바뀐다(`docs/ENV.md`).
각 통제의 근거 위치와 이를 고정하는 테스트를 함께 적었다 — 문서와 코드가 어긋나면 테스트가 먼저 깨진다.

## 1. 인증·세션

| 통제 | 내용 | 코드 · 테스트 |
|---|---|---|
| access token | JWT, 15분 (`JWT_ACCESS_TTL`). 매 요청마다 사용자 상태(활성)·조직(삭제 아님)을 DB 로 다시 확인 → 정지·탈퇴·조직 삭제가 **즉시** 반영 | `middlewares/auth.ts` · `auth.test.ts`, `org-lifecycle.test.ts` |
| refresh token | 서명 토큰이 아닌 **난수 + DB 세션(SHA-256 해시만 저장)**, 14일 (`REFRESH_TOKEN_TTL_DAYS`) | `modules/auth/service.ts` |
| 회전·재사용 탐지 | refresh 할 때마다 새 토큰으로 교체. 이미 교체된 토큰이 다시 오면 **탈취로 보고 그 사용자의 모든 세션 폐기**. 동시 refresh 경합은 조건부 업데이트로 1회만 | 같은 곳 · `auth.test.ts` "재사용하면 모든 세션이 폐기" |
| 세션 폐기 | 로그아웃(그 세션) · 비밀번호 변경·탈퇴·멤버 제외(전 세션) | `users/router.ts`, `org/router.ts` |
| 비밀번호 | bcrypt 12 rounds (`BCRYPT_ROUNDS`), 8~72자·영문+숫자. 없는 이메일도 같은 시간이 걸리도록 더미 해시 비교(계정 존재 추측 방지), 오류 문구 동일 | `auth/service.ts` · `auth.test.ts` "같은 메시지로 401" |
| web → console 인계 | 도메인이 달라 토큰을 URL 로 넘기지 않는다. 60초·1회용 코드(해시 저장)를 넘기고 콘솔이 교환 | `auth/router.ts` handoff · `auth.test.ts` "한 번만 교환" |
| 카카오 로그인 | 코드 교환은 서버에서(REST 키·Client Secret 은 서버 전용). `redirectUri` 는 허용 목록(`KAKAO_REDIRECT_URIS`)만. 기존 계정 연결은 카카오가 **검증한 이메일**일 때만 | `auth/kakao.ts` |

## 2. 권한·테넌트 격리

| 통제 | 내용 | 코드 · 테스트 |
|---|---|---|
| 조직 격리 | 모든 업무 데이터에 `organizationId`, 조회·수정은 토큰의 조직으로만. 다른 조직 데이터는 **404**(존재 여부도 숨김) | 각 라우터 · `domain.test.ts` "조직 격리", `members.test.ts` |
| 역할 | 소유자=역할 변경·소유권 이전 / 관리자=초대·멤버 제외 / 멤버=조회. 관리자 초대·관리자 제외는 소유자만 | `org/router.ts` · `members.test.ts` |
| 인증 적용 범위 | 공개 경로는 명시 목록뿐. 그 밖의 **모든 계약 경로 × 모든 메서드**가 무토큰 401 인지 자동 검사 (경로가 인증 접두사 밖으로 옮겨져 보호가 빠지는 것을 막음) | `contract.test.ts` (돌연변이 시험으로 검출 확인) |
| 공용 데이터 보호 | 장소(TourAPI)는 전 조직 공용 → 동기화는 관리자 이상 + 전역 간격 6시간(`PLACE_SYNC_COOLDOWN_HOURS`, 429) + 동시 실행 잠금(409). 누구나 가입해 소유자가 될 수 있어 호출 한도 소진을 막기 위함 | `places/router.ts` · `domain.test.ts` |

## 3. 입력·출력

| 통제 | 내용 | 코드 · 테스트 |
|---|---|---|
| 입력 검증 | 모든 요청 본문·쿼리를 `@totem/shared` zod 스키마로 검증(화면도 같은 스키마로 먼저 검증). 코스 규칙·시간 형식·좌석 수 등 | `lib/http.ts parse` · 각 테스트 |
| 본문 크기 | JSON 1MB | `app.ts` |
| SSRF (리뷰 CSV) | https 만, 허용 호스트(`REVIEW_IMPORT_ALLOWED_HOSTS`, 하위 도메인 포함)만, **리다이렉트도 매 단계 호스트 검사**, 2MB 상한, HTML 응답 거부 | `reviews/csv.ts` · `domain.test.ts` "허용되지 않은 호스트를 거부" |
| 정규식 검색 | 사용자 검색어는 이스케이프 후 `$regex` | `lib/http.ts escapeRegex` |
| XSS | 화면은 React 텍스트 렌더(`dangerouslySetInnerHTML` 사용 0건). 카카오 지도 인포윈도우(HTML 문자열)는 장소명을 이스케이프 | `coursemaker/hooks/useKakaoMap.ts` |
| 오픈 리다이렉트 | 로그인 후 이동할 `next` 는 `/` 로 시작하고 `//`·`/\`·제어문자가 없는 내부 경로만 — web·console 이 **같은 구현**(`@totem/shared sanitizeNext`) | `packages/shared/src/navigation.ts` · `observability.test.ts`, E2E "//evil.com" |
| 헤더 | helmet 기본값, `X-Powered-By` 제거, CORS 는 허용 출처(`CORS_ORIGINS`)만 | `app.ts` · `observability.test.ts` |
| 프런트 CSP | **connect-src = 자기 자신 + API 주소(빌드 시 `NEXT_PUBLIC_API_BASE_URL`)만** → XSS 가 생겨도 토큰을 외부로 보내지 못한다. 스크립트 출처는 자기 자신 + 카카오(web: `t1.kakaocdn.net`, console: `dapi.kakao.com`·`t1.daumcdn.net`), object·frame 금지, base-uri·form-action 자기 자신. web 은 응답 헤더(+ `X-Frame-Options: DENY`·`nosniff`·`Referrer-Policy`), console 은 `<meta>`. 운영 빌드에만(개발 서버 HMR 제외) | `packages/shared/csp.mjs`, `apps/web/next.config.mjs`, `apps/console/src/app/layout.tsx` · 운영 빌드 브라우저 점검(외부 fetch 차단·정상 화면 위반 0건) |

## 4. 로그·추적

| 통제 | 내용 | 코드 · 테스트 |
|---|---|---|
| 민감값 가리기 | 요청 헤더 `authorization`·`cookie`, 본문의 `password`·`refreshToken`·`accessToken` 필드, **URL 안의 초대 토큰(경로)·`token`/`code`/`refreshToken` 쿼리** → `[REDACTED]` | `lib/logger.ts`, `lib/redact.ts` · `observability.test.ts` (+ 실서버 로그로 원문 0건 확인) |
| 요청 ID | 모든 응답 `X-Request-Id`(앞단 값은 안전한 형식일 때만 이어 씀 → 로그 주입 방지), 오류 본문 `requestId`, 화면은 5xx 에 "오류 ID" 표시 | `app.ts` · `observability.test.ts` |
| 속도 제한 (IP 당) | 전체 300/분 · 로그인·가입·refresh 30/15분 · 계정 조회성(이메일 중복 확인·아이디 찾기) 10/15분 · 초대 확인·수락 30/15분 | `app.ts`, `auth/router.ts`, `org/router.ts` |

## 5. 개인정보·보존

| 통제 | 내용 |
|---|---|
| 탈퇴·멤버 제외 | 이메일·이름·전화·인증수단 **즉시 삭제**, 세션 폐기. 레코드는 남겨 작성자 참조 유지 |
| 조직 삭제 | 삭제 표시 즉시 접근 차단 → 30일(`ORG_PURGE_AFTER_DAYS`) 뒤 `npm run purge` 로 영구 삭제. 결제 기록만 5년 보존(개인정보 없음) — `docs/DATABASE.md` |
| 약관 동의 | 이용약관·개인정보 동의 시각을 사용자에 기록 |
| 비밀값 저장 | 비밀번호(bcrypt), refresh token·인계 코드·초대 토큰(SHA-256) — 원문은 DB 에 없음 |
| 운영 설정 | `NODE_ENV=production` 에서 `MONGO_URI`·`JWT_ACCESS_SECRET`(32자↑)·`CORS_ORIGINS` 없으면 **기동 거부**. DB 연결 실패 시 기동 중단 |

## 6. 알고 받아들인 맞교환 · 남은 위험

| # | 위험 | 왜 이렇게 했나 / 완화 | 권장 후속 |
|---|---|---|---|
| R1 | **토큰을 브라우저 localStorage(`totem.auth`)에 보관** → 페이지에 XSS 가 생기면 access·refresh 토큰을 읽어갈 수 있다 | 메인(Vercel)·콘솔(GitHub Pages)·API 가 서로 다른 도메인이라 쿠키 기반 세션을 쓰려면 같은 상위 도메인이 필요. 완화: access 15분, refresh 회전 + **재사용 탐지 시 전 세션 폐기**, XSS 통로 최소화(위 §3) | 운영 도메인을 `*.totem.co.kr` 처럼 한 상위 도메인으로 묶으면 refresh 를 `HttpOnly; Secure; SameSite` 쿠키로 옮길 것 |
| R2 | **CSP 가 `script-src 'unsafe-inline'` 을 허용**, 콘솔은 `<meta>` 라 `frame-ancestors`(클릭재킹 방지) 불가 | Next 정적 페이지는 인라인 부트스트랩 스크립트를 쓰고, 정적 export(GitHub Pages)는 요청마다 nonce 를 만들 수 없다. 핵심인 connect-src 제한(토큰 유출 차단)은 적용됨(§3) | 콘솔을 헤더 설정 가능한 호스팅으로 옮기면 헤더 CSP + `frame-ancestors 'none'`, 이어 nonce 기반으로 `'unsafe-inline'` 제거 |
| R3 | **제3자 스크립트**(카카오 로그인 SDK·지도 SDK)가 토큰이 있는 페이지에서 실행 | 카카오 기능에 필수. 키가 없으면 불러오지 않는다 | 버전 고정 SDK 에 SRI(`integrity`) 적용 |
| R4 | **계정 단위 잠금 없음**(IP 단위 속도 제한만) → 여러 IP 로 한 계정을 두드리는 대입 공격에 약함 | 잠금은 공격자가 남의 계정을 잠그는 DoS 로도 쓰여 설계 결정이 필요 | 계정·IP 조합 지연(점증 대기) 또는 CAPTCHA |
| R5 | **가입 시 이메일 소유 확인 없음** — 남의 이메일로 가입해 그 이메일을 선점할 수 있다 | 메일 발송 수단이 없음 (초대 메일과 같은 결정) | 메일 서비스 결정 후 인증 메일 |
| R6 | 속도 제한·동기화 잠금이 **프로세스 메모리** | 단일 인스턴스 전제 | 여러 대로 늘리면 Redis 등 공유 저장소 |
| R7 | **공개 레포 git 히스토리에 옛 `.env`(DB 접속정보·JWT·TourAPI 키)** | 추적은 해제했지만 히스토리에 남아 있다 | **키 재발급 필수(SEC-002)**, 히스토리 정리 여부 결정(SEC-003) |
| R8 | 2단계 인증 없음 | B2B 초기 범위 밖 | 관리자 이상부터 TOTP |

## 7. 보고

보안 문제를 발견하면 공개 이슈 대신 레포 소유자에게 비공개로 알린다. 화면의 "오류 ID" 를 함께 주면 서버 로그에서 해당 요청을 바로 찾을 수 있다.
