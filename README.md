# Totem

투어·코스 운영 B2B SaaS — 코스 설계(코스메이커), 투어 회차·좌석 관리, 일정 달력, 리뷰 수집, 지역 관광 통계 대시보드.

| 앱 | 역할 | 기술 | 배포 |
|---|---|---|---|
| `apps/web` | 메인 사이트: 서비스 소개·가격·리소스, 로그인·회원가입·초대 수락 | Next.js 16 · React 19 · Tailwind 4 | Vercel |
| `apps/console` | 로그인 후 기능 화면 6종 + 일정표 | Next.js 16 (정적 export) · react-dnd · Recharts · Kakao Maps | GitHub Actions → GitHub Pages |
| `apps/api` | REST API | Express 5 · TypeScript · Mongoose(MongoDB) · zod · pino | 미정 (Dockerfile — CI 가 매번 이미지 빌드·기동 검증) |
| `packages/shared` | API 계약 (zod 스키마·타입·경로) + HTTP 클라이언트 | TypeScript · zod | web·console·api 가 함께 사용 |

## 구조

```
totem/
├─ apps/
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ config/env.ts        환경변수 정의·검증 (운영 필수값 없으면 기동 거부)
│  │  │  ├─ db/models/           MongoDB 컬렉션 15종 (docs/DATABASE.md)
│  │  │  ├─ db/serialize.ts      DB 문서 → API 응답 변환
│  │  │  ├─ db/seed/ · purge.ts  대시보드 통계·장소 샘플·데모 조직 / 삭제된 조직 영구 정리
│  │  │  ├─ lib/                 http(오류·검증)·logger·redact(로그 가리기)·rate-limit
│  │  │  ├─ middlewares/         인증(requireAuth·requireRole)·에러
│  │  │  ├─ modules/<도메인>/     auth·users·org(멤버·초대)·billing·places·maps·courses·tours·reviews·schedule·dashboard
│  │  │  ├─ app.ts · server.ts
│  │  └─ test/                   vitest + supertest (인메모리 MongoDB, 인덱스 없는 조회는 실패)
│  ├─ web/src/app/               /, /pricing, /resources/*, /features/*, /invite, /auth/kakao/callback, robots·sitemap
│  └─ console/src/
│     ├─ app/(console)/          schedule · dashboard · coursemaker · tours · reviews · settings · itinerary
│     ├─ app/auth/callback/      메인에서 넘어온 로그인 인계 코드 교환
│     ├─ components/             ConsoleShell(사이드바·헤더) · ui(모달·버튼·토스트)
│     └─ lib/                    env · api(클라이언트) · session(인증 게이트) · format
├─ packages/shared/src/          도메인별 계약(auth·users·members·billing·places·courses·tours·reviews·schedules·dashboard) · routes · client · navigation · zod-ko(오류 문구)
├─ packages/shared/csp.mjs       web·console 공통 CSP
├─ e2e/                          실제 브라우저 E2E (Playwright: 로그인 → 콘솔 전 화면, 모바일, 키보드, SEO)
├─ docs/                         AUDIT · BACKLOG · API · DATABASE · ENV · DEPLOY · SECURITY · WORKLOG
└─ .github/workflows/            ci.yml · deploy-console.yml
```

## 시작하기

Node 22 (`.nvmrc`). 모든 명령은 **레포 루트**에서.

```bash
npm install
npm run dev            # 세 앱을 한 번에 (아래 셋을 동시에 실행)
#   api      http://localhost:8000/api/v1/health   (npm run dev:api)
#   web      http://localhost:3100                 (npm run dev:web)
#   console  http://localhost:3200                 (npm run dev:console)
```

- **환경변수 파일 없이 바로 뜬다**: `MONGO_URI` 가 비어 있으면 인메모리 MongoDB + 데모 데이터 → http://localhost:3100 에서 `demo@totem.dev` / `demo1234` 로 로그인
- 실제 DB·외부 키를 쓰려면: `apps/api` 에서 `cp .env.example .env`, `apps/web`·`apps/console` 에서 `cp .env.example .env.local` → 설명은 [`docs/ENV.md`](docs/ENV.md)
- 포트 3000 은 쓰지 않는다 (8000·3100·3200 고정)

| 명령 | 내용 |
|---|---|
| `npm run typecheck` | 전 패키지 타입 검사 |
| `npm run test` | API 테스트 (계약·인증 적용 범위 포함) |
| `npm run e2e` | 브라우저 E2E (세 앱을 자동으로 띄움 — 이미 떠 있으면 그 서버를 씀, 로컬은 설치된 Chrome 으로 `E2E_CHANNEL=chrome`) |
| `npm run build` | 전 앱 빌드 |
| `npm run seed` | MONGO_URI DB 에 공용 데이터 시드 (`SEED_DEMO_PASSWORD` 있으면 데모 조직). 운영 이미지에서는 `node dist/db/seed/run.js` (docs/DEPLOY.md) |

## 문서

| 문서 | 내용 |
|---|---|
| [docs/AUDIT.md](docs/AUDIT.md) | 정합성 점검 결과 — 재구성 전 소스(§1~7)와 이후 재점검 1~16차(보안·성능·접근성·배포 등) |
| [docs/BACKLOG.md](docs/BACKLOG.md) | 작업 백로그와 진행 상태 |
| [docs/API.md](docs/API.md) | 엔드포인트 ↔ 화면 매핑, 응답·오류 형식, 로그인 흐름 |
| [docs/DATABASE.md](docs/DATABASE.md) | 컬렉션 ↔ 화면, 필드·인덱스·규칙 |
| [docs/ENV.md](docs/ENV.md) | 환경변수 전체 (어디에 두는지, 구 이름 대응표) |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Vercel·GitHub Pages·API 배포 설정, 롤백 |
| [docs/SECURITY.md](docs/SECURITY.md) | 보안 통제(근거 코드·테스트)와 알고 받아들인 위험 |

## 개발 규칙

- `dev` 에서 작업 → PR → `main` 머지 = 운영 배포. CI(타입·lint·테스트·빌드·E2E·API 이미지) 통과 필수
- 커밋은 Conventional Commits (`feat:` `fix:` `refactor:` `docs:` `ci:` `chore:`)
- API 경로·필드는 `packages/shared` 에서만 정의한다
- 비밀값은 커밋하지 않는다. `NEXT_PUBLIC_*` 에 비밀값을 넣지 않는다

This project is private and proprietary.
