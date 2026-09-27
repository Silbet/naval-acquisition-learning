import { test, expect } from "@playwright/test";

test("Pages 하위 경로 자산, 직접 진입, 새로고침, 채점", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto("./#/setup/destroyer");
  await expect(
    page.getByRole("button", { name: "학습 시작하기" }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: "시연용 문제로 연습하기" }).check();
  await page.getByRole("button", { name: "학습 시작하기" }).click();
  await expect(page).toHaveURL(/naval-acquisition-learning\/#\/quiz$/);
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "다음 문제" }).click();
  page.on("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(page.locator(".question-number")).toHaveText("QUESTION 02");
  for (let i = 1; i < 5; i++) {
    await page.getByRole("radio").first().check();
    await page
      .getByRole("button", { name: i === 4 ? "답안 제출" : "다음 문제" })
      .click();
  }
  await expect(page).toHaveURL(/#\/result$/);
  await expect(page.locator(".score-mark strong")).toBeVisible();
  await page.reload();
  await expect(page.locator(".score-mark strong")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
