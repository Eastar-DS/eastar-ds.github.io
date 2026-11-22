import { expect, it } from "vitest";
import { readStatus } from "./readStatus.ts";
const hash = "a".repeat(64);
const report = `- 글: index.mdx (sha256 ${hash})
- 대조한 날: 2026-11-22
- 주장 99건: 다름 99
## 대조표
| 번호 | 판정 |
|---|---|
| C1 | 다름 |
| C2 | 일부 맞음 |
| C3 | 출처에 없음 |
| C4 | 못 엶 |
| C5 | 맞음 |
`;
it("대조표나 글, sha256이 없으면 없음이다", () => {
  expect(readStatus({ reportText: null, postSha256: hash })).toBe("없음");
  expect(readStatus({ reportText: report, postSha256: null })).toBe("없음");
  expect(readStatus({ reportText: "# 대조표", postSha256: hash })).toBe("없음");
});
it("글의 sha256이 다르면 낡음이다", () => expect(readStatus({ reportText: report, postSha256: "b".repeat(64) })).toBe("낡음: 글이 대조 뒤에 바뀜"));
it("머리의 건수를 믿지 않고 실제 판정 줄을 센다", () => expect(readStatus({ reportText: report, postSha256: hash })).toBe("최신(2026-11-22): 다름 1, 일부 맞음 1, 출처에 없음 1, 못 엶 1"));
it("최신은 내용의 정확함을 뜻하지 않으며 날짜가 없을 수도 있다", () => expect(readStatus({ reportText: report.replace("2026-11-22", ""), postSha256: hash })).toContain("최신(날짜 없음)"));
