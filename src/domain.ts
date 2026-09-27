import { z } from "zod";
import {
  pool,
  questions,
  questionSchema,
  unitIds,
  type Question,
  type UnitId,
} from "./data";
export const SESSION_KEY = "hamjeong.session.v2",
  HISTORY_KEY = "hamjeong.history.v1";
const sessionSchema = z.object({
  version: z.literal(2),
  id: z.string(),
  unitId: z.enum(unitIds),
  retry: z.boolean(),
  items: z.array(questionSchema).min(1).max(20),
  answers: z.array(z.number().int().min(0).max(3).nullable()),
  currentIndex: z.number().int().min(0),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});
export type Session = z.infer<typeof sessionSchema>;
export type History = {
  id: string;
  unitId: UnitId;
  score: number;
  correct: number;
  total: number;
  completedAt: string;
  retry: boolean;
  weakStages: string[];
};
export function shuffled<T>(
  items: readonly T[],
  rng: () => number = Math.random,
): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function conceptCount(items: Question[]): number {
  return new Set(items.map((q) => q.concept)).size;
}

export function selectionPlan(
  unitId: UnitId,
  count: number,
  available = pool(unitId),
) {
  if (![5, 10, 20].includes(count)) throw Error("지원하지 않는 문제 수입니다.");
  const commonAvailable = conceptCount(
    available.filter((q) => q.unitId === "common-process"),
  );
  if (unitId === "common-process") {
    if (commonAvailable < count)
      throw Error("서로 다른 개념의 문제가 부족합니다.");
    return { cases: 0, common: count };
  }
  const ownAvailable = conceptCount(
    available.filter((q) => q.unitId === unitId),
  );
  const target = ({ 5: 4, 10: 7, 20: 15 } as Record<number, number>)[count];
  // 부족해도 함종 비중은 절반 이상을 유지합니다. 홀수 5문항은 최소 3:2입니다.
  const cases = Math.min(
    ownAvailable,
    Math.max(target, count - commonAvailable),
  );
  if (
    cases < Math.ceil(count / 2) ||
    commonAvailable < count - cases ||
    conceptCount(available) < count
  )
    throw Error(
      "함종 문제를 절반 이상 구성할 수 없습니다. 문제 수를 줄여 주세요.",
    );
  return { cases, common: count - cases };
}

function pickDiverse(
  items: Question[],
  count: number,
  canPick: (q: Question, selected: Question[]) => boolean = () => true,
): Question[] {
  const unique = [
    ...new Map(shuffled(items).map((q) => [q.concept, q])).values(),
  ];
  const selected: Question[] = [];
  // 핵심 역할을 먼저 포함하고 장비·사례를 순환해 한 분야로 쏠리지 않게 합니다.
  const buckets = ["역할·임무", "장비·원리", "획득·사례"].map((topic) =>
    unique.filter((q) => q.topic === topic),
  );
  while (selected.length < count && buckets.some((b) => b.length)) {
    for (const bucket of buckets) {
      if (selected.length === count) break;
      const next = bucket.pop();
      if (next && canPick(next, selected)) selected.push(next);
    }
  }
  if (selected.length !== count)
    throw Error("서로 다른 개념의 문제가 부족합니다.");
  return selected;
}

