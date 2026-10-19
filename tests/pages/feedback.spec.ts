import { expect, test } from "@playwright/test";
import settings from "../../src/feedback-settings.json" with { type: "json" };

test("Pages 피드백 직접 진입과 새로고침은 같은 공개 폼으로 연결된다", async ({
  page,
}) => {
  await page.route("https://tally.so/embed/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<html lang="ko"><title>폼 연결 테스트</title><body>테스트 양식</body></html>',
    }),
  );
  await page.goto("./#/feedback");
  await expect(
    page.getByRole("heading", { name: "피드백 보내기", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "새 탭에서 작성하기" }),
  ).toHaveAttribute("href", `https://tally.so/r/${settings.tallyFormId}`);
  await page.reload();
  await expect(page.locator("iframe")).toHaveAttribute(
    "title",
    "함정길잡이 피드백 입력 양식",
  );
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    `https://tally.so/embed/${settings.tallyFormId}?alignLeft=1&hideTitle=1&transparentBackground=1`,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
