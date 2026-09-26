import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir(".sites-runtime/qa", { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, width, height] of [
    ["desktop", 1440, 1100],
    ["mobile", 360, 800],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto("http://127.0.0.1:5173/");
    await page.screenshot({
      path: `.sites-runtime/qa/${name}-home.png`,
      fullPage: true,
    });
    console.log(
      name,
      "home overflow",
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    );
    console.log(
      "Native document.modelContext supported:",
      await page.evaluate(() => !!document.modelContext?.registerTool),
    );
    await page.goto("http://127.0.0.1:5173/setup/destroyer");
    await page
      .getByRole("checkbox", { name: "시연용 문제로 연습하기" })
      .check();
    await page.getByRole("button", { name: "학습 시작하기" }).click();
    await page.screenshot({
      path: `.sites-runtime/qa/${name}-quiz.png`,
      fullPage: true,
    });
    for (let i = 0; i < 5; i++) {
      await page.getByRole("radio").first().check();
      await page
        .getByRole("button", { name: i === 4 ? "답안 제출" : "다음 문제" })
        .click();
    }
    await page.screenshot({
      path: `.sites-runtime/qa/${name}-result.png`,
      fullPage: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
