# 환경변수

## 어디에 두나

| 앱 | 로컬 개발 | 배포 | 코드에서 읽는 곳 |
|---|---|---|---|
| api | `apps/api/.env` | API 호스팅 서비스의 환경변수 설정 (배포처 미정, `docs/DEPLOY.md`) | `apps/api/src/config/env.ts` (zod 검증) |
| web (메인) | `apps/web/.env.local` | **Vercel** > Project > Settings > Environment Variables | `apps/web/src/lib/env.ts` |
| console (기능화면) | `apps/console/.env.local` | **GitHub** > Settings > Secrets and variables > Actions > **Variables** | `apps/console/src/lib/env.ts` |

- `.env`, `.env.local` 은 **내 PC 에서만** 읽히고 git 에 올라가지 않는다 (`.gitignore`). 레포에는 값이 빈 `.env.example` 만 있다.
- 처음 한 번: 각 앱 폴더에서 `cp .env.example .env` (api) / `cp .env.example .env.local` (web·console)
- `NEXT_PUBLIC_` 으로 시작하는 값은 **빌드 결과 JS 에 그대로 박혀 누구나 볼 수 있다.** 비밀값(DB 주소, 서비스키, REST 키, JWT 비밀키)은 절대 `NEXT_PUBLIC_` 으로 두지 않는다 — 모두 api 에만 둔다.
- Next.js 는 `process.env.NEXT_PUBLIC_이름` 을 **빌드할 때** 치환한다. 값을 바꾸면 다시 빌드·배포해야 반영된다.

## api (`apps/api`) — 서버 전용, 비밀값 포함

| 이름 | 필수 | 기본값 | 설명 |
|---|---|---|---|
| `NODE_ENV` | | `development` | `production` 이면 아래 "운영 필수" 누락 시 **기동 거부** |
| `PORT` | | `8000` | |
| `LOG_LEVEL` | | `info` | `fatal`·`error`·`warn`·`info`·`debug`·`trace`·`silent` |
| `TRUST_PROXY` | | `0` | Render·Fly·Nginx 등 프록시 뒤면 `1` (rate limit 이 실제 IP 를 보게) |
| `MONGO_URI` | **운영 필수** | (빈 값) | 비우면 개발/테스트에서 **인메모리 MongoDB + 데모 데이터**로 뜬다 |
| `MONGO_DB_NAME` | | `totem` | |
| `SEED_ON_EMPTY` | | `false` | 영속 DB 가 비었을 때 기동 시 시드 (개발용) |
| `SEED_DEMO_PASSWORD` | | (빈 값) | `npm run seed` 시 데모 계정 `demo@totem.dev` 비밀번호. 비우면 데모 계정 미생성 |
| `CORS_ORIGINS` | **운영 필수** | 개발: `http://localhost:3100,http://localhost:3200` | 브라우저 호출 허용 출처 = **web 주소, console 주소** (쉼표 구분, 끝 `/` 없이. console 은 `https://yehsb123.github.io` 처럼 **경로 없이 도메인만**) |
| `JWT_ACCESS_SECRET` | **운영 필수 (32자↑)** | 개발 전용 기본값 | 생성: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `JWT_ACCESS_TTL` | | `15m` | access token 수명 |
| `REFRESH_TOKEN_TTL_DAYS` | | `14` | 로그인 유지 기간 |
| `AUTH_HANDOFF_TTL_SECONDS` | | `60` | 메인 → 콘솔 로그인 인계 코드 수명 |
| `BCRYPT_ROUNDS` | | `12` | |
| `RATE_LIMIT_PER_MINUTE` | | `300` | IP 당 전체 요청 |
| `AUTH_RATE_LIMIT_PER_15MIN` | | `30` | IP 당 로그인·가입·refresh |
| `TOURAPI_SERVICE_KEY` | 장소 동기화 시 | | 공공데이터포털 > 한국관광공사_국문 관광정보 서비스_GW > **일반 인증키(Decoding)** |
| `TOURAPI_BASE_URL` | | `https://apis.data.go.kr/B551011/KorService2` | |
| `KAKAO_REST_API_KEY` | 지도검색·길찾기·카카오로그인 시 | | 카카오 디벨로퍼스 > 앱 키 > **REST API 키** |
| `KAKAO_CLIENT_SECRET` | | | 카카오 로그인 > 보안 > Client Secret 을 켠 경우만 |
| `KAKAO_REDIRECT_URIS` | 카카오로그인 시 | | 허용할 redirect URI (쉼표 구분). 카카오 콘솔에 등록한 값과 **정확히 같게**: `https://<web 도메인>/auth/kakao/callback` |
| `REVIEW_IMPORT_ALLOWED_HOSTS` | | `docs.google.com,googleusercontent.com` | 리뷰 CSV 를 받아올 수 있는 호스트 (하위 도메인 포함) |
| `REVIEW_IMPORT_MAX_BYTES` | | `2000000` | |

