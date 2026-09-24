import { expect, test, type Page } from "@playwright/test";

const WEB = "http://localhost:3100";
const CONSOLE = "http://localhost:3200";
const DEMO = { email: "demo@totem.dev", password: "demo1234" };

/**
 * 메인 로그인 → 콘솔 인계 → 6개 화면 → 로그아웃을 한 브라우저 세션으로 순서대로 검증한다.
 * 데모 데이터(apps/api/src/db/seed/seed.ts)의 이름에 의존한다.
 */
test.describe.serial("메인 → 콘솔 전체 흐름", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });
  test.afterAll(async () => {
    await page.close();
  });

  test("미로그인으로 콘솔에 오면 메인 로그인 모달로 보낸다", async () => {
    await page.goto(`${CONSOLE}/tours/`);
    await page.waitForURL(/localhost:3100\/\?login=1/);
    await expect(page.getByPlaceholder("이메일을 입력해주세요")).toBeVisible();
  });

  test("로그인하면 원래 가려던 콘솔 경로(/tours)로 인계된다", async () => {
    await page.getByPlaceholder("이메일을 입력해주세요").fill(DEMO.email);
    await page.getByPlaceholder("비밀번호를 입력해주세요").fill(DEMO.password);
    await page.locator('form button[type="submit"]').first().click();
    await page.waitForURL(/localhost:3200\/tours\/?$/);
    await expect(page.getByText("데모 매니저").first()).toBeVisible();
    await expect(page.getByText("제주 동부 2박 3일").first()).toBeVisible();
  });

  test("투어관리: 예약 인원이 예상 인원을 넘으면 거부하고 값을 되돌린다", async () => {
    const booked = page.locator("tr", { hasText: "한라산 트레킹 원데이" }).getByLabel("예약 인원");
    const before = await booked.inputValue();
    await booked.fill("99");
    await booked.blur();
    await expect(page.getByText("예약 인원이 예상 인원을 초과할 수 없습니다.")).toBeVisible();
    await expect(booked).toHaveValue(before);
  });

  test("투어관리: 상태를 바꾸면 저장된다", async () => {
    const row = page.locator("tr", { hasText: "제주 동부 2박 3일" });
    await row.getByLabel("상태 변경").selectOption("in_progress");
    await page.reload();
    await expect(page.locator("tr", { hasText: "제주 동부 2박 3일" }).getByLabel("상태 변경")).toHaveValue("in_progress");
  });

  test("일정관리: 라벨·일정이 보이고 새 일정을 만들 수 있다", async () => {
    await page.getByRole("link", { name: "일정관리" }).click();
    await expect(page.getByText("협력 호텔 계약 미팅").first()).toBeVisible();
    await page.getByRole("button", { name: "새 일정" }).first().click();
    await page.getByPlaceholder("예: 제주 동부 투어").fill("E2E 일정");
    await page.getByRole("button", { name: "저장" }).click();
    await expect(page.getByText("일정을 추가했습니다.")).toBeVisible();
    await expect(page.getByText("E2E 일정").first()).toBeVisible();
  });

  test("대시보드: 가장 최근 달의 종합 현황판", async () => {
    await page.getByRole("link", { name: "대시보드" }).click();
    await expect(page.getByText("데이터 2024년 7월 ~ 2025년 6월")).toBeVisible();
    await expect(page.getByText("2025-06 종합현황판")).toBeVisible();
    await expect(page.getByText("6,401,322명")).toBeVisible();
  });

  test("코스메이커: 숙소 규칙을 지키며 코스를 만들면 투어·달력에 올라간다", async () => {
    await page.getByRole("link", { name: "코스메이커" }).click();
    await page.getByPlaceholder("예: 제주 동부 2박 3일").fill("E2E 코스");

    await page.getByRole("button", { name: "숙소", exact: true }).click();
    const hotel = page.getByText("제주신라호텔").first();
    await expect(hotel).toBeVisible();
    await hotel.dragTo(page.getByText("장소를 끌어다 놓으세요").first());
    await expect(page.getByText("숙소는 맨 위 숙소 칸에만 넣을 수 있습니다.")).toBeVisible();
    await hotel.dragTo(page.getByText("숙소를 끌어다 놓으세요"));

    await page.getByRole("button", { name: "관광지", exact: true }).click();
    const spot = page.getByText("성산일출봉").first();
    await expect(spot).toBeVisible();
    await spot.dragTo(page.getByText("장소를 끌어다 놓으세요").first());
    await expect(page.getByText("장소 2곳")).toBeVisible();

    await page.getByRole("button", { name: "코스 생성 완료" }).click();
    await page.waitForURL(/\/tours\/?$/);
    await expect(page.getByText("E2E 코스").first()).toBeVisible();

    await page.getByRole("link", { name: "일정관리" }).click();
    await expect(page.getByText("E2E 코스").first()).toBeVisible();
  });

  test("일정표: 코스 일정표가 일차·시간대·장소로 나온다", async () => {
    await page.getByRole("link", { name: "투어관리" }).click();
    await page.locator("tr", { hasText: "제주 동부 2박 3일" }).getByRole("link", { name: "일정표" }).click();
    await expect(page.getByRole("heading", { name: "제주 동부 2박 3일" })).toBeVisible();
    await expect(page.getByText("1일차")).toBeVisible();
    await expect(page.getByRole("cell", { name: "우진해장국" })).toBeVisible();
    await expect(page.getByRole("button", { name: /PDF로 저장/ })).toBeVisible();
  });

  test("리뷰관리: 투어를 고르면 리뷰와 항목별 평균이 나온다", async () => {
    await page.getByRole("link", { name: "리뷰관리" }).click();
    await page.locator("tr", { hasText: "중문 리조트 가족여행" }).getByRole("button", { name: "리뷰 보기" }).click();
    await expect(page.getByText("가족 모두 만족했어요.")).toBeVisible();
    await expect(page.getByText("평균 (3건)")).toBeVisible();
  });

  test("설정: 결제 정보가 가격표 요금제(Basic)와 일치한다", async () => {
    await page.getByRole("link", { name: "설정" }).click();
    await page.getByRole("button", { name: "결제 정보" }).click();
    await expect(page.getByText("Basic", { exact: true })).toBeVisible();
    await expect(page.getByText("Visa **** 1234")).toBeVisible();
    await expect(page.getByText("29,000원").first()).toBeVisible();
  });

  test("로그아웃하면 메인으로 가고 콘솔은 다시 막힌다", async () => {
    await page.getByRole("button", { name: "로그아웃" }).click();
    await page.waitForURL(/localhost:3100/);
    await page.goto(`${CONSOLE}/schedule/`);
    await page.waitForURL(/localhost:3100\/\?login=1/);
  });
});

