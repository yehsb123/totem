import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { expect, test } from "@playwright/test";

const WEB = "http://localhost:3100";
/** 색인하지 않는 페이지 (로그인 흐름 전용·이동 전용) — 이 밖의 모든 page.tsx 는 sitemap 에 있어야 한다 */
const NOT_IN_SITEMAP = ["/invite", "/auth/kakao/callback", "/features"];

/** apps/web/src/app 아래 page.tsx → 경로 */
function appRoutes(dir = join(__dirname, "../../apps/web/src/app")): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f === "page.tsx") out.push("/" + relative(dir, d).split(sep).filter(Boolean).join("/"));
    }
  };
  walk(dir);
  return out.map((r) => (r === "/" ? "/" : r.replace(/\/$/, "")));
}

test("sitemap: 앱의 공개 페이지가 빠짐없이 있고, 모든 주소가 200·색인 허용·canonical 일치·h1 하나·제목 단계 연속", async ({ page, request }) => {
  const xml = await (await request.get(`${WEB}/sitemap.xml`)).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, "") || "/");
  const expected = appRoutes().filter((r) => !NOT_IN_SITEMAP.includes(r));
  expect([...paths].sort()).toEqual([...expected].sort());

  for (const p of paths) {
    const res = await page.goto(`${WEB}${p}`);
    expect(res?.status(), p).toBe(200);
    const r = await page.evaluate(() => {
      const levels = [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => Number(h.tagName[1]));
      return {
        robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
        h1: levels.filter((l) => l === 1).length,
        skip: levels.some((l, i) => i > 0 && l - levels[i - 1] > 1),
      };
    });
    expect(r.robots, p).not.toContain("noindex");
    expect(new URL(r.canonical, WEB).pathname.replace(/\/$/, "") || "/", p).toBe(p);
    expect(r.h1, p).toBe(1);
    expect(r.skip, p).toBe(false);
  }
});

test("robots.txt: 로그인 흐름은 막고 sitemap 을 알린다 / /features 는 영구 이동", async ({ request }) => {
  const robots = await (await request.get(`${WEB}/robots.txt`)).text();
  expect(robots).toContain("Disallow: /invite");
  expect(robots).toContain("Disallow: /auth/");
  expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
  const r = await request.get(`${WEB}/features`, { maxRedirects: 0 });
  expect(r.status()).toBe(308);
  expect(r.headers()["location"]).toContain("/features/coursemaker");
});
