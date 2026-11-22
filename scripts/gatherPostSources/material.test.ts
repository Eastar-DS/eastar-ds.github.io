import { describe, expect, it } from "vitest";
import { assignIds, classifySource, extractLinks, isUnopenable, matchArtifacts, policyFor, readTitle } from "./material.ts";
import type { SourceItem } from "./types.ts";
import { splitCells } from "../postWork/markdown.ts";
const item = (id: string, file: string, title = "예") => ({ id, path: file, title, kind: "해설 아티팩트", read: "읽음", removed: false, unopenable: false }) as SourceItem;
describe("자료 식별과 읽기 경계", () => {
  it.each(["/work/.env", "/work/prod.env", "/work/playwright-state.json", "/work/login-state.json", "/work/browser-profile/data", "/work/key.pem", "/work/analytics-config/a.json"])("비밀값 의심 이름 %s을 열지 않는다", (file) => expect(isUnopenable(file)).toBe(true));
  it("추가 glob을 쓰되 보통 자료까지 막지 않는다", () => {
    expect(isUnopenable("/work/session.prod.json", ["session.*.json"])).toBe(true);
    expect(isUnopenable("/work/artifacts/list.html")).toBe(false);
  });
  it("부모 읽지 않음 정책은 자식에서 풀지 못한다", () => {
    expect(policyFor("/notes/private/a.md", [{ path: "/notes", read: "읽지 않음" }, { path: "/notes/private", read: "읽음" }]).read).toBe("읽지 않음");
  });
  it("경로 일부가 같은 다른 폴더에 정책을 적용하지 않는다", () => expect(policyFor("/notes-other/a", [{ path: "/notes", read: "단서만" }]).read).toBe("읽음"));
  it("측정 파일과 지시문을 구분한다", () => {
    expect(classifySource("/work/results/run.jsonl")).toBe("측정 기록");
    expect(classifySource("/work/agent-unit-brief.md")).toBe("에이전트 지시문과 작업 메모");
    expect(classifySource("/work/pr/diagrams/rows.svg")).toBe("PR 그림과 도식");
  });
  it("HTML 엔티티를 풀고 제목이 없으면 빈 값을 준다", () => {
    expect(readTitle("<title>행 &amp; 범위</title>", ".html")).toBe("행 & 범위");
    expect(readTitle("<h1>본문</h1>", ".html")).toBe("");
  });
  it("한 문단의 링크 글과 HTML 링크를 잃지 않는다", () => {
    const links = extractLinks('[첫 글](https://claude.ai/artifact/a) [둘째 글](https://claude.ai/artifact/b) <a href="https://claude.ai/artifact/c">셋째 글</a>');
    expect(links.map((link) => link.text)).toEqual(["첫 글", "둘째 글", "셋째 글"]);
  });
  it("짝이 여럿이면 임의로 하나를 고르지 않는다", () => {
    const links = extractLinks("[행 위치: 범위](https://claude.ai/artifact/a) [없는 제목](https://claude.ai/artifact/b)");
    const result = matchArtifacts(links, [item("S001", "/a.html", "행 위치 범위"), item("S002", "/b.html", "행위치 범위")]);
    expect(result.artifactPairs.map((pair) => pair.state)).toEqual(["여럿", "짝 없음"]);
  });
  it("다른 문서의 빈 링크 글이 먼저 찾은 제목을 지우지 않는다", () => {
    const links = [...extractLinks("[행 위치](https://claude.ai/artifact/a)", "PR"), ...extractLinks("https://claude.ai/artifact/a", "다른 문서")];
    expect(matchArtifacts(links, [item("S001", "/a.html", "행 위치")]).artifactPairs[0].localId).toBe("S001");
  });
  it("부른 쪽이 준 짝 후보는 자동 짝으로 올리지 않는다", () => {
    const url = "https://claude.ai/artifact/a";
    const result = matchArtifacts(extractLinks(`[행 위치](${url})`), [item("S001", "/a.html", "다른 해설")], { [url]: "/a.html" });
    expect(result.artifactPairs[0]).toMatchObject({ localId: null, state: "짝 없음", hintIds: ["S001"] });
    expect(result.unpairedLocalArtifacts).toContain("S001");
  });
  it("다시 훑어도 번호를 재사용하지 않는다", () => {
    const result = assignIds([item("", "/b"), item("", "/c")], [item("S001", "/a"), item("S005", "/b")]);
    expect(result.map((value) => [value.id, value.path, value.removed])).toEqual([["S005", "/b", false], ["S006", "/c", false], ["S001", "/a", true]]);
  });
  it("인라인 코드와 이스케이프 안의 세로줄을 표 경계로 보지 않는다", () => expect(splitCells("| S001 | `a|b` | 가\\|나 | 값 |")).toEqual(["S001", "`a|b`", "가|나", "값"]));
});