export function createSession(
  unitId: UnitId,
  count: number,
  retryIds?: string[],
): Session {
  const available = pool(unitId);
  if (!retryIds && ![5, 10, 20].includes(count))
    throw Error("지원하지 않는 문제 수입니다.");
  let selected: Question[];
  if (retryIds) {
    const ids = new Set(retryIds);
    selected = available.filter((q) => ids.has(q.id));
    if (selected.length !== ids.size || selected.length !== count)
      throw Error("복습할 문제를 확인할 수 없습니다.");
  } else {
    const plan = selectionPlan(unitId, count, available);
    const commonConcepts = new Set(
      available
        .filter((q) => q.unitId === "common-process")
        .map((q) => q.concept),
    );
    const sharedBudget = commonConcepts.size - plan.common;
    const cases = pickDiverse(
      available.filter((q) => q.unitId !== "common-process"),
      plan.cases,
      (q, selected) =>
        !commonConcepts.has(q.concept) ||
        selected.filter((item) => commonConcepts.has(item.concept)).length <
          sharedBudget,
    );
    const usedConcepts = new Set(cases.map((q) => q.concept));
    const common = pickDiverse(
      available.filter(
        (q) => q.unitId === "common-process" && !usedConcepts.has(q.concept),
      ),
      plan.common,
    );
    selected = shuffled([...cases, ...common]);
  }
  if (selected.length !== count || count < 1 || count > 20)
    throw Error("문제 수가 맞지 않습니다.");
  const slots = shuffled(Array.from({ length: count }, (_, i) => i % 4));
  const items = shuffled(selected).map((q, i) => {
    const correct = q.options[q.answerIndex],
      wrong = shuffled(q.options.filter((_, j) => j !== q.answerIndex));
    wrong.splice(slots[i], 0, correct);
    return {
      ...q,
      options: wrong as Question["options"],
      answerIndex: slots[i],
    };
  });
  return {
    version: 2,
    id: crypto.randomUUID(),
    unitId,
    retry: !!retryIds,
    items,
    answers: Array(count).fill(null),
    currentIndex: 0,
    startedAt: new Date().toISOString(),
  };
}
export function validateSession(value: unknown): Session | null {
  const p = sessionSchema.safeParse(value);
  if (!p.success) return null;
  const s = p.data;
  if (
    s.currentIndex >= s.items.length ||
    s.answers.length !== s.items.length ||
    new Set(s.items.map((q) => q.id)).size !== s.items.length
  )
    return null;
  if (s.completedAt && s.answers.some((a) => a === null)) return null;
  if (s.answers.slice(0, s.currentIndex).some((a) => a === null)) return null;
  for (const q of s.items) {
    const original = questions.find((x) => x.id === q.id);
    if (
      !original ||
      original.status === "retired" ||
      !["published", "verified"].includes(original.status) ||
      !(original.unitId === s.unitId || original.unitId === "common-process")
    )
      return null;
    if (
      new Set(q.options).size !== 4 ||
      q.options.some((o) => !original.options.includes(o)) ||
      q.options[q.answerIndex] !== original.options[original.answerIndex] ||
      q.prompt !== original.prompt ||
      q.concept !== original.concept ||
      q.topic !== original.topic ||
      q.stage !== original.stage ||
      q.unitId !== original.unitId ||
      q.sourceId !== original.sourceId ||
      q.explanation !== original.explanation
    )
      return null;
  }
  return s;
}
export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = validateSession(JSON.parse(raw));
    if (!s) sessionStorage.removeItem(SESSION_KEY);
    return s;
  } catch {
    return null;
  }
}
export function saveSession(s: Session): boolean {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage may be disabled */
  }
}
export function grade(s: Session) {
  const correct = s.items.reduce(
    (n, q, i) => n + Number(s.answers[i] === q.answerIndex),
    0,
  );
  return {
    correct,
    total: s.items.length,
    score: Math.round((correct / s.items.length) * 100),
    wrong: s.items.filter((q, i) => s.answers[i] !== q.answerIndex),
  };
}
export function scoreGrade(n: number) {
  return n === 100
    ? "함정사업 마스터"
    : n >= 80
      ? "출항 준비 완료"
      : n >= 60
        ? "항로 재점검"
        : "기초 절차 탐색 중";
}
const historySchema = z.array(
  z.object({
    id: z.string(),
    unitId: z.enum(unitIds),
    score: z.number().min(0).max(100),
    correct: z.number().int().nonnegative(),
    total: z.number().int().min(1).max(20),
    completedAt: z.string().datetime(),
    retry: z.boolean(),
    weakStages: z.array(z.string()),
  }),
);
export function loadHistory(): History[] {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    const p = historySchema.safeParse(raw);
    return p.success ? p.data.slice(0, 100) : [];
  } catch {
    return [];
  }
}
export function recordHistory(s: Session) {
  if (!s.completedAt) return;
  const result = grade(s);
  const entry: History = {
    id: s.id,
    unitId: s.unitId,
    score: result.score,
    correct: result.correct,
    total: result.total,
    completedAt: s.completedAt,
    retry: s.retry,
    weakStages: [...new Set(result.wrong.map((q) => q.stage))],
  };
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(
        [entry, ...loadHistory().filter((h) => h.id !== s.id)].slice(0, 100),
      ),
    );
  } catch {
    /* optional local history */
  }
}
