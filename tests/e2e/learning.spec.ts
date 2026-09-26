import { test, expect, type Page } from "@playwright/test";
async function start(page: Page, count = 5) {
  await page.goto("/setup/destroyer");
  await expect(
    page.getByRole("button", { name: "학습 시작하기" }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: "시연용 문제로 연습하기" }).check();
  await page.locator(`input[name="count"][value="${count}"]`).check();
  await page.getByRole("button", { name: "학습 시작하기" }).click();
  await expect(page).toHaveURL(/\/quiz$/);
}
test("단원부터 채점, 오답 복습과 재도전, 학습기록까지", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("link", { name: /UNIT 01 구축함/ }).click();
  await page.getByRole("checkbox", { name: "시연용 문제로 연습하기" }).check();
  await page.getByRole("button", { name: "학습 시작하기" }).click();
  for (let i = 0; i < 5; i++) {
    const index = await page.evaluate((i) => {
      const s = JSON.parse(sessionStorage.getItem("hamjeong.session.v1")!);
      return (s.items[i].answerIndex + 1) % 4;
    }, i);
    await expect(
      page.getByRole("button", { name: i === 4 ? "답안 제출" : "다음 문제" }),
    ).toBeDisabled();
    await page.getByRole("radio").nth(index).check();
    await page
      .getByRole("button", { name: i === 4 ? "답안 제출" : "다음 문제" })
      .click();
  }
  await expect(page).toHaveURL(/\/result$/);
  await expect(page.locator(".score-mark strong")).toHaveText("0");
  await page.getByRole("link", { name: "오답 복습하기" }).click();
  await expect(page.locator(".review-card")).toHaveCount(5);
  await expect(page.locator(".source-link").first()).toHaveAttribute(
    "href",
    /^https:\/\/www.dapa.go.kr\//,
  );
  await page.getByRole("button", { name: "틀린 문제 다시 풀기" }).click();
  await expect(page).toHaveURL(/\/quiz$/);
  await page.getByRole("link", { name: "학습 종료" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "종료하기", exact: true }).click();
  await page.getByRole("link", { name: "학습 기록", exact: true }).click();
  await expect(page.locator(".history-list article")).toHaveCount(1);
  expect(errors).toEqual([]);
});
test("10문제 새로고침 복원, 종료 취소, 360px 넘침 없음", async ({ page }) => {
  await start(page, 10);
  await page.getByRole("radio").nth(2).check();
  await page.getByRole("button", { name: "다음 문제" }).click();
  const before = await page.evaluate(() =>
    sessionStorage.getItem("hamjeong.session.v1"),
  );
  page.on("dialog", (d) => d.accept());
  await page.reload();
  await expect(page.locator(".question-number")).toHaveText("QUESTION 02");
  expect(
    await page.evaluate(() => sessionStorage.getItem("hamjeong.session.v1")),
  ).toBe(before);
  await page.getByRole("link", { name: "학습 종료" }).click();
  await page.getByRole("button", { name: "취소", exact: true }).click();
  await expect(page).toHaveURL(/\/quiz$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("잘못된 주소·세션과 20문제 설정", async ({ page }) => {
  await page.goto("/quiz");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/setup/missing");
  await expect(page.getByText("없는 학습 단원입니다.")).toBeVisible();
  await start(page, 20);
  await expect(page.getByRole("progressbar")).toHaveAttribute("max", "20");
  await page.evaluate(() =>
    sessionStorage.setItem("hamjeong.session.v1", '{"version":99}'),
  );
  page.on("dialog", (d) => d.accept());
  await page.reload();
  await expect(page).toHaveURL(/\/$/);
});
test("키보드 5문제 풀이", async ({ page }) => {
  await start(page);
  for (let i = 0; i < 5; i++) {
    await page.locator(".question-panel h1").focus();
    await page.keyboard.press("1");
    await page.keyboard.press("Enter");
  }
  await expect(page).toHaveURL(/\/result$/);
});
