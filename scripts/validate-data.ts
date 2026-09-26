import { questions, questionSchema, sources, units, pool } from "../src/data";
const seen = new Set<string>();
for (const q of questions) {
  questionSchema.parse(q);
  if (seen.has(q.id)) throw Error(`중복 ID ${q.id}`);
  seen.add(q.id);
  if (new Set(q.options).size !== 4) throw Error(`중복 보기 ${q.id}`);
  if (q.status === "verified" && (!q.reviewedBy || !q.verifiedAt))
    throw Error(`사람 검수 기록 누락 ${q.id}`);
}
for (const s of Object.values(sources)) {
  const u = new URL(s.url);
  if (
    u.protocol !== "https:" ||
    !["dapa.go.kr", "www.dapa.go.kr"].includes(u.hostname) ||
    u.username ||
    u.password
  )
    throw Error(`출처 도메인 오류 ${s.url}`);
}
for (const u of units) {
  console.log(
    `${u.title}: 정식 ${pool(u.id).length} / 시연 ${pool(u.id, true).length}`,
  );
}
console.log(
  `검증 통과: ${questions.length}개 고유 문항, ${Object.keys(sources).length}개 공식 출처. 사람 검수 전 문항은 시연 모드에만 포함됩니다.`,
);
