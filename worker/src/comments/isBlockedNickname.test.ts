import { describe, expect, it } from "vitest";

import isBlockedNickname, { toHangulKey, toLatinKey } from "./isBlockedNickname";

describe("isBlockedNickname", () => {
  it.each([
    "이스타",
    "이 스 타",
    "이.스.타",
    "이_스-타!!",
    "이​스타",
    "ㅇㅣㅅㅡㅌㅏ",
    "ㅇ ㅣ ㅅ ㅡ ㅌ ㅏ",
    "이쓰타",
    "이스따",
    "ｲｽﾀ이스타",
    "진짜이스타",
    "이스타님",
    "안녕이스타",
    "ㅇl스타",
    "o|스타",
    "글쓴이",
    "글 쓴 이",
    "글쓰니",
    "글.쓴.이",
    "ㄱㅡㄹㅆㅡㄴㅇㅣ",
    "eastar",
    "EASTAR",
    "e a s t a r",
    "3a5t4r",
    "ｅａｓｔａｒ",
    "eastar-DS",
  ])("「%s」은 막는다", (nickname) => {
    expect(isBlockedNickname(nickname)).toBe(true);
  });

  it.each(["기스타", "미스터", "시스템", "리스트", "이수타", "지나가던 개발자", "글쓰기 연습", "east", "star", "작성자", "익명"])(
    "「%s」은 막지 않는다",
    (nickname) => {
      expect(isBlockedNickname(nickname)).toBe(false);
    },
  );

  it("막는 낱말 목록을 바꿔 쓸 수 있다", () => {
    expect(isBlockedNickname("운 영 자", ["운영자"])).toBe(true);
    expect(isBlockedNickname("이스타", ["운영자"])).toBe(false);
  });
});

describe("toHangulKey", () => {
  it("띄어쓰기 · 자모 나눠 쓰기 · 연음 · 된소리를 같은 꼴로 모은다", () => {
    expect(toHangulKey("글 쓴 이")).toBe(toHangulKey("글쓰니"));
    expect(toHangulKey("ㅇㅣㅅㅡㅌㅏ")).toBe(toHangulKey("이스타"));
    expect(toHangulKey("이쓰따")).toBe(toHangulKey("이스타"));
  });

  it("받침 ㅇ은 다음 글자로 넘기지 않는다", () => {
    expect(toHangulKey("강아")).not.toBe(toHangulKey("가나"));
  });
});

describe("toLatinKey", () => {
  it("숫자 · 기호로 바꿔 쓴 영문을 되돌린다", () => {
    expect(toLatinKey("3@5t4r")).toBe("eastar");
  });
});
