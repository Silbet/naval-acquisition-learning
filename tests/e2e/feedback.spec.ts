import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("피드백 페이지 연결, 외부 저장 안내, 접근성과 모바일 너비", async ({
  page,
}) => {
  // Do not submit test feedback to the real owner's form.
  await page.route("https://tally.so/embed/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<html lang="ko"><title>양식 테스트</title><body><main><label>의견<textarea></textarea></label><button>피드백 보내기</button></main></body></html>',
    }),
  );
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "주 메뉴" })
    .getByRole("link", { name: "피드백", exact: true })
    .click();
  await expect(page).toHaveURL(/\/feedback$/);
  await expect(page).toHaveTitle("피드백 보내기 · 함정길잡이");
  await expect(
    page.getByRole("heading", { name: "피드백 보내기", exact: true }),
  ).toBeVisible();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    /^https:\/\/tally\.so\/embed\/testForm01\?/,
  );
  await expect(
    page.getByRole("link", { name: "새 탭에서 작성하기" }),
  ).toHaveAttribute("href", "https://tally.so/r/testForm01");
  await expect(
    page.getByText("제출 완료 화면을 확인하세요", { exact: true }),
  ).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "피드백 보내기", exact: true }),
  ).toBeVisible();
});
