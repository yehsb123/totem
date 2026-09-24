# 배포

| 앱 | 대상 | 트리거 | 설정 위치 |
|---|---|---|---|
| web (메인·로그인) | **Vercel** | Vercel Git 연동 — `main` push 시 운영, PR·`dev` 는 미리보기 | Vercel 대시보드 |
| console (기능화면) | **GitHub Pages** | `.github/workflows/deploy-console.yml` — `main` 에 console/shared 변경 머지 시 | GitHub Settings |
| api | **미정** (OPS-004) | — | `apps/api/Dockerfile` 준비됨 |
| (공통) | CI | `.github/workflows/ci.yml` — 모든 PR, `dev`·`main` push | — |

브랜치: 작업은 `dev` → PR → `main` 머지 = 운영 배포. `main` 에 직접 커밋하지 않는다.

## 1. console → GitHub Pages (한 번만 설정)

1. GitHub 레포 > **Settings > Pages** > Build and deployment > Source: **GitHub Actions**
2. **Settings > Secrets and variables > Actions > Variables** 탭 > New repository variable
   | 이름 | 값 |
   |---|---|
   | `CONSOLE_API_BASE_URL` | API 운영 주소 (끝 `/` 없이) |
   | `CONSOLE_WEB_URL` | Vercel 운영 주소 |
   | `CONSOLE_KAKAO_MAP_APP_KEY` | 카카오 JavaScript 키 (선택) |
3. Actions 탭 > "Deploy console to GitHub Pages" > Run workflow (또는 main 머지)
4. 확인: `https://yehsb123.github.io/totem/` → 로그인 안 된 상태면 메인 사이트로 이동하면 정상

변수가 없으면 워크플로가 "Actions Variables 가 없습니다" 로 **일부러 실패**한다 (잘못된 주소로 배포되는 것 방지).

## 2. web → Vercel (한 번만 설정)

1. vercel.com > Add New Project > GitHub `yehsb123/totem` Import
2. **Root Directory: `apps/web`** (Framework: Next.js 자동 인식. npm workspaces 라 루트 lockfile 로 설치됨)
3. Environment Variables (Production·Preview 각각):
   `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_CONSOLE_URL`(= `https://yehsb123.github.io/totem`), `NEXT_PUBLIC_SITE_URL`(= Vercel 주소), `NEXT_PUBLIC_KAKAO_JS_KEY`
4. Settings > Git > **Ignored Build Step**: `git diff --quiet HEAD^ HEAD -- apps/web packages/shared package-lock.json` (web 과 무관한 커밋엔 빌드 생략)
5. Production Branch: `main`

## 3. api (배포처 결정 필요)

필요 조건: Node 22 상시 실행(또는 컨테이너), MongoDB Atlas 접근, HTTPS.
후보: Render(Web Service, Dockerfile) · Fly.io · Railway · 사내 VM(Docker). 결정되면 워크플로를 추가한다.

```bash
# 모노레포 루트에서
docker build -f apps/api/Dockerfile -t totem-api .
docker run -p 8000:8000 --env-file apps/api/.env totem-api
```

운영 체크리스트
- `NODE_ENV=production`, `MONGO_URI`, `JWT_ACCESS_SECRET`(32자↑), `CORS_ORIGINS`(= web 도메인, `https://yehsb123.github.io`) — 없으면 기동 거부
- 프록시 뒤면 `TRUST_PROXY=1`
- 최초 1회 `npm run seed -w @totem/api` (대시보드 통계·장소 샘플), 이후 관리자 계정으로 `POST /places/sync` 로 TourAPI 전체 동기화
- 헬스체크: `GET /api/v1/health` → 200 이면 정상 (DB 끊기면 503)

## 4. 외부 콘솔 설정

| 서비스 | 설정 |
|---|---|
| 카카오 디벨로퍼스 > 플랫폼 > Web | web 도메인, `https://yehsb123.github.io` 등록 (JS SDK·지도) |
| 카카오 로그인 > Redirect URI | `https://<web 도메인>/auth/kakao/callback` (+ 로컬 `http://localhost:3100/auth/kakao/callback`) — api `KAKAO_REDIRECT_URIS` 와 동일하게 |
| MongoDB Atlas > Network Access | API 서버의 출구 IP 허용 |

## 롤백

- console: Actions 에서 이전 성공 커밋의 워크플로 "Re-run" 또는 `git revert` 후 main 머지
- web: Vercel > Deployments > 이전 배포 "Promote to Production"
- api: 이전 이미지 태그로 재배포

## 로컬 전체 실행

```bash
npm install                 # 루트에서 한 번
npm run dev:api             # :8000  (MONGO_URI 비우면 인메모리 DB + 데모 계정 demo@totem.dev / demo1234)
npm run dev:web             # :3100
npm run dev:console         # :3200
```
메인(3100)에서 로그인 → 콘솔(3200)로 자동 이동.
