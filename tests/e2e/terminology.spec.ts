import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { terminologyDefinitions } from "../../src/terminology-content";

test("마지막 용어 단원에서 용어만 선택하고 복원·채점·근거 복습·오답 재도전", async ({
  page,
}) => {
  await page.goto("/common");
  const last = page.locator(".unit-card").last();
  await expect(last).toContainText("방위사업 용어 퀴즈");
  await expect(last).toContainText("용어형 120문항");
  await last.click();
  await expect(page).toHaveURL(/\/setup\/common-terms$/);
  await expect(page.locator(".setup-summary")).toContainText("용어형 5문항");
  await page.getByRole("radio", { name: /20문제/ }).check();
  await expect(page.locator(".setup-summary")).toContainText("용어형 20문항");
  await page.getByRole("radio", { name: /5문제/ }).check();
  await page.getByRole("button", { name: "학습 시작하기" }).click();
  await expect(page.getByText("공통 업무 · 용어 퀴즈")).toBeVisible();
  const words = new Set(terminologyDefinitions.map((entry) => entry.term));
  const options = await page
    .locator(".answer > span:nth-of-type(2)")
    .allTextContents();
  expect(options).toHaveLength(4);
  expect(options.every((option) => words.has(option))).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("radio").first().check();
  const stored = await page.evaluate(() =>
    sessionStorage.getItem("hamjeong.session.v2"),
  );
  page.on("dialog", (dialog) => dialog.accept());
  await page.reload();
  expect(
    await page.evaluate(() => sessionStorage.getItem("hamjeong.session.v2")),
  ).toBe(stored);
  for (let index = 0; index < 5; index++) {
    const wrong = await page.evaluate(
      (index) =>
        (JSON.parse(sessionStorage.getItem("hamjeong.session.v2")!).items[index]
          .answerIndex +
          1) %
        4,
      index,
    );
    await page.getByRole("radio").nth(wrong).check();
    await page
      .getByRole("button", { name: index === 4 ? "답안 제출" : "다음 문제" })
      .click();
  }
  await expect(page.locator(".score-mark strong")).toHaveText("0");
  await page.getByRole("link", { name: "오답 복습하기" }).click();
  await expect(page.locator(".review-card")).toHaveCount(5);
  await expect(page.locator(".citation")).toHaveCount(5);
  await expect(page.locator(".work-steps")).toHaveCount(0);
  await expect(page.locator(".source-link").first()).toHaveAttribute(
    "href",
    /^https:\/\/www\.law\.go\.kr\//,
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "틀린 문제 다시 풀기" }).click();
  await expect(page.getByText("공통 업무 · 용어 퀴즈")).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("hamjeong.session.v2")!).items.every(
        (q: { unitId: string }) => q.unitId === "common-terms",
      ),
    ),
  ).toBe(true);
});
