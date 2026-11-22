import { describe, expect, it } from "vitest";
import { createClaimsFile, sha256Text } from "./extractClaims.ts";
import { parseReport, splitTableRow, toSearchableTexts, verifyReport } from "./verifyReport.ts";
const source = "목록은 966ms에 보입니다.";
const claims = createClaimsFile({ source, slug: "sample", file: "index.mdx", generatedAt: "2026-11-22" });
export const validReport = (hash = sha256Text(source)) => `# 사실 대조: sample
- 글: index.mdx (sha256 ${hash})
- 대조한 날: 2026-11-22
- 자료 목록: sources.md
- 주장 1건: 맞음 1, 일부 맞음 0, 다름 0, 출처에 없음 0, 못 엶 0, 대조 안 함 0
## 대조표
| 번호 | 줄 | 주장 | 종류 | 출처 | 판정 | 근거 | 고칠 말 |
|---|---|---|---|---|---|---|---|
| C1 | 1 | 966ms | number | \`source.txt\` | 맞음 | 인용: 「966ms」 | |
`;
const verify = (reportText: string, postText = source, hiddenNames: string[] = []) => verifyReport({ reportText, claimsFile: claims, postText, postSha256: sha256Text(postText), resolveSourcePath: (token) => token === "source.txt" ? token : null, readSourceFile: () => source, hiddenNames });
const problem = (report: string, text: string) => expect(verify(report).some((item) => item.message.includes(text))).toBe(true);
describe("verifyReport", () => {
  it("전 주장의 번호와 실제 인용이 있는 대조표를 받는다", () => expect(verify(validReport())).toEqual([]));
  it("머리와 sha256과 날짜가 빠진 대조표를 거절한다", () => {
    problem(validReport().replace(/- 글:.*\n/u, ""), "글");
    problem(validReport().replace(/sha256 [a-f0-9]+/u, ""), "sha256");
    problem(validReport().replace("2026-11-22", "오늘"), "YYYY-MM-DD");
  });
  it("오래된 claims와 글을 구별한다", () => {
    expect(verify(validReport(), source + " 바뀜").some((item) => item.message.includes("글이 대조 뒤에 바뀜"))).toBe(true);
    problem(validReport("a".repeat(64)), "sha256이 claims.json과 다름");
  });
  it("빠진 번호, 중복 번호, 모르는 C 번호를 찾는다", () => {
    problem(validReport().replace("| C1 |", "| M1 |"), "C1가");
    const row = validReport().split("\n").find((line) => line.startsWith("| C1"))!;
    problem(validReport() + row, "두 번");
    problem(validReport().replace("| C1 |", "| C99 |"), "없는 번호");
  });
  it("모르는 판정과 근거 없는 맞음을 거절한다", () => {
    problem(validReport().replace("| 맞음 |", "| 아마 |"), "모르는 판정");
    problem(validReport().replace("인용: 「966ms」", "기억으로 봄"), "시작하지 않음");
    problem(validReport().replace("인용: 「966ms」", "인용: 966ms"), "감싼");
  });
  it("없는 인용과 열 수 없는 출처를 거절한다", () => {
    problem(validReport().replace("「966ms」", "「996ms」"), "찾지 못함");
    problem(validReport().replace("`source.txt`", "https://example.com/doc"), "받아 둔 원문");
  });
  it("웹 주소의 인용은 fetched 아래 원문과 함께 적어야 한다", () => {
    problem(validReport().replace("`source.txt`", "https://example.com/doc<br>`source.txt`"), "받아 둔 원문");
    const text = validReport().replace("`source.txt`", "https://example.com/doc<br>`fetched/source.txt`");
    expect(verifyReport({ reportText: text, claimsFile: claims, postText: source, postSha256: sha256Text(source), resolveSourcePath: () => "/work/fetched/source.txt", readSourceFile: () => source, hiddenNames: [] })).toEqual([]);
  });
  it("다름의 자세한 절과 고칠 말을 요구하고 글의 인용도 대조한다", () => {
    const report = validReport().replace("맞음 1", "맞음 0").replace("다름 0", "다름 1").replace("| 맞음 |", "| 다름 |");
    problem(report, "절이 없음");
    const detailed = report.replace("966ms」 | |", "966ms」 | 966ms |") + `\n## 다름과 일부 맞음\n### C1 값\n- 글(1): 「목록은 966ms에 보입니다.」\n- 출처: \`source.txt\`\n- 출처의 말: 「966ms」\n- 고칠 말: 966ms\n`;
    expect(verify(detailed)).toEqual([]);
    problem(detailed.replace("「목록은 966ms에 보입니다.」", "「없는 문장」"), "인용이 글에 없음");
  });
  it("출처에 없음과 못 엶은 찾은 곳과 실패한 까닭을 요구한다", () => {
    for (const [verdict, section] of [["출처에 없음", "찾은 곳"], ["못 엶", "실패한 까닭"]]) {
      const report = validReport().replace("맞음 1", "맞음 0").replace(`${verdict} 0`, `${verdict} 1`).replace("| 맞음 |", `| ${verdict} |`);
      problem(report, "표에 줄이 없음");
      const withReason = report + `\n## ${verdict}\n| 번호 | ${section} |\n|---|---|\n| C1 | source.txt에서 966ms 검색 |\n`;
      expect(verify(withReason)).toEqual([]);
      problem(withReason.replace("source.txt에서 966ms 검색", ""), "비어 있음");
    }
  });
  it("대조 안 함은 따로 적고 까닭을 요구한다", () => {
    const report = validReport().replace("맞음 1", "맞음 0").replace("대조 안 함 0", "대조 안 함 1").replace(/^\| C1.*\n/mu, "") + "\n## 대조 안 함\n| 번호 | 까닭 |\n|---|---|\n| C1 | 예시 숫자 |\n";
    expect(verify(report)).toEqual([]);
    problem(report.replace("예시 숫자", ""), "까닭이 비어");
  });
  it("건수와 점수 표현을 검사하고 실제 비율은 허용한다", () => {
    problem(validReport().replace("맞음 1", "맞음 9"), "건수");
    problem(validReport().replace("인용: 「966ms」", "계산: 확신도 90%"), "확신도");
    expect(verify(validReport().replace("인용: 「966ms」", "계산: (966 - 46) / 966 = 95%"))).toEqual([]);
  });
  it("명령 근거는 실행하지 않는다", () => {
    expect(verify(validReport().replace("인용: 「966ms」", "명령: `exit 37` → `966ms`"))).toEqual([]);
  });
  it("가릴 이름을 오류에 다시 출력하지 않는다", () => {
    const messages = verify(validReport().replace("| 맞음 |", "| TEST-NAME |"), source, ["TEST-NAME"]).map((item) => item.message).join("\n");
    expect(messages).not.toContain("TEST-NAME"); expect(messages).toContain("이름");
  });
});
describe("대조표 읽기", () => {
  it("백틱 길이가 다른 코드와 이스케이프한 막대를 칸으로 나누지 않는다", () => expect(splitTableRow("| a | ``x ` | y`` | c\\|d |")).toEqual(["a", "``x ` | y``", "c|d"]));
  it("펜스 안의 표와 제목을 무시한다", () => expect(parseReport("```md\n## 대조표\n| 번호 |\n|---|\n| C1 |\n```\n").sections).toEqual({}));
  it("HTML의 실행 코드와 스타일을 빼고 붙은 단위를 받는다", () => {
    const texts = toSearchableTexts({ text: "<style>가짜</style><script>가짜</script><b>966</b>ms &amp; 46ms", isHtml: true });
    expect(() => toSearchableTexts({ text: "<html>&#999999999999;</html>", isHtml: true })).not.toThrow();
    expect(texts.some((text) => text.includes("966ms & 46ms"))).toBe(true); expect(texts.join()).not.toContain("가짜");
  });
});
