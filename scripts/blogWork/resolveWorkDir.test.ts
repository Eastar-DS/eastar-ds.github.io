import { describe, expect, it } from "vitest";

import {
  expandHome,
  isInsideDir,
  isValidWorkSlug,
  listConfigCandidates,
  parseBlogWorkConfig,
  resolvePostWorkDir,
  resolveWorkRoot,
} from "./resolveWorkDir.ts";

const home = "/home/writer";

describe("expandHome", () => {
  it("~와 ~/로 시작하는 경로를 홈 폴더로 푼다", () => {
    expect(expandHome({ value: "~", home })).toBe("/home/writer");
    expect(expandHome({ value: "~/.blog-work", home })).toBe("/home/writer/.blog-work");
  });

  it("~가 앞에 없거나 ~user 꼴이면 그대로 둔다", () => {
    expect(expandHome({ value: "/tmp/work", home })).toBe("/tmp/work");
    expect(expandHome({ value: "~other/work", home })).toBe("~other/work");
  });
});

describe("isValidWorkSlug", () => {
  it("글 이름 꼴과 _evals만 받는다", () => {
    expect(isValidWorkSlug("virtualized-document-list")).toBe(true);
    expect(isValidWorkSlug("post2")).toBe(true);
    expect(isValidWorkSlug("_evals")).toBe(true);
  });

  it("대문자, 경로 글자, 앞뒤 하이픈은 거절한다", () => {
    expect(isValidWorkSlug("Post")).toBe(false);
    expect(isValidWorkSlug("../secret")).toBe(false);
    expect(isValidWorkSlug("a/b")).toBe(false);
    expect(isValidWorkSlug("-post")).toBe(false);
    expect(isValidWorkSlug("post--two")).toBe(false);
    expect(isValidWorkSlug("")).toBe(false);
  });
});

describe("parseBlogWorkConfig", () => {
  it("칸을 읽고 없는 칸은 빈 값으로 채운다", () => {
    expect(
      parseBlogWorkConfig(
        '{"workDir":"~/w","repos":{"knot":"~/knot"},"sourceRoots":["~/notes"],"hiddenNames":["홍길동"," ",""]}',
      ),
    ).toEqual({
      ok: true,
      config: { workDir: "~/w", repos: { knot: "~/knot" }, sourceRoots: ["~/notes"], hiddenNames: ["홍길동"], readPolicy: [], unopenedNames: [] },
    });
    expect(parseBlogWorkConfig("{}")).toEqual({
      ok: true,
      config: { workDir: undefined, repos: {}, sourceRoots: [], hiddenNames: [], readPolicy: [], unopenedNames: [] },
    });
  });

  it("모양이 다르면 까닭을 돌려준다", () => {
    expect(parseBlogWorkConfig("not json")).toEqual({ ok: false, reason: "JSON이 아닙니다" });
    expect(parseBlogWorkConfig("[]").ok).toBe(false);
    expect(parseBlogWorkConfig('{"workDir":3}').ok).toBe(false);
    expect(parseBlogWorkConfig('{"repos":{"knot":1}}').ok).toBe(false);
    expect(parseBlogWorkConfig('{"sourceRoots":"~/notes"}').ok).toBe(false);
    expect(parseBlogWorkConfig('{"hiddenNames":[1]}').ok).toBe(false);
  });
});

describe("listConfigCandidates", () => {
  it("저장소 밖 기본 설정 파일을 먼저, 저장소 안 예전 설정 파일을 다음에 본다", () => {
    expect(listConfigCandidates({ envConfig: undefined, home, repoRoot: "/repo" })).toEqual([
      "/home/writer/.blog-work/config.json",
      "/repo/.claude/blog-work.local.json",
    ]);
  });

  it("환경 변수가 있으면 그 파일만 본다", () => {
    expect(listConfigCandidates({ envConfig: "~/other.json", home, repoRoot: "/repo" })).toEqual([
      "/home/writer/other.json",
    ]);
    expect(listConfigCandidates({ envConfig: " ", home, repoRoot: "/repo" })).toHaveLength(2);
  });
});

