import { questions, questionSchema, sources, units, pool } from "../src/data";
const seen = new Set<string>();
const prompts = new Set<string>();
for (const q of questions) {
  questionSchema.parse(q);
  if (seen.has(q.id)) throw Error(`중복 ID ${q.id}`);
  seen.add(q.id);
  if (prompts.has(q.prompt)) throw Error(`중복 질문 ${q.id}`);
  prompts.add(q.prompt);
  if (new Set(q.options).size !== 4) throw Error(`중복 보기 ${q.id}`);
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
    ].includes(u.hostname) ||
    u.username ||
    u.password
  )
    throw Error(`출처 도메인 오류 ${s.url}`);
}
for (const u of units) {
  console.log(
    `${u.title}: 공개 ${pool(u.id).length} / 고유 ${pool(u.id).filter((q) => q.unitId === u.id).length}`,
  );
}
console.log(
  `검증 통과: ${questions.length}개 문항, ${Object.keys(sources).length}개 공개 출처. 공개 상태와 사람 검수 기록은 별도로 관리합니다.`,
);
