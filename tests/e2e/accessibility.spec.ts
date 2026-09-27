import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("홈·설정·문제·결과·절차 맵의 WCAG AA 자동 점검", async ({ page }) => {
  async function check() {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
  await page.goto("/");
  await check();
  await page.goto("/setup/common-process");
  await check();
  await page.getByRole("button", { name: "학습 시작하기" }).click();
  await check();
  for (let i = 0; i < 5; i++) {
    await page.getByRole("radio").first().check();
    await page
      .getByRole("button", { name: i === 4 ? "답안 제출" : "다음 문제" })
      .click();
  }
  await check();
  await page.goto("/map");
  await check();
});
