import { z } from "zod";
import {
  pool,
  questions,
  questionSchema,
  unitIds,
  type Question,
  type UnitId,
} from "./data";
export const SESSION_KEY = "hamjeong.session.v1",
  HISTORY_KEY = "hamjeong.history.v1";
const sessionSchema = z.object({
  version: z.literal(1),
  id: z.string(),
  unitId: z.enum(unitIds),
  demo: z.boolean(),
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
  demo: boolean;
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
export function createSession(
  unitId: UnitId,
  count: number,
  demo: boolean,
  retryIds?: string[],
): Session {
  const available = pool(unitId, demo);
  if (!retryIds && ![5, 10, 20].includes(count))
    throw Error("지원하지 않는 문제 수입니다.");
  let selected: Question[];
  if (retryIds) {
    const ids = new Set(retryIds);
    selected = available.filter((q) => ids.has(q.id));
    if (selected.length !== ids.size || selected.length !== count)
      throw Error("복습할 문제를 확인할 수 없습니다.");
  } else {
    if (available.length < count) throw Error("검수된 문제가 부족합니다.");
    const cases = shuffled(
      available.filter((q) => q.unitId !== "common-process"),
    ).slice(0, Math.ceil(count / 2));
    selected = shuffled([
      ...cases,
      ...shuffled(available.filter((q) => q.unitId === "common-process")).slice(
        0,
        count - cases.length,
      ),
    ]);
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
    version: 1,
    id: crypto.randomUUID(),
    unitId,
    demo,
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
      (!s.demo && original.status !== "verified") ||
      !(original.unitId === s.unitId || original.unitId === "common-process")
    )
      return null;
    if (
      new Set(q.options).size !== 4 ||
      q.options.some((o) => !original.options.includes(o)) ||
      q.options[q.answerIndex] !== original.options[original.answerIndex] ||
      q.prompt !== original.prompt ||
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
    demo: z.boolean(),
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
    demo: s.demo,
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
