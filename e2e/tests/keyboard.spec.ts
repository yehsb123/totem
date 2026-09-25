import { expect, test, type Page } from "@playwright/test";

const WEB = "http://localhost:3100";
const CONSOLE = "http://localhost:3200";

/** Tab 을 여러 번 눌러도 포커스가 대화상자 밖으로 나가지 않는지 */
async function expectTabTrapped(page: Page, presses = 25) {
  for (let i = 0; i < presses; i++) {
    await page.keyboard.press(i % 3 === 2 ? "Shift+Tab" : "Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), `Tab ${i + 1}번째에 모달 밖으로 나감`).toBe(true);
  }
}

test("메인 로그인 모달: 열면 입력칸 포커스 → Tab 은 모달 안에서만 → Esc 로 닫으면 연 버튼으로", async ({ page }) => {
  await page.goto(WEB);
  const opener = page.getByRole("banner").getByRole("button", { name: "로그인", exact: true }).first();
  await opener.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByPlaceholder("이메일을 입력해주세요")).toBeFocused();
  await expectTabTrapped(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("콘솔 모달: 키보드로 열고 → 첫 입력칸 포커스 → Tab 가둠 → Esc 로 닫으면 연 버튼으로", async ({ page }) => {
  await page.goto(`${WEB}/?login=1&next=%2Ftours%2F`);
  await page.getByPlaceholder("이메일을 입력해주세요").fill("demo@totem.dev");
  await page.getByPlaceholder("비밀번호를 입력해주세요").fill("demo1234");
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL(`${CONSOLE}/tours/`);
  const opener = page.getByRole("button", { name: "코스 없이 투어 추가" });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "투어 추가" });
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("INPUT");
  await expectTabTrapped(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("메인 모바일 메뉴: Esc 로 닫히고, 이동하면 닫힌다", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await page.goto(WEB);
  const toggle = page.getByRole("banner").getByRole("button", { name: /메뉴/ });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await page.getByRole("banner").getByRole("link", { name: "요금제" }).filter({ visible: true }).first().click();
  await page.waitForURL(`${WEB}/pricing`);
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await page.close();
});
