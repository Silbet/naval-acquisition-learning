import { units, pool } from "./data";
type Registry = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => unknown;
};
export function registerLearningTools() {
  const context = (document as Document & { modelContext?: Registry })
    .modelContext;
  if (!context) return () => {};
  const lifecycle = new AbortController();
  try {
    void Promise.resolve(
      context.registerTool(
        {
          name: "list_learning_units",
          description:
            "학습 단원과 사람 검수 완료 및 시연용 문제 수를 조회합니다. 정답은 반환하지 않습니다.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true },
          execute(input) {
            if (
              !input ||
              typeof input !== "object" ||
              Object.keys(input).length
            )
              throw Error("빈 객체가 필요합니다.");
            return units.map((u) => ({
              id: u.id,
              title: u.title,
              verifiedCount: pool(u.id).length,
              demoCount: pool(u.id, true).length,
            }));
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
  } catch {
    /* unsupported API */
  }
  return () => lifecycle.abort();
}
