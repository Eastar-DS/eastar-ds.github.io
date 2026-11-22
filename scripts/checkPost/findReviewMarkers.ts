// 〔이스타 확인〕 표시를 찾는 순수 함수입니다. 게시 전 점검과 게시 막기 훅(.claude/hooks/blockUnreviewedPost.ts)이 함께 씁니다.
import { REVIEW_MARKER } from "./constants.ts";

export interface ReviewMarker {
  line: number;
  text: string;
}

interface FindReviewMarkersParams {
  source: string;
  /** 앞머리를 빼고 볼 때 본문 첫 줄 번호. 기본은 1(파일 전체) */
  fromLine?: number;
}

/** 글에서 〔이스타 확인: …〕 표시를 줄마다 찾습니다 */
const findReviewMarkers = ({ source, fromLine = 1 }: FindReviewMarkersParams) =>
  source.split(/\r?\n/).flatMap((line, index) =>
    index + 1 < fromLine ? [] : [...line.matchAll(REVIEW_MARKER)].map((match) => ({ line: index + 1, text: match[0] })),
  );

export default findReviewMarkers;
