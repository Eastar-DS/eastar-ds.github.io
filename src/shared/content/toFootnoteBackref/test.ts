import { describe, expect, it } from "vitest";

import toFootnoteBackref from ".";

describe("toFootnoteBackref", () => {
  it("첫 돌아가기 링크는 「↑ 읽던 곳으로」이고 이름에 각주 번호를 더한다", () => {
    expect(toFootnoteBackref({ referenceNumber: 1, rerunIndex: 1 })).toEqual({
      content: "↑ 읽던 곳으로",
      label: "읽던 곳으로, 1번 각주를 단 문장",
    });
  });

  it("같은 각주의 두 번째 링크부터 보이는 글 끝에 자리 번호를 붙인다", () => {
    expect(toFootnoteBackref({ referenceNumber: 3, rerunIndex: 2 })).toEqual({
      content: "↑ 읽던 곳으로 2",
      label: "읽던 곳으로 2, 3번 각주를 단 2번째 자리",
    });
  });

  it("이름은 보이는 글에서 화살표만 뺀 글로 시작한다", () => {
    for (const rerunIndex of [1, 2, 5]) {
      const { content, label } = toFootnoteBackref({ referenceNumber: 4, rerunIndex });

      expect(label.startsWith(content.replace(/^↑ /, ""))).toBe(true);
    }
  });
});
