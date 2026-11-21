import { describe, expect, it } from "vitest";

import collectCodeHangul from ".";

describe("collectCodeHangul", () => {
  it("코드 칸과 본문 속 코드의 한글만 모으고 본문 글은 뺀다", () => {
    const mdx = [
      "본문 글은 빼고",
      "```ts title=\"읽기.ts\"",
      "const a = 1; // 가나",
      "```",
      "본문 속 `다나` 코드",
    ].join("\n");

    expect(collectCodeHangul(mdx)).toEqual(["가", "기", "나", "다", "읽"]);
  });

  it("같은 글자는 한 번만 넣고 정렬한다", () => {
    expect(collectCodeHangul("`나가나`")).toEqual(["가", "나"]);
  });

  it("코드에 한글이 없으면 빈 배열이다", () => {
    expect(collectCodeHangul("한글 본문\n```js\nconst x = 1;\n```")).toEqual([]);
  });
});