## web (`apps/web`) — 공개 값만

| 이름 | 설명 | 로컬 예 | 운영 예 |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | API 주소 | `http://localhost:8000` | `https://api.<도메인>` |
| `NEXT_PUBLIC_CONSOLE_URL` | 로그인 후 보낼 콘솔 주소 (**basePath 포함**) | `http://localhost:3200` | `https://yehsb123.github.io/totem` |
| `NEXT_PUBLIC_SITE_URL` | 메인 사이트 자신의 주소 (카카오 redirect 계산) | `http://localhost:3100` | `https://<vercel 도메인>` |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오 **JavaScript 키** (로그인 SDK). 비우면 카카오 버튼 숨김 | | |

## console (`apps/console`) — 공개 값만

| 이름 (로컬 .env.local) | GitHub Variables 이름 | 설명 | 운영 예 |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `CONSOLE_API_BASE_URL` | API 주소 | `https://api.<도메인>` |
| `NEXT_PUBLIC_WEB_URL` | `CONSOLE_WEB_URL` | 로그인 안 됐을 때 보낼 메인 주소 | `https://<vercel 도메인>` |
| `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` | `CONSOLE_KAKAO_MAP_APP_KEY` | 카카오 **JavaScript 키** (지도). 비우면 지도 없이 편집 | |
| `NEXT_PUBLIC_BASE_PATH` | (워크플로가 자동으로 `/<레포이름>`) | GitHub Pages 하위 경로. 로컬은 비움 | `/totem` |

## 카카오 키 정리 (헷갈리기 쉬움)

| 키 | 어디서 | 넣는 곳 | 공개 여부 |
|---|---|---|---|
| JavaScript 키 | 앱 키 > JavaScript 키 | web `NEXT_PUBLIC_KAKAO_JS_KEY`, console `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` | 공개 (대신 플랫폼 > Web 에 **web·console 도메인 등록** 필수) |
| REST API 키 | 앱 키 > REST API 키 | api `KAKAO_REST_API_KEY` | **비공개** (서버만) |
| Client Secret | 카카오 로그인 > 보안 | api `KAKAO_CLIENT_SECRET` | **비공개** |

## 구 버전에서 바뀐 이름

| 구 이름 (위치) | 새 이름 | 비고 |
|---|---|---|
| `JWT_SECRET` (totemBE/.env) | `JWT_ACCESS_SECRET` | |
| `JWT_REFRESH_SECRET` (totemBE/.env) | **삭제** | refresh token 은 이제 서명 토큰이 아니라 DB 세션(해시 저장) |
| `CORS_ORIGIN` (totemBE/.env) | `CORS_ORIGINS` | 여러 개(web·console) |
| `MONGO_URI`, `TOURAPI_SERVICE_KEY`, `PORT` | 그대로 | **유출됐으므로 값은 재발급** (AUDIT S1) |
| `NEXT_PUBLIC_TOUR_API_KEY` (FE/.env.local) | **삭제** | 서비스키를 브라우저에 두면 안 됨 → api `TOURAPI_SERVICE_KEY` |
| `NEXT_PUBLIC_KAKAO_API_KEY` / `NEXT_PUBLIC_KAKAO_MAP_API_KEY` (코드와 파일 이름이 서로 달랐음) | `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` | AUDIT F6 |
| (하드코딩) 카카오 REST 키 `kakaolocal.ts` | api `KAKAO_REST_API_KEY` | **재발급 필요** (AUDIT S2) |
| `NEXT_PUBLIC_SCHEDULER_BASE_URL` (코드 기본값 api.totembe.shop) | **삭제** | 일정 API 가 이 레포 api 로 들어옴 |
| `NEXT_PUBLIC_API_BASE_URL` | 그대로 | |

> 로컬 `apps/api/.env` 는 옛 이름 그대로 남아 있을 수 있다. 위 표대로 이름을 바꾸고, **새로 발급한 값**으로 채운다. 비워 두면 인메모리 DB 로 뜨므로 로컬 개발에는 지장이 없다.
