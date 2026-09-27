import { describe, it, expect } from "vitest";
import {
  createSession,
  grade,
  scoreGrade,
  validateSession,
} from "../src/domain";
import { pool, questions, unitIds } from "../src/data";
describe("문제은행과 출제", () => {
  it("사람 검수 전 문제는 정식 모드에서 출제하지 않는다", () => {
    expect(pool("destroyer")).toHaveLength(0);
    expect(() => createSession("destroyer", 5, false)).toThrow();
  });
  for (const unit of unitIds)
    for (const count of [5, 10, 20])
      it(`${unit} ${count}개 중복 없는 출제와 보기 매핑`, () => {
        const s = createSession(unit, count, true);
        expect(s.items).toHaveLength(count);
        expect(new Set(s.items.map((q) => q.id)).size).toBe(count);
        for (const q of s.items) {
          const raw = questions.find((x) => x.id === q.id)!;
          expect(q.options[q.answerIndex]).toBe(raw.options[raw.answerIndex]);
        }
        const distribution = [0, 1, 2, 3].map(
          (i) => s.items.filter((q) => q.answerIndex === i).length,
        );
        expect(
          Math.max(...distribution) - Math.min(...distribution),
        ).toBeLessThanOrEqual(1);
        expect(validateSession(s)).not.toBeNull();
      });
  it("채점은 섞인 정답에 기반한다", () => {
    for (const count of [5, 10, 20]) {
      const s = createSession("destroyer", count, true);
      s.answers = s.items.map((q, i) =>
        i < 3 ? q.answerIndex : (q.answerIndex + 1) % 4,
      );
      expect(grade(s).score).toBe(Math.round((3 / count) * 100));
      expect(grade(s).correct).toBe(3);
    }
  });
  it("일반 문제 수 제한, 오답 1문제 재도전", () => {
    expect(() => createSession("destroyer", 1, true)).toThrow();
    const s = createSession("destroyer", 1, true, ["q-destroyer-0001"]);
    expect(s.retry).toBe(true);
    expect(s.items).toHaveLength(1);
  });
  it("손상되거나 조작된 세션을 거부한다", () => {
    expect(validateSession({})).toBeNull();
    const s = createSession("frigate", 5, true);
    s.items[0].answerIndex = (s.items[0].answerIndex + 1) % 4;
    expect(validateSession(s)).toBeNull();
    const other = createSession("frigate", 5, true);
    other.currentIndex = 6;
    expect(validateSession(other)).toBeNull();
  });
  it.each([
    [0, "기초 절차 탐색 중"],
    [59, "기초 절차 탐색 중"],
    [60, "항로 재점검"],
    [79, "항로 재점검"],
    [80, "출항 준비 완료"],
    [99, "출항 준비 완료"],
    [100, "함정사업 마스터"],
  ])("점수 %i의 등급", (n, label) =>
    expect(scoreGrade(n as number)).toBe(label),
  );
});
