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
  ).toBeEnabled();
  await expect(page.getByText(/시연/)).toHaveCount(0);
  await page.getByRole("button", { name: "학습 시작하기" }).click();
  await expect(page).toHaveURL(/naval-acquisition-learning\/#\/quiz$/);
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "다음 문제" }).click();
  page.on("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(page.locator(".question-number")).toHaveText("QUESTION 02");
  for (let i = 1; i < 5; i++) {
    await expect(page.locator(".question-number")).toHaveText(
      `QUESTION ${String(i + 1).padStart(2, "0")}`,
    );
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

test("Pages 용어 퀴즈 직접 진입과 새로고침 복원", async ({ page }) => {
  await page.goto("./#/setup/common-terms");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "방위사업 용어 퀴즈", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".setup-summary")).toContainText("용어형 5문항");
  await page.getByRole("button", { name: "학습 시작하기" }).click();
  await expect(page.getByText("공통 업무 · 용어 퀴즈")).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(4);
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "다음 문제" }).click();
  page.on("dialog", (dialog) => dialog.accept());
  await page.reload();
  await expect(page.locator(".question-number")).toHaveText("QUESTION 02");
});

test("Pages 공통 업무 직접 진입과 계약 상황형·근거 확인", async ({ page }) => {
  await page.goto("./#/common");
  await expect(
    page.getByRole("heading", { name: "공통 업무 문제", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".unit-card")).toHaveCount(4);
  await page.goto("./#/setup/common-contract");
  await page.reload();
  await expect(page.locator(".setup-summary")).toContainText(
    "계약관리 실무 상황형 5문항",
  );
  await page.getByRole("button", { name: "학습 시작하기" }).click();
  await expect(page.getByText("공통 업무 · 실무 상황형")).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await page.getByRole("radio").first().check();
    await page
      .getByRole("button", { name: i === 4 ? "답안 제출" : "다음 문제" })
      .click();
  }
  await page.getByRole("link", { name: /오답 복습하기|해설 확인하기/ }).click();
  await expect(page.locator(".work-steps").first()).toBeVisible();
  await expect(page.locator(".citation").first()).toBeVisible();
  await expect(page.locator(".source-link").first()).toHaveAttribute(
    "href",
    /^https:\/\/www\.law\.go\.kr\//,
  );
});
