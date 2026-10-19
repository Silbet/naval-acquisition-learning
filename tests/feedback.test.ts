import { describe, expect, it } from "vitest";
import { feedbackForm } from "../src/feedback";

describe("피드백 저장소 연결", () => {
  it.each([
    "",
    "   ",
    "https://example.com/form",
    "../form",
    "id?token=secret",
  ])("미설정·잘못된 ID로 제출 양식을 표시하지 않는다: %s", (id) =>
    expect(feedbackForm(id)).toBeNull(),
  );
  it("공개 폼 ID로만 Tally 작성·삽입 주소를 만든다", () => {
    expect(feedbackForm(" testForm01 ")).toEqual({
      publicUrl: "https://tally.so/r/testForm01",
      embedUrl:
        "https://tally.so/embed/testForm01?alignLeft=1&hideTitle=1&transparentBackground=1",
    });
  });
});
