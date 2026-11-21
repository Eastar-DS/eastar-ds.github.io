import { describe, expect, it } from "vitest";

import {
  ASCII_PRINTABLE,
  collectCodeHangul,
  collectSiteCharacters,
  decodeEscapes,
} from "./collectFontText";

describe("decodeEscapes", () => {
  it("HTML 문자 참조를 글자로 되돌린다", () => {
    expect(decodeEscapes("&#xAC00;&#44032;")).toBe("가가");
  });

  it("JS의 유니코드 이스케이프는 풀지 않는다 (정규식 범위 경계가 글자로 잡히지 않게)", () => {
    expect(decodeEscapes("/[\\u1FFF-\\u2C00]/")).toBe("/[\\u1FFF-\\u2C00]/");
  });
});

describe("collectSiteCharacters", () => {
  it("보이는 글자만 겹치지 않게 모으고 ASCII를 늘 넣는다", () => {
    const characters = collectSiteCharacters(["<p>한글 · 글</p>\n\t", "const a = `재생 중`;"]);

    expect(characters).toEqual(expect.arrayContaining(["한", "글", "·", "재", "생", "중"]));
    expect(characters).toEqual(expect.arrayContaining(ASCII_PRINTABLE));
    expect(characters).not.toContain("\n");
    expect(characters.filter((character) => character === "글")).toHaveLength(1);
  });
});

describe("collectCodeHangul", () => {
  it("<pre> · <code> 안의 한글만 모은다", () => {
    const html =
      '<p>본문</p><pre class="x"><code><span>// 읽기</span></code></pre> <code>가나</code>';

    expect(collectCodeHangul([html])).toEqual(["가", "기", "나", "읽"]);
  });
});
