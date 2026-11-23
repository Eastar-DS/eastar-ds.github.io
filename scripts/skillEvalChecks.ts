/** 평가 보고의 실제 근거와 사본 위치를 검사합니다. 특정 설명 문구는 요구하지 않습니다. */
export const recordsNumberConflict = ({ evidence, postText, correctValue, changedLines }: {
  evidence: string;
  postText: string;
  correctValue: string;
  changedLines: readonly number[];
}) => {
  const hasValue = (text: string) => {
    const values: readonly string[] = text.match(/\d+(?:,\d{3})*(?:\.\d+)?/gu) ?? [];
    return values.includes(correctValue);
  };
  if (!hasValue(evidence)) return false;
  const lines = postText.split(/\r?\n/u);
  const references = [...evidence.matchAll(/\b(\d+(?:\s*[·,、]\s*\d+)*)\s*줄/gu)]
    .flatMap((match) => match[1].match(/\d+/gu) ?? []).map(Number);
  return references.some((line) => !changedLines.includes(line) && lines[line - 1] !== undefined && hasValue(lines[line - 1]));
};

/** Lighthouse 검사 이름은 보고 전체를 매기는 점수가 아닙니다. */
export const hasEvaluationScoreOrPublishDecision = (report: string) =>
  /\b\d+ ?\/ ?(?:10|100)\b|점수|게시해도 됩니다|게시 가능|게시 준비 완료/u.test(
    report.replace(/Lighthouse\s*(?:휴대폰\s*)?점수/gu, "Lighthouse 검사"),
  );

/** 확인 표시의 위치는 평가 사본에서 구하고, 같은 보고 줄에 표시와 위치가 있는지 봅니다. */
export const recordsMarkerLocations = (postText: string, rows: readonly string[]) => {
  const markerLines = postText.split(/\r?\n/u).flatMap((line, index) => line.includes("〔이스타 확인") ? [index + 1] : []);
  return markerLines.length > 0 && markerLines.every((line) => rows.some((row) =>
    row.includes("이스타 확인") && new RegExp(`(?<!\\d)${line}(?!\\d)`, "u").test(row),
  ));
};