describe("resolveWorkRoot", () => {
  const config = { workDir: "~/from-config", repos: {}, sourceRoots: [], hiddenNames: [] };

  it("환경 변수, 설정, 기본값 순으로 고른다", () => {
    expect(resolveWorkRoot({ envWorkDir: "/tmp/from-env", config, home })).toBe("/tmp/from-env");
    expect(resolveWorkRoot({ envWorkDir: undefined, config, home })).toBe("/home/writer/from-config");
    expect(resolveWorkRoot({ envWorkDir: undefined, config: null, home })).toBe("/home/writer/.blog-work");
  });

  it("빈 환경 변수는 없는 것으로 본다", () => {
    expect(resolveWorkRoot({ envWorkDir: " ", config, home })).toBe("/home/writer/from-config");
  });
});

describe("isInsideDir", () => {
  it("같은 폴더와 하위 폴더는 안으로 본다", () => {
    expect(isInsideDir({ dir: "/repo", parent: "/repo" })).toBe(true);
    expect(isInsideDir({ dir: "/repo/.work/post", parent: "/repo" })).toBe(true);
  });

  it("이름이 비슷한 옆 폴더와 위 폴더는 밖으로 본다", () => {
    expect(isInsideDir({ dir: "/repo-work", parent: "/repo" })).toBe(false);
    expect(isInsideDir({ dir: "/", parent: "/repo" })).toBe(false);
    expect(isInsideDir({ dir: "/home/writer/.blog-work", parent: "/repo" })).toBe(false);
  });
});

describe("resolvePostWorkDir", () => {
  it("작업 폴더 뿌리 아래 글 이름 폴더를 돌려준다", () => {
    expect(resolvePostWorkDir({ workRoot: "/home/writer/.blog-work", slug: "my-post", repoRoot: "/repo" })).toEqual({
      ok: true,
      dir: "/home/writer/.blog-work/my-post",
    });
  });

  it("작업 폴더가 저장소 안이면 거절한다", () => {
    const result = resolvePostWorkDir({ workRoot: "/repo/.work", slug: "my-post", repoRoot: "/repo" });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.kind).toBe("inside-repo");
  });

  it("글 이름 꼴이 아니면 거절한다", () => {
    const result = resolvePostWorkDir({ workRoot: "/home/writer/.blog-work", slug: "../x", repoRoot: "/repo" });

    expect(!result.ok && result.kind).toBe("invalid-slug");
  });
});

describe("공용 설정 계약", () => {
  it("환경 변수 파일을 지정하면 그 파일만 찾는다", () => expect(listConfigCandidates({ envConfig: "~/custom.json", home: "/home/example", repoRoot: "/repo" })).toEqual(["/home/example/custom.json"]));
  it("밖의 기본 설정 뒤에 저장소 로컬 설정을 찾는다", () => expect(listConfigCandidates({ envConfig: undefined, home: "/home/example", repoRoot: "/repo" })).toEqual(["/home/example/.blog-work/config.json", "/repo/.claude/blog-work.local.json"]));
  it("기존 설정을 유지하며 읽기 정책을 검증한다", () => {
    const result = parseBlogWorkConfig('{"sourceRoots":["~/notes"],"readPolicy":[{"path":"~/notes","read":"단서만"}]}');
    expect(result.ok && result.config.sourceRoots).toEqual(["~/notes"]);
    expect(parseBlogWorkConfig('{"readPolicy":[{"path":"~/notes","read":"아무거나"}]}').ok).toBe(false);
    expect(parseBlogWorkConfig('{"readPolicy":[{"path":" ","read":"읽음"}]}').ok).toBe(false);
    expect(parseBlogWorkConfig('{"unopenedNames":[3]}').ok).toBe(false);
    const extra = parseBlogWorkConfig('{"readPolicy":[{"path":"~/notes","read":"단서만","kind":"개인 노트"}],"unopenedNames":["session.*.json"]}');
    expect(extra.ok && extra.config.unopenedNames).toEqual(["session.*.json"]);
  });
  it("저장소 안과 작업 이름의 경로 탈출을 거절한다", () => {
    expect(resolvePostWorkDir({ workRoot: "/repo/work", slug: "post", repoRoot: "/repo" }).ok).toBe(false);
    expect(resolvePostWorkDir({ workRoot: "/work", slug: "../post", repoRoot: "/repo" }).ok).toBe(false);
    expect(resolvePostWorkDir({ workRoot: "/work", slug: "_evals", repoRoot: "/repo" }).ok).toBe(true);
  });
});
