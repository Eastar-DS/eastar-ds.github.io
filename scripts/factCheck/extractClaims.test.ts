import { describe, expect, it } from "vitest";

import { createClaimsFile, extractClaims, findSentence } from "./extractClaims.ts";

const post = [
  "---",
  'title: "목록 가상화하기: 966ms를 46ms로"',
  'description: "문서 1,939개를 그리던 목록을 고친 방법을 다룹니다."',
  "publishedAt: 2026-11-21",
  "draft: true",
  "---",
  "",
  'import Demo from "@/modules/features/demo/Demo/index.astro";',
  "",
  "목록이 보이기까지 CPU를 4배 느리게 한 조건에서 966ms가 걸렸습니다. 고친 뒤에는 46ms로 줄었고, 이어지는 내용은 [2편](/posts/next-post/)에서 씁니다.",
  "",
  "## 얼마나 빨라졌나",
  "",
  "같은 조건에서 966ms에서 46ms로 95% 줄었습니다. 개선 전은 `11ac67db`의 빌드, 개선 후는 2026년 11월 12일 [PR #1142](https://github.com/example/repo/pull/1142)의 빌드이고, React 19.2를 씁니다.",
  "",
  "측정 창은 1200×818, 화면 배율 2였고, 범위는 892~1,155ms였습니다.",
  "",
  '<Figure caption="그림 1. 문서 1,000개 폴더를 600px 영역에서 본 모습입니다.">',
  "  <Demo />",
  "</Figure>",
  "",
  "| 시간을 쓴 곳 | 개선 전 | 개선 후 |",
  "| --- | ---: | ---: |",
  "| JavaScript | 676ms | 164ms |",
  "",
  "```ts title=\"getRowOffsets.ts\" {1-2}",
  "export const getRowOffsets = () => [0, 64, 157];",
  "const unused = 999;",
  "```",
  "",
  "- `getRowOffsets`는 1px 구분선을 더합니다.",
  "1. 첫 단계에서 [`content-visibility`](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility)를 넣었습니다.",
  "",
  "React 17부터 `onBlur`는 버블링합니다. CPU 4배 느림에서 쟀습니다. 결정은 ADR 1117에 적었습니다.",
  "",
  "〔이스타 확인: 숫자 12개를 더 적을지〕",
  "",
].join("\n");

const claims = extractClaims(post);
const find = (kind: string, text: string) => claims.find((claim) => claim.kind === kind && claim.text === text);

describe("extractClaims", () => {
  it("같은 숫자는 앞머리와 본문의 줄을 모아 한 건으로 묶고, 문장은 본문에서 가져온다", () => {
    expect(find("number", "966ms")).toMatchObject({
      id: "C1",
      lines: [2, 10, 14],
      section: "첫 문단",
      sentence: "목록이 보이기까지 CPU를 4배 느리게 한 조건에서 966ms가 걸렸습니다.",
    });
  });

  it("쉼표가 든 수, 범위, 가로세로, 단위 없는 숫자를 한 덩어리로 뽑는다", () => {
    expect(find("number", "1,939개")?.lines).toEqual([3]);
    expect(find("number", "892~1,155ms")).toBeDefined();
    expect(find("number", "1200×818")).toBeDefined();
    expect(find("number", "2")?.section).toBe("얼마나 빨라졌나");
    expect(find("number", "4배")?.lines).toEqual([10, 34]);
  });

  it("버전, 날짜, PR과 ADR 번호, 커밋 해시를 따로 뽑는다", () => {
    expect(find("version", "React 19.2")).toBeDefined();
    expect(find("version", "React 17부터")).toBeDefined();
    expect(find("date", "2026년 11월 12일")).toBeDefined();
    expect(find("ref", "PR #1142")).toBeDefined();
    expect(find("ref", "ADR 1117")).toBeDefined();
    expect(find("ref", "11ac67db")).toBeDefined();
    // 「CPU 4배」는 버전이 아니다
    expect(claims.some((claim) => claim.kind === "version" && claim.text.startsWith("CPU"))).toBe(false);
  });

  it("인라인 코드와 바깥 링크를 뽑고, 내부 링크와 시리즈 편 번호는 뽑지 않는다", () => {
    expect(find("code", "getRowOffsets")?.lines).toEqual([31]);
    expect(find("code", "onBlur")).toBeDefined();
    expect(find("link", "https://github.com/example/repo/pull/1142")?.linkText).toBe("PR #1142");
    expect(find("link", "https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility")?.linkText).toBe(
      "`content-visibility`",
    );
    expect(claims.some((claim) => claim.text.includes("/posts/"))).toBe(false);
    expect(claims.some((claim) => claim.kind === "number" && claim.lines.includes(10) && claim.text === "2")).toBe(false);
  });

  it("그림 설명의 숫자는 뽑고 「그림 1」의 번호는 뽑지 않는다", () => {
    expect(find("number", "1,000개")?.lines).toEqual([18]);
    expect(find("number", "600px")).toBeDefined();
    expect(find("number", "1")).toBeUndefined();
  });

  it("표의 칸을 뽑고 문장으로 그 줄 전체를 쓴다", () => {
    expect(find("number", "676ms")?.sentence).toBe("JavaScript | 676ms | 164ms");
  });

  it("코드 칸은 칸마다 한 건이고, 칸 안의 글자에서는 뽑지 않는다", () => {
    expect(find("codeBlock", "getRowOffsets.ts")).toMatchObject({
      lang: "ts",
      title: "getRowOffsets.ts",
      lines: [26],
      lineCount: 2,
    });
    expect(find("number", "999")).toBeUndefined();
    expect(find("number", "157")).toBeUndefined();
  });

  it("목록 표시 숫자, import 줄, 앞머리의 다른 칸에서는 뽑지 않는다", () => {
    expect(claims.some((claim) => claim.lines.includes(32) && claim.text === "1")).toBe(false);
    expect(claims.some((claim) => claim.lines.includes(4))).toBe(false);
    expect(claims.some((claim) => claim.lines.includes(8))).toBe(false);
  });

  it("〔이스타 확인〕 표시는 통째로 한 건이고 그 안의 숫자는 뽑지 않는다", () => {
    expect(find("marker", "〔이스타 확인: 숫자 12개를 더 적을지〕")?.lines).toEqual([36]);
    expect(find("number", "12개")).toBeUndefined();
  });

  it("번호는 글에 처음 나온 차례로 빈틈없이 붙는다", () => {
    expect(claims.map((claim) => claim.id)).toEqual(claims.map((_, index) => `C${index + 1}`));
  });
});

describe("findSentence", () => {
  it("마침표 뒤 공백에서 나누고 링크 주소를 뺀다", () => {
    const text = "첫 문장입니다. 둘째 문장은 [MDN](https://developer.mozilla.org)을 봅니다. 셋째 0.8%입니다.";

    expect(findSentence({ text, index: text.indexOf("둘째") })).toBe("둘째 문장은 MDN을 봅니다.");
    expect(findSentence({ text, index: text.indexOf("0.8") })).toBe("셋째 0.8%입니다.");
  });
});

describe("createClaimsFile", () => {
  it("글의 sha256, 줄 수, 종류마다 개수를 담는다", () => {
    const file = createClaimsFile({ source: post, slug: "sample", file: "/tmp/sample/index.mdx", generatedAt: "2026-11-22" });

    expect(file.post).toMatchObject({ slug: "sample", lines: 36 });
    expect(file.post.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(file.counts.marker).toBe(1);
    expect(Object.values(file.counts).reduce((sum, count) => sum + count, 0)).toBe(file.claims.length);
  });
});
