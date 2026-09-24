# Totem

투어·코스 운영 B2B SaaS — 코스 설계(코스메이커), 투어 회차·좌석 관리, 일정 달력, 리뷰 수집, 지역 관광 통계 대시보드.

| 앱 | 역할 | 기술 | 배포 |
|---|---|---|---|
| `apps/web` | 메인 사이트: 서비스 소개·가격·리소스, 로그인·회원가입 | Next.js 15 · React 19 · Tailwind 4 | Vercel |
| `apps/console` | 로그인 후 기능 화면 6종 | Next.js 15 (정적 export) · react-dnd · Recharts · Kakao Maps | GitHub Actions → GitHub Pages |
| `apps/api` | REST API | Express 5 · TypeScript · Mongoose(MongoDB) · zod · pino | 미정 (Dockerfile 준비) |
| `packages/shared` | API 계약 (zod 스키마·타입·경로) + HTTP 클라이언트 | TypeScript · zod | web·console·api 가 함께 사용 |

## 구조

```
totem/
├─ apps/
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ config/env.ts        환경변수 정의·검증 (운영 필수값 없으면 기동 거부)
│  │  │  ├─ db/models/           MongoDB 컬렉션 14종 (docs/DATABASE.md)
│  │  │  ├─ db/serialize.ts      DB 문서 → API 응답 변환
│  │  │  ├─ db/seed/             대시보드 통계·장소 샘플·데모 조직
│  │  │  ├─ middlewares/         인증(requireAuth·requireRole)·에러
│  │  │  ├─ modules/<도메인>/     auth·users·billing·places·maps·courses·tours·reviews·schedule·dashboard
│  │  │  ├─ app.ts · server.ts
│  │  └─ test/                   vitest + supertest (인메모리 MongoDB)
│  ├─ web/src/app/               /, /pricing, /resources/*, /features/*, /auth/kakao/callback
│  └─ console/src/
│     ├─ app/(console)/          schedule · dashboard · coursemaker · tours · reviews · settings
│     ├─ app/auth/callback/      메인에서 넘어온 로그인 인계 코드 교환
│     ├─ components/             ConsoleShell(사이드바·헤더) · ui(모달·버튼·토스트)
│     └─ lib/                    env · api(클라이언트) · session(인증 게이트) · format
├─ packages/shared/src/          auth · users · billing · places · courses · tours · reviews · schedules · dashboard · routes · client
├─ e2e/                          실제 브라우저 E2E (Playwright: 메인 로그인 → 콘솔 전 화면, 모바일)
├─ docs/                         AUDIT · BACKLOG · API · DATABASE · ENV · DEPLOY · WORKLOG
└─ .github/workflows/            ci.yml · deploy-console.yml
```

## 시작하기

Node 22 (`.nvmrc`). 모든 명령은 **레포 루트**에서.

```bash
npm install
npm run dev:api        # http://localhost:8000/api/v1/health
npm run dev:web        # http://localhost:3100
npm run dev:console    # http://localhost:3200
```

- `apps/api/.env` 의 `MONGO_URI` 를 비워 두면 **인메모리 MongoDB + 데모 데이터**로 뜬다 → 데모 계정 `demo@totem.dev` / `demo1234`
- 환경변수: 각 앱의 `.env.example` 복사 → 설명은 [`docs/ENV.md`](docs/ENV.md)

| 명령 | 내용 |
|---|---|
| `npm run typecheck` | 전 패키지 타입 검사 |
| `npm run test` | API 테스트 (계약·인증 적용 범위 포함) |
| `npm run e2e` | 브라우저 E2E (세 앱을 자동으로 띄움, 로컬은 `E2E_CHANNEL=chrome`) |
| `npm run build` | 전 앱 빌드 |
| `npm run seed` | MONGO_URI DB 에 공용 데이터 시드 (`SEED_DEMO_PASSWORD` 있으면 데모 조직) |

## 문서

| 문서 | 내용 |
|---|---|
| [docs/AUDIT.md](docs/AUDIT.md) | 재구성 전 소스 정합성 점검 결과 (보안·계약 불일치·로직 오류) |
| [docs/BACKLOG.md](docs/BACKLOG.md) | 작업 백로그와 진행 상태 |
| [docs/API.md](docs/API.md) | 엔드포인트 ↔ 화면 매핑, 응답·오류 형식, 로그인 흐름 |
| [docs/DATABASE.md](docs/DATABASE.md) | 컬렉션 ↔ 화면, 필드·인덱스·규칙 |
| [docs/ENV.md](docs/ENV.md) | 환경변수 전체 (어디에 두는지, 구 이름 대응표) |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Vercel·GitHub Pages·API 배포 설정, 롤백 |

## 개발 규칙

- `dev` 에서 작업 → PR → `main` 머지 = 운영 배포. CI(타입·테스트·빌드) 통과 필수
- 커밋은 Conventional Commits (`feat:` `fix:` `refactor:` `docs:` `ci:` `chore:`)
- API 경로·필드는 `packages/shared` 에서만 정의한다
- 비밀값은 커밋하지 않는다. `NEXT_PUBLIC_*` 에 비밀값을 넣지 않는다

This project is private and proprietary.
