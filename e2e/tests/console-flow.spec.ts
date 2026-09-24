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

    // 카테고리를 누르면 목록을 다시 받는다 — 응답 전에 끌면 끌던 항목이 교체돼 드롭이 사라진다
    const pickCategory = async (name: string, category: string) => {
      const loaded = page.waitForResponse((r) => r.url().includes("/api/v1/places") && r.url().includes(`category=${category}`));
      await page.getByRole("button", { name, exact: true }).click();
      await loaded;
    };
    await pickCategory("숙소", "hotel");
    const hotel = page.getByText("제주신라호텔").first();
    await expect(hotel).toBeVisible();
    await hotel.dragTo(page.getByText("장소를 끌어다 놓으세요").first());
    await expect(page.getByText("숙소는 맨 위 숙소 칸에만 넣을 수 있습니다.")).toBeVisible();
    await hotel.dragTo(page.getByText("숙소를 끌어다 놓으세요"));

    await pickCategory("관광지", "attraction");
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

  test("코스메이커 내 코스: 불러오기·새 코스, 투어가 연결된 코스는 삭제 불가", async () => {
    await page.goto(`${CONSOLE}/coursemaker/`);
    await page.getByRole("button", { name: "내 코스" }).click();
    const row = page.getByRole("dialog").locator("li", { hasText: "제주 동부 2박 3일" });
    await expect(row.getByText("투어 1건 연결")).toBeVisible();
    await expect(row.getByRole("button", { name: "코스 삭제" })).toBeDisabled();
    await row.getByRole("button", { name: "불러오기" }).click();
    await expect(page.getByPlaceholder("예: 제주 동부 2박 3일")).toHaveValue("제주 동부 2박 3일");
    await expect(page.getByText("우진해장국").first()).toBeVisible();
    await page.getByRole("button", { name: "새 코스" }).click();
    await expect(page.getByPlaceholder("예: 제주 동부 2박 3일")).toHaveValue("");
    await expect(page.getByRole("button", { name: "코스 생성 완료" })).toBeVisible();
  });

  test("코스메이커 카카오 검색: 서버 키가 없으면 안내만 보이고 관광정보 탭으로 돌아올 수 있다", async () => {
    await page.goto(`${CONSOLE}/coursemaker/`);
    await page.getByRole("tab", { name: "카카오 검색" }).click();
    await page.getByPlaceholder("가게·장소 이름 (예: 제주 흑돼지)").fill("흑돼지");
    await page.getByRole("button", { name: "검색", exact: true }).click();
    await expect(page.getByText("카카오 검색이 서버에 설정되지 않았습니다.")).toBeVisible();
    await page.getByRole("tab", { name: "관광정보" }).click();
    await expect(page.getByText("성산일출봉").first()).toBeVisible();
  });

  test("코스메이커 동선 계산: 장소 2곳 이상이면 버튼, 서버 키가 없으면 안내로 바뀐다", async () => {
    await page.goto(`${CONSOLE}/coursemaker/`);
    await page.getByRole("button", { name: "내 코스" }).click();
    await page.getByRole("dialog").locator("li", { hasText: "제주 동부 2박 3일" }).getByRole("button", { name: "불러오기" }).click();
    // 1일차: 식당·관광지·식당 3곳 + 숙소 = 4곳
    const calc = page.getByRole("button", { name: "동선 계산 (4곳)" });
    await expect(calc).toBeVisible();
    await calc.click();
    await expect(page.getByText("길찾기(동선 계산)는 서버에 카카오 키가 등록되면 사용할 수 있습니다.")).toBeVisible();
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

test.describe("모바일 375px", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("코스메이커는 탭으로, 끌기 대신 [담기]로 장소를 담고 / 일정 상세는 달력 아래에 보인다", async ({ page }) => {
    await page.goto(`${WEB}/?login=1&next=%2Fcoursemaker%2F`);
    await page.getByPlaceholder("이메일을 입력해주세요").fill(DEMO.email);
    await page.getByPlaceholder("비밀번호를 입력해주세요").fill(DEMO.password);
    await page.locator('form button[type="submit"]').first().click();
    await page.waitForURL(/localhost:3200\/coursemaker/);

    // 가로 스크롤 없음
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

    await page.getByRole("button", { name: "성산일출봉 일정에 담기" }).click();
    await expect(page.getByText(/1일차 07:00~08:00에 담았습니다/)).toBeVisible();
    await page.getByRole("button", { name: "제주신라호텔 일정에 담기" }).click();
    await expect(page.getByText(/1일차 \(숙소\)에 담았습니다/)).toBeVisible();
    await page.getByRole("tab", { name: "일정 (2)" }).click();
    await expect(page.getByText("성산일출봉").last()).toBeVisible();
    await expect(page.getByRole("button", { name: "동선 계산 (2곳)" })).toBeVisible();

    await page.goto(`${CONSOLE}/schedule/`);
    await page.getByRole("button", { name: "다음 달" }).click();
    await page.getByRole("button", { name: /제주 동부 2박 3일/ }).first().click();
    // 데스크톱 사이드바(숨김)와 모바일 영역에 같은 내용이 있으므로 보이는 쪽만
    await expect(page.getByText("연결된 투어 보기").filter({ visible: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "새 일정" }).filter({ visible: true })).toBeVisible();
  });
});

test("멤버 초대: 소유자가 링크를 만들고 → 새 사람이 메인에서 수락 → 같은 조직의 멤버로 콘솔 진입", async ({ page, browser }) => {
  const email = `invitee-${Date.now()}@example.com`;
  await page.goto(`${WEB}/?login=1&next=%2Fsettings%2F`);
  await page.getByPlaceholder("이메일을 입력해주세요").fill(DEMO.email);
  await page.getByPlaceholder("비밀번호를 입력해주세요").fill(DEMO.password);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL(/localhost:3200\/settings/);
  await page.getByRole("button", { name: "멤버 관리" }).click();
  await page.getByPlaceholder("teammate@company.com").fill(email);
  await page.getByRole("button", { name: "초대 링크 만들기" }).click();
  const link = await page.getByLabel("초대 링크").inputValue();
  expect(link).toMatch(/^http:\/\/localhost:3100\/invite\?token=/);
  await expect(page.getByText(email)).toBeVisible();

  // 다른 브라우저(로그인 안 된 사람)로 수락
  const ctx = await browser.newContext();
  const guest = await ctx.newPage();
  await guest.goto(link);
  await expect(guest.getByText("토템 데모 여행사")).toBeVisible();
  await expect(guest.getByLabel("이메일")).toHaveValue(email);
  await guest.getByPlaceholder("이름").fill("초대된 가이드");
  await guest.getByPlaceholder("비밀번호 (영문·숫자 포함 8자 이상)").fill("password1");
  await guest.getByPlaceholder("비밀번호를 한번 더 입력해주세요").fill("password1");
  await guest.getByText("이용약관에 동의합니다").click();
  await guest.getByText("개인정보 수집 및 이용에 동의합니다").click();
  await guest.getByRole("button", { name: "초대 수락하고 시작하기" }).click();
  await guest.waitForURL(/localhost:3200\/schedule/);
  await expect(guest.getByText("초대된 가이드").first()).toBeVisible();
  await expect(guest.getByText("토템 데모 여행사").first()).toBeVisible();
  // 같은 조직 데이터
  await guest.goto(`${CONSOLE}/tours/`);
  await expect(guest.getByText("제주 동부 2박 3일").first()).toBeVisible();
  // 멤버는 관리 불가
  await guest.goto(`${CONSOLE}/settings/`);
  await guest.getByRole("button", { name: "멤버 관리" }).click();
  await expect(guest.getByText("멤버 초대·관리는 소유자와 관리자만 할 수 있습니다.")).toBeVisible();
  await expect(guest.getByRole("button", { name: "초대 링크 만들기" })).toHaveCount(0);

  // 같은 링크는 다시 못 쓴다
  const again = await ctx.newPage();
  await again.goto(link);
  await expect(again.getByText("이미 수락된 초대입니다.")).toBeVisible();
  await ctx.close();

  // 소유자 화면: 새 멤버가 보이고 초대는 '수락'
  await page.reload();
  await page.getByRole("button", { name: "멤버 관리" }).click();
  await expect(page.getByText("초대된 가이드")).toBeVisible();
  await expect(page.getByText("수락", { exact: true })).toBeVisible();
});
