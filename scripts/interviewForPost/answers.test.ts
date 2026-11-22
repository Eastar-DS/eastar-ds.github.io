import { describe, expect, it } from "vitest";
import { readAnswerState, receiptText, sha256, splitAnswers } from "./answers.ts";
describe("답 원문 자르기", () => {
  it("줄 머리의 여러 번호 꼴을 읽고 내용의 공백과 CRLF를 지킨다", () => {
    const raw = "머리말\r\n1: 첫 답  \r\n둘째 줄\r\n2. 없음\r\nQ3: 나중에\r\n4번 코드\r\n5) 끝\r\n";
    expect(splitAnswers(raw).map((part) => [part.number, part.text])).toEqual([[null, "머리말"], [1, "첫 답  \r\n둘째 줄"], [2, "없음"], [3, "나중에"], [4, "코드"], [5, "끝"]]);
    for (const part of splitAnswers(raw)) expect(raw.slice(part.start, part.end)).toBe(part.text);
  });
  it("답 안의 코드 번호나 같은 줄의 숫자를 새 답으로 자르지 않는다", () => {
    const parts = splitAnswers("1: 답에 2: 같은 줄\n```text\n3: 코드 줄\n```\n2: 다음 답\n");
    expect(parts.map((part) => part.number)).toEqual([1, 2]);
    expect(parts[0].text).toContain("3: 코드 줄");
  });
  it.each([["없습니다.", "없음"], ["모르겠음", "없음"], ["보류", "나중에"], ["원리를 통해 확인했음", "답함"]])("상태만 정하고 %s를 고치지 않는다", (text, state) => expect(readAnswerState(text)).toBe(state));
  it("같은 내용이어도 다른 질문의 답으로 대조하지 않는다", () => {
    const raw = "1: 같은 답\n2: 같은 답\n";
    const part = splitAnswers(raw)[0];
    expect(() => receiptText({ file: "answers/a.txt", sha256: sha256(raw), ...part, number: 2, receivedAt: "2026-11-22" }, () => raw)).toThrow();
  });
});
