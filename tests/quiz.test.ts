import { describe, it, expect, vi } from "vitest";
import {
  createSession,
  grade,
  scoreGrade,
  validateSession,
  selectionPlan,
  conceptCount,
  loadHistory,
} from "../src/domain";
import {
  pool,
  questions,
  unitIds,
  isCommonUnit,
  isScenarioUnit,
} from "../src/data";
import { terminologyDefinitions } from "../src/terminology-content";
describe("문제은행과 출제", () => {
  it("기존 완료 기록을 새 버전에서도 보존한다", () => {
    const previous = {
      id: "previous",
      unitId: "destroyer",
      score: 80,
      correct: 4,
      total: 5,
      completedAt: "2026-09-26T00:00:00.000Z",
      demo: true,
      retry: false,
      weakStages: [],
    };
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify([previous]),
    });
    try {
      expect(loadHistory()).toHaveLength(1);
      expect(loadHistory()[0]).toMatchObject({
        id: "previous",
        score: 80,
        total: 5,
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("이전 진행 세션은 새 문항 구조로 잘못 복원하지 않는다", () => {
    expect(
      validateSession({ ...createSession("destroyer", 5), version: 1 }),
    ).toBeNull();
  });
  it("함종 문제가 부족해도 공통 문제로 보충하지 않는다", () => {
    const own = pool("destroyer").filter((q) => q.unitId === "destroyer");
    const unique = [...new Map(own.map((q) => [q.concept, q])).values()];
    const common = pool("common-process");
    expect(() =>
      selectionPlan("destroyer", 10, [...unique.slice(0, 5), ...common]),
    ).toThrow();
    expect(() =>
      selectionPlan("destroyer", 20, [...unique.slice(0, 10), ...common]),
    ).toThrow();
    expect(() =>
      selectionPlan("destroyer", 5, [...unique.slice(0, 3), ...common]),
    ).toThrow();
    expect(() =>
      selectionPlan("destroyer", 10, [...unique.slice(0, 4), ...common]),
    ).toThrow();
  });
  it("함종 전용 회차는 선택한 함종으로만 채운다", () => {
    const own = pool("destroyer").filter((q) => q.unitId === "destroyer");
    expect(selectionPlan("destroyer", 10, own)).toEqual({
      cases: 10,
      common: 0,
    });
  });
  it("함종과 공통에서 같은 개념을 이중 계산하지 않는다", () => {
    const own = pool("destroyer")
      .filter((q) => q.unitId === "destroyer")
      .slice(0, 5);
    const shared = own.map((q) => ({
      ...q,
      unitId: "common-process" as const,
    }));
    expect(() => selectionPlan("destroyer", 10, [...own, ...shared])).toThrow();
  });
  it("반복 출제에도 선택 단원 밖 문항과 중복 개념이 섞이지 않는다", () => {
    for (const unit of unitIds) {
      for (let run = 0; run < 30; run++) {
        const s = createSession(unit, 20);
        expect(conceptCount(s.items)).toBe(20);
        expect(s.items.filter((q) => q.unitId === unit)).toHaveLength(20);
      }
    }
  });
  it("공개된 문항으로 바로 시작하고 검수 이력은 임의로 만들지 않는다", () => {
    expect(createSession("destroyer", 5).items).toHaveLength(5);
    expect(
      questions
        .filter((q) => q.status === "published")
        .every((q) => !q.reviewedBy),
    ).toBe(true);
  });
  for (const unit of unitIds)
    for (const count of [5, 10, 20])
      it(`${unit} ${count}개 중복 없는 출제와 보기 매핑`, () => {
        const s = createSession(unit, count);
        expect(s.items).toHaveLength(count);
        expect(new Set(s.items.map((q) => q.id)).size).toBe(count);
        expect(conceptCount(s.items)).toBe(count);
        expect(s.items.every((q) => q.unitId === unit)).toBe(true);
        if (!isCommonUnit(unit)) {
          expect(s.items.some((q) => q.topic === "역할·임무")).toBe(true);
          expect(s.items.some((q) => q.topic === "장비·원리")).toBe(true);
        }
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
      const s = createSession("destroyer", count);
      s.answers = s.items.map((q, i) =>
        i < 3 ? q.answerIndex : (q.answerIndex + 1) % 4,
      );
      expect(grade(s).score).toBe(Math.round((3 / count) * 100));
      expect(grade(s).correct).toBe(3);
    }
  });
  it("일반 문제 수 제한, 오답 1문제 재도전", () => {
    expect(() => createSession("destroyer", 1)).toThrow();
    const s = createSession("destroyer", 1, ["q-destroyer-0001"]);
    expect(s.retry).toBe(true);
    expect(s.items).toHaveLength(1);
  });
  it("손상되거나 조작된 세션을 거부한다", () => {
    expect(validateSession({})).toBeNull();
    const s = createSession("frigate", 5);
    s.items[0].answerIndex = (s.items[0].answerIndex + 1) % 4;
    expect(validateSession(s)).toBeNull();
    const other = createSession("frigate", 5);
    other.currentIndex = 6;
    expect(validateSession(other)).toBeNull();
  });
  it("이전 혼합 회차의 공통 문항과 상황형 해설 변조를 복원하지 않는다", () => {
    const mixed = createSession("destroyer", 5);
    mixed.items[0] = createSession("common-contract", 5).items[0];
    expect(validateSession(mixed)).toBeNull();
    const tampered = createSession("common-management", 5);
    tampered.items[0].actionSteps = ["임의 처리", "기록 삭제"];
    expect(validateSession(tampered)).toBeNull();
  });
  it("공통 업무 60문항은 모두 조문과 처리 순서가 있는 자체 상황형이다", () => {
    const common = unitIds.filter(isScenarioUnit).flatMap(pool);
    expect(common).toHaveLength(60);
    for (const q of common) {
      expect(q.scenario).toBe(true);
      expect(q.citation).toBeTruthy();
      expect(q.actionSteps?.length).toBeGreaterThanOrEqual(2);
      expect(q.evidenceCheckedAt).toBe("2026-10-25");
      expect(q.reviewedBy).toBeUndefined();
    }
  });
  it("용어 문제는 120개 고유 정답과 용어 보기만 가지며 질문에 정답을 드러내지 않는다", () => {
    const words = new Set(terminologyDefinitions.map((entry) => entry.term));
    const items = pool("common-terms");
    expect(words.size).toBe(120);
    expect(items).toHaveLength(words.size);
    expect(new Set(items.map((q) => q.options[q.answerIndex])).size).toBe(
      words.size,
    );
    for (const q of items) {
      expect(q.topic).toBe("용어·개념");
      expect(q.scenario).toBeUndefined();
      expect(q.actionSteps).toBeUndefined();
      expect(q.citation).toBeTruthy();
      expect(new Set(q.options).size).toBe(4);
      expect(q.options.every((option) => words.has(option))).toBe(true);
      const answer = q.options[q.answerIndex]
        .replace(/\([^)]*\)/g, "")
        .replace(/\s/g, "");
      expect(q.prompt.replace(/\s/g, "")).not.toContain(answer);
    }
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
