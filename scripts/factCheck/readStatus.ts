// 대조표의 상태를 한 줄로 만드는 순수 함수입니다. prepublish-check가 정본 10.3에 따라 실패와 확인 필요 여부를 판단합니다.
import type { Verdict } from "./verifyReport.ts";
import { parseReport, SECTION_TITLES } from "./verifyReport.ts";

/** 상태 줄에 적는 판정과 그 차례 */
const STATUS_VERDICTS: readonly Verdict[] = ["다름", "일부 맞음", "출처에 없음", "못 엶"];

interface ReadStatusParams {
  /** 작업 폴더의 fact-check.md 글. 없으면 `null` */
  reportText: string | null;
  /** 지금 글의 sha256. 글이 없으면 `null` */
  postSha256: string | null;
}

/**
 * 대조표 상태를 아래 셋 가운데 한 줄로 돌려줍니다. 작업 폴더의 경로는 넣지 않습니다.
 * - `없음`: 대조표가 없거나, 글이 없거나, 대조표 머리에 글의 sha256이 없음
 * - `낡음: 글이 대조 뒤에 바뀜`: 대조표 머리의 sha256과 지금 글이 다름
 * - `최신(대조한 날): 다름 c, 일부 맞음 b, 출처에 없음 d, 못 엶 e`: 건수는 대조표의 줄을 센 값
 */
export const readStatus = ({ reportText, postSha256 }: ReadStatusParams) => {
  if (reportText === null || postSha256 === null) return "없음";

  const report = parseReport(reportText);
  const headerSha = report.header.post?.sha256;

  if (!headerSha) return "없음";
  if (headerSha !== postSha256) return "낡음: 글이 대조 뒤에 바뀜";

  const rows = report.sections[SECTION_TITLES.table]?.table?.rows ?? [];
  const count = (verdict: Verdict) =>
    rows.filter((row) => (row.cells["판정"] ?? "").replace(/\*\*/gu, "").trim() === verdict).length;
  const date = report.header.date?.value.match(/^\d{4}-\d{2}-\d{2}/u)?.[0] ?? "날짜 없음";

  return `최신(${date}): ${STATUS_VERDICTS.map((verdict) => `${verdict} ${count(verdict)}`).join(", ")}`;
};
