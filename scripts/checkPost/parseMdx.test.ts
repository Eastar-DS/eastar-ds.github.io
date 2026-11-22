import { describe, expect, it } from "vitest";

import parseMdx from "./parseMdx.ts";

const parse = (body: string) => parseMdx({ source: body, bodyStartLine: 1 });

describe("parseMdx", () => {
  it("코드 칸의 언어, 파일 이름, 강조 줄 수, 줄을 읽는다", () => {
    const { codeBlocks } = parse('글\n\n```ts title="resize.ts" {3,5-6}\nconst a = 1;\n```\n');

    expect(codeBlocks).toEqual([
      { line: 3, lang: "ts", meta: 'title="resize.ts" {3,5-6}', title: "resize.ts", highlightedLineCount: 3, lines: ["const a = 1;"], isClosed: true },
    ]);
  });

  it("코드 칸 안의 # 줄은 제목으로 보지 않는다", () => {
    const { headings } = parse("## 진짜 제목\n\n```bash\n# 주석\n```\n");

    expect(headings.map((heading) => heading.text)).toEqual(["진짜 제목"]);
  });

  it("Figure 안팎의 그림과 설명을 읽는다", () => {
    const body = [
      '<Figure caption="그림 1. 막대 `width`" captionSide="bottom">',
      "",
      "![보라색 막대](./bars.png)",
      "",
      "</Figure>",
      "",
      '<img src="./b.png" alt="파란 칸" />',
    ].join("\n");
    const { figures, images } = parse(body);

    expect(figures).toEqual([{ line: 1, caption: "그림 1. 막대 `width`", captionSide: "bottom" }]);
    expect(images).toEqual([
      { line: 7, alt: "파란 칸", src: "./b.png", isInFigure: false },
      { line: 3, alt: "보라색 막대", src: "./bars.png", isInFigure: true },
    ]);
  });

  it("마크다운 링크, 자동 링크, a 태그를 읽고 링크 글은 원문 그대로 둔다", () => {
    const { links } = parse("[`content-visibility` 문서](https://developer.mozilla.org) <https://example.com> <a href=\"/about/\">소개</a>");

    expect(links).toEqual([
      { line: 1, text: "https://example.com", href: "https://example.com" },
      { line: 1, text: "소개", href: "/about/" },
      { line: 1, text: "`content-visibility` 문서", href: "https://developer.mozilla.org" },
    ]);
  });

  it("문장 줄에서 인라인 코드, 태그, 주소를 가리고 줄 종류를 나눈다", () => {
    const { lines } = parse(["import A from \"a\";", "", "`<br>`과 <Callout>강조</Callout> https://a.b/!", "- 목록", "| 표 |"].join("\n"));

    expect(lines.map((line) => line.kind)).toEqual(["esm", "blank", "text", "list", "table"]);
    expect(lines[2]?.text.includes("<br>")).toBe(false);
    expect(lines[2]?.text.includes("!")).toBe(false);
    expect(lines[2]?.text.trim()).toContain("강조");
  });

  it("태그만 있는 줄은 jsx로 본다", () => {
    expect(parse("<Figure caption=\"그림 1. 가\">\n  <Diagram />\n</Figure>").lines.map((line) => line.kind)).toEqual(["jsx", "jsx", "jsx"]);
  });
});
