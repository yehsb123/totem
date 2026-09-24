import { API_PREFIX, ROUTES } from "@totem/shared";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import BackLink from "../BackLink";

export const metadata: Metadata = {
  title: "API 문서",
  description: "TOTEM API 의 인증 방식, 응답 형식, 코스·투어·일정 주요 엔드포인트를 안내합니다.",
  alternates: { canonical: "/resources/api" },
};

// 경로는 서버·클라이언트가 함께 쓰는 @totem/shared 의 ROUTES 에서 가져온다 (문서와 실제 경로 불일치 방지)
const p = (path: string) => `${API_PREFIX}${path}`;

const ENDPOINTS: { method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; path: string; desc: string }[] = [
  { method: "POST", path: p(ROUTES.auth.login), desc: "이메일·비밀번호 로그인 (토큰 발급)" },
  { method: "POST", path: p(ROUTES.auth.refresh), desc: "refresh token 으로 토큰 재발급" },
  { method: "GET", path: p(ROUTES.users.me), desc: "내 프로필 조회" },
  { method: "GET", path: p(ROUTES.courses.list), desc: "코스 목록 (page, limit, q)" },
  { method: "POST", path: p(ROUTES.courses.list), desc: "코스 생성 (선택적으로 투어 동시 생성)" },
  { method: "GET", path: p(ROUTES.courses.detail(":id")), desc: "코스 상세" },
  { method: "GET", path: p(ROUTES.tours.list), desc: "투어 목록 (상태·유형 필터)" },
  { method: "GET", path: p(ROUTES.tours.reviews(":tourId")), desc: "투어별 리뷰 목록" },
  { method: "GET", path: p(ROUTES.schedule.events), desc: "일정(캘린더) 이벤트 목록" },
  { method: "GET", path: p(ROUTES.dashboard.overview), desc: "관광 데이터 대시보드 요약" },
];

const METHOD_STYLE: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700",
  POST: "bg-sky-100 text-sky-700",
  PUT: "bg-amber-100 text-amber-700",
  PATCH: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
};

function Method({ m }: { m: string }) {
  return (
    <span className={`inline-block min-w-14 rounded px-2 py-0.5 text-center font-mono text-xs font-bold ${METHOD_STYLE[m]}`}>
      {m}
    </span>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm leading-relaxed text-slate-100">
      <code>{children}</code>
    </pre>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-2xl font-bold text-slate-900">{title}</h2>
      <div className="space-y-4 rounded-xl bg-slate-50 p-6 text-slate-700">{children}</div>
    </section>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="bg-white px-4 py-20 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <BackLink />

        <h1 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">API 문서</h1>
        <p className="mb-12 mt-4 text-center text-base text-slate-600 sm:text-lg">
          TOTEM API 로 코스·투어·일정 데이터를 조회하고 관리하는 방법을 안내합니다.
        </p>

        <Section title="1. 기본 규칙">
          <p>
            모든 경로는 <code className="font-mono text-indigo-600">{API_PREFIX}</code> 아래에 있으며 요청·응답 본문은
            JSON 입니다. 성공 응답은 <code className="font-mono">data</code>(목록이면 <code className="font-mono">meta</code>{" "}
            포함)로, 실패 응답은 <code className="font-mono">error</code> 로 감싸서 돌려줍니다.
          </p>
          <Code>{`// 성공 (목록)
{ "data": [ ... ], "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }

// 실패
{ "error": { "code": "VALIDATION_ERROR", "message": "이메일 형식이 올바르지 않습니다." } }`}</Code>
        </Section>

        <Section title="2. 인증">
          <p>
            로그인으로 발급받은 access token 을 <code className="font-mono">Authorization</code> 헤더에 담아 보냅니다.
            access token 이 만료되면(401) refresh token 으로 재발급받습니다.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Method m="POST" />
            <span className="font-mono text-sm">{p(ROUTES.auth.login)}</span>
          </div>
          <Code>{`// 요청
{ "email": "you@agency.com", "password": "********" }

// 응답
{ "data": { "accessToken": "eyJ...", "refreshToken": "...", "expiresIn": 900, "user": { ... } } }

// 이후 요청 헤더
Authorization: Bearer <accessToken>`}</Code>
        </Section>

        <Section title="3. 코스 목록 조회">
          <div className="flex flex-wrap items-center gap-2">
            <Method m="GET" />
            <span className="font-mono text-sm">{p(ROUTES.courses.list)}?page=1&amp;limit=20</span>
          </div>
          <Code>{`{
  "data": [
    {
      "id": "66f0c2a1b3e4d5f6a7b8c9d0",
      "title": "제주도 힐링 코스",
      "startDate": "2025-10-15",
      "endDate": "2025-10-18",
      "pickupLocation": "제주공항",
      "placeCount": 9,
      "createdAt": "2025-09-20T02:10:00.000Z",
      "updatedAt": "2025-09-20T02:10:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}`}</Code>
        </Section>

        <Section title="4. 주요 엔드포인트">
          <ul className="divide-y divide-slate-200">
            {ENDPOINTS.map((e) => (
              <li key={`${e.method} ${e.path}`} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="flex items-center gap-2">
                  <Method m={e.method} />
                  <span className="break-all font-mono text-sm text-slate-900">{e.path}</span>
                </span>
                <span className="text-sm text-slate-500 sm:ml-auto">{e.desc}</span>
              </li>
            ))}
          </ul>
        </Section>

        <p className="text-sm text-slate-500">
          외부 연동용 API 키 발급은 준비 중입니다. 현재는 TOTEM 계정으로 로그인해 발급받은 토큰으로 호출할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
