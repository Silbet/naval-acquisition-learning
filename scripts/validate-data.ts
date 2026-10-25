import {
  questions,
  questionSchema,
  sources,
  units,
  pool,
  isScenarioUnit,
  isTerminologyUnit,
} from "../src/data";
import { terminologyDefinitions } from "../src/terminology-content";
const seen = new Set<string>();
const prompts = new Set<string>();
for (const q of questions) {
  questionSchema.parse(q);
  if (seen.has(q.id)) throw Error(`중복 ID ${q.id}`);
  seen.add(q.id);
  if (prompts.has(q.prompt)) throw Error(`중복 질문 ${q.id}`);
  prompts.add(q.prompt);
  if (new Set(q.options).size !== 4) throw Error(`중복 보기 ${q.id}`);
  if (q.scenario && (!q.citation || !q.actionSteps || q.actionSteps.length < 2))
    throw Error(`상황형 근거·처리순서 누락 ${q.id}`);
  if (
    isTerminologyUnit(q.unitId) &&
    (q.topic !== "용어·개념" || q.scenario || !q.citation)
  )
    throw Error(`용어형 구성 오류 ${q.id}`);
  if (q.status === "verified" && (!q.reviewedBy || !q.verifiedAt))
    throw Error(`사람 검수 기록 누락 ${q.id}`);
}
for (const s of Object.values(sources)) {
  const u = new URL(s.url);
  if (
    u.protocol !== "https:" ||
    ![
      "dapa.go.kr",
      "www.dapa.go.kr",
      "www.navy.mil",
      "www.surflant.usff.navy.mil",
      "www.surfpac.navy.mil",
      "www.csp.navy.mil",
      "www.usff.navy.mil",
      "www.royalnavy.mod.uk",
      "www.gov.uk",
      "www.hanwha.com",
      "www.law.go.kr",
    ].includes(u.hostname) ||
    u.username ||
    u.password
  )
    throw Error(`출처 도메인 오류 ${s.url}`);
}
for (const u of units) {
  const available = pool(u.id);
  if (available.some((q) => q.unitId !== u.id))
    throw Error(`단원 혼합 ${u.id}`);
  if (new Set(available.map((q) => q.concept)).size < 20)
    throw Error(`20문항 출제 불가 ${u.id}`);
  if (isScenarioUnit(u.id) && available.some((q) => !q.scenario))
    throw Error(`공통 상황형 누락 ${u.id}`);
  console.log(
    `${u.title}: 공개 ${pool(u.id).length} / 고유 ${pool(u.id).filter((q) => q.unitId === u.id).length}`,
  );
}
const termWords = new Set(terminologyDefinitions.map((entry) => entry.term));
if (termWords.size !== terminologyDefinitions.length || termWords.size < 120)
  throw Error("120개 이상의 서로 다른 용어가 필요합니다.");
for (const q of pool("common-terms")) {
  if (q.options.some((option) => !termWords.has(option)))
    throw Error(`용어가 아닌 보기 ${q.id}`);
  const word = q.options[q.answerIndex]
    .replace(/\([^)]*\)/g, "")
    .replace(/\s/g, "");
  if (q.prompt.replace(/\s/g, "").includes(word))
    throw Error(`질문에 정답 용어 노출 ${q.id}`);
}
console.log(
  `검증 통과: 현재 출제 ${questions.filter((q) => ["published", "verified"].includes(q.status)).length}문항 / 보관 ${questions.filter((q) => q.status === "retired").length}문항, 공개 출처 ${Object.keys(sources).length}개. 공개와 사람 검수는 별도 관리합니다.`,
);
