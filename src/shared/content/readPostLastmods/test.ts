import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import readPostLastmods, { parsePostLastmod } from ".";

const toSource = (frontmatter: string) => `---\n${frontmatter}\n---\n\n본문입니다.\n`;

describe("parsePostLastmod", () => {
  it("고친 날이 있으면 고친 날을 쓴다", () => {
    const source = toSource('title: "제목"\npublishedAt: 2026-11-18\nupdatedAt: 2026-11-20 # 내용을 고쳤을 때만');

    expect(parsePostLastmod(source)?.toISOString()).toBe("2026-11-19T15:00:00.000Z");
  });

  it("고친 날이 없으면 쓴 날을 쓴다", () => {
    expect(parsePostLastmod(toSource("publishedAt: 2026-11-18"))?.toISOString()).toBe(
      "2026-11-17T15:00:00.000Z",
    );
  });

  it("따옴표로 감싼 날짜도 읽는다", () => {
    expect(parsePostLastmod(toSource('publishedAt: "2026-11-18"'))?.toISOString()).toBe(
      "2026-11-17T15:00:00.000Z",
    );
  });

  it("본문에 있는 같은 이름의 줄은 읽지 않는다", () => {
    const source = `${toSource("publishedAt: 2026-11-18")}\nupdatedAt: 2026-12-01\n`;

    expect(parsePostLastmod(source)?.toISOString()).toBe("2026-11-17T15:00:00.000Z");
  });

  it("앞머리나 쓴 날이 없으면 undefined", () => {
    expect(parsePostLastmod("본문만 있습니다")).toBeUndefined();
    expect(parsePostLastmod(toSource('title: "제목"'))).toBeUndefined();
  });

  it("날짜로 읽을 수 없으면 빌드를 멈춘다", () => {
    expect(() => parsePostLastmod(toSource("publishedAt: 지난주"))).toThrow("publishedAt");
  });
});

describe("readPostLastmods", () => {
  let postsDir = "";

  afterEach(() => {
    rmSync(postsDir, { recursive: true, force: true });
  });

  it("글 폴더 이름별로 lastmod를 읽고, index.mdx가 없는 폴더는 건너뛴다", () => {
    postsDir = mkdtempSync(path.join(tmpdir(), "posts-"));
    mkdirSync(path.join(postsDir, "first-post"));
    writeFileSync(path.join(postsDir, "first-post", "index.mdx"), toSource("publishedAt: 2026-11-18"));
    mkdirSync(path.join(postsDir, "empty-folder"));

    const lastmods = readPostLastmods(postsDir);

    expect([...lastmods.keys()]).toEqual(["first-post"]);
    expect(lastmods.get("first-post")?.toISOString()).toBe("2026-11-17T15:00:00.000Z");
  });
});
