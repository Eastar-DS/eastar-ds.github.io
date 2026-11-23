import { describe, expect, it } from "vitest";
import { hasEvaluationScoreOrPublishDecision, recordsMarkerLocations, recordsNumberConflict } from "./skillEvalChecks.ts";

describe("저장된 스킬 평가의 근거 검사", () => {
  it("숫자 불일치를 특정 문구 없이 실제 다른 줄의 값으로 확인함", () => {
    const input = { postText: "가운데값 966ms\n값 996ms\n다른 내용", correctValue: "966", changedLines: [2] };
    expect(recordsNumberConflict({ ...input, evidence: "1줄과 견주면 966ms입니다" })).toBe(true);
    expect(recordsNumberConflict({ ...input, evidence: "글 안의 값은 966ms입니다" })).toBe(false);
    expect(recordsNumberConflict({ ...input, evidence: "3줄은 966ms입니다" })).toBe(false);
    expect(recordsNumberConflict({ ...input, evidence: "2줄을 966ms로 고칩니다" })).toBe(false);
    expect(recordsNumberConflict({ ...input, evidence: "1줄은 1966ms입니다" })).toBe(false);
    expect(recordsNumberConflict({ ...input, postText: "가운데값 1966ms\n값 996ms", evidence: "1줄은 966ms입니다" })).toBe(false);
  });
  it("옮겨진 확인 표시와 여러 표시의 위치를 모두 요구함", () => {
    const post = "첫 줄\n〔이스타 확인: 답〕\n본문\n〔이스타 확인: 답2〕";
    expect(recordsMarkerLocations(post, ["2줄 이스타 확인", "4줄 이스타 확인"])).toBe(true);
    expect(recordsMarkerLocations(post, ["123줄 이스타 확인"])).toBe(false);
    expect(recordsMarkerLocations(post, ["2줄 이스타 확인", "4줄 다른 검사"])).toBe(false);
    expect(recordsMarkerLocations(post, ["12줄 이스타 확인", "4줄 이스타 확인"])).toBe(false);
  });
  it("Lighthouse 검사 이름을 허용하고 평가 점수와 게시 결론은 검출함", () => {
    expect(hasEvaluationScoreOrPublishDecision("Lighthouse 휴대폰 점수(10.6)를 확인합니다")).toBe(false);
    for (const report of ["점수 95점", "9/10", "90 / 100", "게시 가능", "Lighthouse 휴대폰 점수, 보고 점수 90점"]) {
      expect(hasEvaluationScoreOrPublishDecision(report)).toBe(true);
    }
  });
});