test("잘못된 인계 코드·//evil.com next 는 콘솔 밖으로 보내지 않는다 (오픈 리다이렉트 방지)", async ({ page }) => {
  await page.goto(`${CONSOLE}/auth/callback/?code=invalid-code-000000&next=//evil.com`);
  await expect(page.getByText("다시 로그인하기")).toBeVisible();
  expect(new URL(page.url()).host).toBe("localhost:3200");
});

test("회원가입 → 콘솔 진입 → 새 조직은 빈 데이터 + 기본 라벨 3개", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto(`${WEB}/`);
  await page.getByRole("banner").getByRole("button", { name: "무료로 시작하기" }).click();
  await page.getByPlaceholder("업무용 이메일을 입력해주세요").fill(email);
  await page.locator('form button[type="submit"]').first().click();
  await page.getByPlaceholder("회사 이름을 입력해주세요").fill("E2E 여행사");
  await page.getByPlaceholder("사용자 이름을 입력해주세요").fill("E2E 사용자");
  await page.getByPlaceholder("비밀번호 (영문·숫자 포함 8자 이상)").fill("password1");
  await page.getByPlaceholder("비밀번호를 한번 더 입력해주세요").fill("password1");
  await page.locator('form button[type="submit"]').first().click();
  await page.getByText("전체 동의").click();
  await page.locator('form button[type="submit"]').first().click();
  // 완료 화면 → 콘솔 시작
  await page.getByRole("button", { name: "ToTem 시작하기" }).click();
  await page.waitForURL(/localhost:3200/);
  await expect(page.getByText("E2E 여행사").first()).toBeVisible();
  await page.goto(`${CONSOLE}/tours/`);
  await expect(page.getByText("조건에 맞는 투어가 없습니다.")).toBeVisible();
  await page.goto(`${CONSOLE}/schedule/`);
  for (const name of ["투어", "미팅", "휴무"]) await expect(page.getByTitle(`${name} 일정 추가`)).toBeVisible();
  await page.goto(`${CONSOLE}/settings/`);
  await page.getByRole("button", { name: "결제 정보" }).click();
  await expect(page.getByText("무료 체험")).toBeVisible();
});
