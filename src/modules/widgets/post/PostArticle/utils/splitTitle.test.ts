import { describe, expect, it } from "vitest";

import splitTitle from "./splitTitle";

describe("splitTitle", () => {
  it("첫 콜론 뒤에서 나누고 콜론은 앞 덩어리에 남긴다", () => {
    expect(
      splitTitle("브라우저는 언제 화면을 다시 그릴까: 레이아웃과 페인트"),
    ).toEqual(["브라우저는 언제 화면을 다시 그릴까:", "레이아웃과 페인트"]);
  });

  it("콜론이 없으면 나누지 않는다", () => {
    expect(splitTitle("이벤트 루프를 직접 돌려 보기")).toEqual([
      "이벤트 루프를 직접 돌려 보기",
    ]);
  });

  it("시간처럼 뒤에 공백이 없는 콜론은 나누지 않는다", () => {
    expect(splitTitle("10:30에 일어난 일")).toEqual(["10:30에 일어난 일"]);
  });
});
