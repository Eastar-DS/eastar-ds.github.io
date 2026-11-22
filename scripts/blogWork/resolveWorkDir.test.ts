import { describe, expect, it } from "vitest";
import { listConfigCandidates, parseBlogWorkConfig, resolvePostWorkDir } from "./resolveWorkDir.ts";
describe("공용 설정 계약", () => {
  it("환경 변수 파일을 지정하면 그 파일만 찾는다", () => expect(listConfigCandidates({ envConfig: "~/custom.json", home: "/home/example", repoRoot: "/repo" })).toEqual(["/home/example/custom.json"]));
  it("밖의 기본 설정 뒤에 저장소 로컬 설정을 찾는다", () => expect(listConfigCandidates({ envConfig: undefined, home: "/home/example", repoRoot: "/repo" })).toEqual(["/home/example/.blog-work/config.json", "/repo/.claude/blog-work.local.json"]));
  it("기존 설정을 유지하며 읽기 정책을 검증한다", () => {
    const result = parseBlogWorkConfig('{"sourceRoots":["~/notes"],"readPolicy":[{"path":"~/notes","read":"단서만"}]}');
    expect(result.ok && result.config.sourceRoots).toEqual(["~/notes"]);
    expect(parseBlogWorkConfig('{"readPolicy":[{"path":"~/notes","read":"아무거나"}]}').ok).toBe(false);
  });
  it("저장소 안과 작업 이름의 경로 탈출을 거절한다", () => {
    expect(resolvePostWorkDir({ workRoot: "/repo/work", slug: "post", repoRoot: "/repo" }).ok).toBe(false);
    expect(resolvePostWorkDir({ workRoot: "/work", slug: "../post", repoRoot: "/repo" }).ok).toBe(false);
    expect(resolvePostWorkDir({ workRoot: "/work", slug: "_evals", repoRoot: "/repo" }).ok).toBe(true);
  });
});
