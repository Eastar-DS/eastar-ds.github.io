import type { HeadingTop } from "@/modules/widgets/post/TableOfContents/types/toc";

interface FindActiveHeadingIdParams {
  /** 글 순서대로 놓인 제목들의 위치 */
  headingTops: HeadingTop[];
  /** 화면 맨 위에서 이 거리(px)를 지난 제목을 읽는 중으로 봅니다 */
  offset: number;
  /** 글 끝까지 내렸는지. 마지막 구획이 짧아 제목이 기준선에 닿지 못해도 마지막 제목을 고릅니다 */
  isAtBottom: boolean;
}

/** 지금 읽는 구획의 제목 id를 고릅니다. 첫 제목에 닿기 전이면 undefined입니다 */
const findActiveHeadingId = ({
  headingTops,
  offset,
  isAtBottom,
}: FindActiveHeadingIdParams) => {
  if (isAtBottom) return headingTops.at(-1)?.id;

  return headingTops.findLast((heading) => heading.top <= offset)?.id;
};

export default findActiveHeadingId;
