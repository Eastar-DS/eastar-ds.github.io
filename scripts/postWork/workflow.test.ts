import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { makePostFixtures } from "../makePostFixtures.ts";
import { scanSources } from "../gatherPostSources/scan.ts";
import { checkSources, renderSources } from "../gatherPostSources/sourcesDocument.ts";
import { checkInterview } from "../interviewForPost/check.ts";
import { parseInterviewMd } from "../interviewForPost/document.ts";
import { saveAnswers } from "../interviewForPost/save.ts";
import { checkOutline } from "../planPost/check.ts";
import { physicalPath, REPO_ROOT, workContext } from "./io.ts";
vi.mock("node:fs", async (original) => {
  const fs = await original<typeof import("node:fs")>();
  return { ...fs, readFileSync: vi.fn(fs.readFileSync) };
});
let base: string;
let fixtures: ReturnType<typeof makePostFixtures>;
beforeEach(() => {
  base = mkdtempSync(path.join(tmpdir(), "blog-work-test-"));
  fixtures = makePostFixtures(base);
  vi.stubEnv("BLOG_WORK_CONFIG", fixtures.configFile);
  vi.stubEnv("BLOG_WORK_DIR", "");
});
afterEach(() => { vi.unstubAllEnvs(); rmSync(base, { recursive: true, force: true }); vi.clearAllMocks(); });
const read = (dir: string, file: string) => readFileSync(path.join(dir, file), "utf8");
describe("자료 훑기와 확정", () => {
  it("개인 문장과 비밀값을 출력하지 않고 금지 파일을 열지 않는다", () => {
    const { scan } = scanSources({ work: "gather-eval", topics: ["가상화"] });
    const text = renderSources(scan, ["모과"]);
    expect(scan.items.filter((item) => item.kind === "해설 아티팩트")).toHaveLength(9);
    expect(scan.artifactPairs.filter((pair) => pair.state === "짝")).toHaveLength(6);
    expect(scan.artifactPairs.filter((pair) => pair.state === "짝 없음")).toHaveLength(1);
    expect(scan.folders).toEqual(expect.arrayContaining([expect.objectContaining({ fileCount: 250 })]));
    expect(scan.items.find((item) => item.path.endsWith("career.md"))?.defaultUse).toBe("단서만");
    expect(text).not.toContain("모과");
    expect(JSON.stringify(scan)).not.toContain("가짜 개인 문장");
    const reads = vi.mocked(readFileSync).mock.calls.map(([file]) => String(file));
    expect(reads.some((file) => /prod\.env$|login-state\.json$|meetings\/record\.md$/.test(file))).toBe(false);
    expect(scan.items.some((item) => item.path.includes("other-topic"))).toBe(false);
    expect(scan.items.find((item) => item.path.endsWith("agent-brief.md"))?.defaultUse).toBe("단서만");
    expect(checkSources({ text, scan, names: ["모과"], dir: fixtures.scenarios.gather })).toEqual([]);
  });
  it("새 파일을 더해도 번호와 사람이 고른 쓰임을 보존한다", () => {
    const first = scanSources({ work: "gather-eval", topics: ["가상화"] }).scan;
    const before = renderSources(first, ["모과"]).replace("| 다시 써서 씀 |", "| 관련 없음 |");
    writeFileSync(path.join(base, "materials/rendering/new-note.txt"), "주제어 없는 새 파일");
    const second = scanSources({ work: "gather-eval", topics: ["가상화"] }).scan;
    for (const item of first.items) expect(second.items.find((current) => current.path === item.path)?.id).toBe(item.id);
    expect(renderSources(second, ["모과"], before)).toContain("| 관련 없음 |");
    expect(second.items.find((item) => item.path.endsWith("new-note.txt"))).toBeDefined();
  });
  it("확인 답 없이 확정하거나 원본이 없는 짝을 통과시키지 않는다", () => {
    const { scan } = scanSources({ work: "gather-eval", topics: ["가상화"] });
    const invalid = renderSources(scan, ["모과"]).replace("- 상태: 이스타 확인 기다림", "- 상태: 확정").replace("|  | 짝 없음 |", "| S999 | 짝 |");
    const errors = checkSources({ text: invalid, scan, names: ["모과"], dir: fixtures.scenarios.gather });
    expect(errors.some((message) => message.includes("답 원문"))).toBe(true);
    expect(errors.some((message) => message.includes("원본 번호"))).toBe(true);
  });
  it("가릴 이름을 오류에 출력하지 않는다", () => {
    const { scan } = scanSources({ work: "gather-eval", topics: ["가상화"] });
    const errors = checkSources({ text: `${renderSources(scan, ["모과"])}\n모과`, scan, names: ["모과"], dir: fixtures.scenarios.gather });
    expect(errors.join("\n")).toContain("가릴 이름");
    expect(errors.join("\n")).not.toContain("모과");
  });
  it("결과 경로가 저장소 안으로 향하는 심볼릭 링크면 거절한다", () => {
    const root = path.join(base, "linked");
    symlinkSync(REPO_ROOT, root, "dir");
    vi.stubEnv("BLOG_WORK_DIR", root);
    expect(physicalPath(root)).toBe(physicalPath(REPO_ROOT));
    expect(() => workContext("sample-work", true)).toThrow("저장소 밖");
  });
  it("대상이 아직 없는 심볼릭 링크도 따라 쓰지 않는다", () => {
    const file = path.join(base, "broken-result.md");
    symlinkSync(path.join(base, "not-created.md"), file);
    expect(() => physicalPath(file)).toThrow();
  });
});
describe("인터뷰 원문 보존", () => {
  it("없음과 나중에를 저장하고 변조된 답을 검출한다", () => {
    const dir = fixtures.scenarios.single;
    saveAnswers({ work: "single-eval", from: "answers-raw-1.txt" });
    const text = read(dir, "interview.md");
    const context = { sources: read(dir, "sources.md"), outline: read(dir, "outline.md"), names: ["모과"], dir };
    expect(checkInterview({ ...context, text })).toEqual([]);
    const parsed = parseInterviewMd(text);
    expect(parsed.questions.map((question) => question.fields["상태"])).toEqual(["답함", "없음", "나중에", "답함", "답함"]);
    expect(parsed.questions[0].answer).toBe("직접 계산을 통해 원리를 확인하고 싶었음.");
    expect(checkInterview({ ...context, text: text.replace("직접 계산을 통해", "직접 계산해서") }).join("\n")).toContain("답이 원문과 다릅니다");
  });
  it("중복 저장은 답을 늘리지 않으며 다시 받은 답과 긴 코드 펜스도 지킨다", () => {
    const dir = fixtures.scenarios.single;
    saveAnswers({ work: "single-eval", from: "answers-raw-1.txt" });
    const first = read(dir, "interview.md");
    saveAnswers({ work: "single-eval", from: "answers-raw-1.txt" });
    expect(read(dir, "interview.md")).toBe(first);
    writeFileSync(path.join(dir, "second.txt"), "1: 원문  \n````text\n2: 코드 안의 번호\n````\n끝\n");
    saveAnswers({ work: "single-eval", from: "second.txt" });
    const text = read(dir, "interview.md");
    expect(text).toContain("다시 받음");
    expect(checkInterview({ text, sources: read(dir, "sources.md"), outline: read(dir, "outline.md"), names: ["모과"], dir })).toEqual([]);
    writeFileSync(path.join(dir, "answers/interview-answer-1.txt"), "원문이 바뀜");
    expect(checkInterview({ text, sources: read(dir, "sources.md"), outline: read(dir, "outline.md"), names: ["모과"], dir }).join("\n")).toContain("원문과 다릅니다");
  });
  it("번호 없는 답도 저장하고 내용이 달라지면 실패한다", () => {
    const dir = fixtures.scenarios.single;
    writeFileSync(path.join(dir, "unnumbered.txt"), "번호 없이 보낸 원문입니다.\n");
    saveAnswers({ work: "single-eval", from: "unnumbered.txt" });
    const text = read(dir, "interview.md");
    const context = { sources: read(dir, "sources.md"), outline: read(dir, "outline.md"), names: ["모과"], dir };
    expect(checkInterview({ text, ...context })).toEqual([]);
    expect(checkInterview({ text: text.replace("번호 없이 보낸", "고쳐서 적은"), ...context }).join("\n")).toContain("번호 없는 답이 원문과 다릅니다");
  });
});
describe("개요의 공개 범위와 구조", () => {
  it("한 편과 글 두 편과 세 편 시리즈를 검사한다", () => {
    for (const dir of [fixtures.scenarios.single, fixtures.scenarios.two, fixtures.scenarios.many]) expect(checkOutline({ text: read(dir, "outline.md"), sources: read(dir, "sources.md") })).toEqual([]);
  });
  it("두 편 시리즈와 금지 자료와 주소 겹침과 잘못된 합계를 검출한다", () => {
    const dir = fixtures.scenarios.two;
    const sources = read(dir, "sources.md");
    const text = read(dir, "outline.md");
    expect(checkOutline({ text: text.replace("결과: 글 두 편", "결과: 시리즈 2편"), sources }).join("\n")).toContain("두 편은 시리즈");
    const material = sources.replaceAll("| 다시 써서 씀 |", "| 단서만 |").replaceAll("| 써도 됨 |", "| 단서만 |");
    expect(checkOutline({ text, sources: material }).join("\n")).toContain("글에 쓸 수 없는 자료");
    expect(checkOutline({ text, sources, existingSlugs: ["virtual-document-window"] }).join("\n")).toContain("겹침");
    expect(checkOutline({ text: text.replaceAll("| 1,500 |", "| 1,501 |"), sources }).join("\n")).toContain("합계");
  });
});
