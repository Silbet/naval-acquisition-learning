import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("함정·공통 카테고리 분리와 공통 상황형의 해설·근거·저장 복원", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".unit-grid .unit-card")).toHaveCount(6);
  await page.getByRole("link", { name: /UNIT 01 구축함/ }).click();
  await expect(page.locator(".setup-summary")).toContainText("공통 혼합 없음");
  await page.getByRole("button", { name: "학습 시작하기" }).click();
  expect(
    await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("hamjeong.session.v2")!).items.every(
        (q: { unitId: string }) => q.unitId === "destroyer",
      ),
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "학습 종료" }).click();
  await page.getByRole("button", { name: "종료하기", exact: true }).click();
  await page.getByRole("link", { name: "공통 업무 문제", exact: true }).click();
  await expect(page).toHaveURL(/\/common$/);
  await expect(page.locator(".unit-grid .unit-card")).toHaveCount(3);
  await expect(page.getByText(/실제 기출문제가 아닙니다/)).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: /업무 02 계약관리 실무/ }).click();
  await page.getByRole("button", { name: "학습 시작하기" }).click();
  await expect(page.getByText("공통 업무 · 실무 상황형")).toBeVisible();
  const before = await page.evaluate(() =>
    sessionStorage.getItem("hamjeong.session.v2"),
  );
  page.on("dialog", (dialog) => dialog.accept());
  await page.reload();
  expect(
    await page.evaluate(() => sessionStorage.getItem("hamjeong.session.v2")),
  ).toBe(before);
  for (let i = 0; i < 5; i++) {
    const wrong = await page.evaluate(
      (index) =>
        (JSON.parse(sessionStorage.getItem("hamjeong.session.v2")!).items[index]
          .answerIndex +
          1) %
        4,
      i,
    );
    await page.getByRole("radio").nth(wrong).check();
    await page
      .getByRole("button", { name: i === 4 ? "답안 제출" : "다음 문제" })
      .click();
  }
  await page.getByRole("link", { name: "오답 복습하기" }).click();
  await expect(page.locator(".review-card")).toHaveCount(5);
  await expect(page.locator(".work-steps")).toHaveCount(5);
  await expect(page.locator(".citation")).toHaveCount(5);
  await expect(page.locator(".source-link").first()).toHaveAttribute(
    "href",
    /^https:\/\/www\.law\.go\.kr\//,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const reviewAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(reviewAxe.violations).toEqual([]);
});
