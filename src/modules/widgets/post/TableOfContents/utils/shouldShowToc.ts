import type { TocItem } from "@/modules/widgets/post/TableOfContents/types/toc";

// h2가 이보다 적은 짧은 글은 목차 없이도 한눈에 보이므로 목차를 두지 않습니다 (docs/design-system.md 7.10)
const MIN_SECTION_COUNT = 3;

/** 목차를 둘 만큼 긴 글인지 판단합니다 */
const shouldShowToc = (items: TocItem[]) =>
  items.filter((item) => item.depth === 2).length >= MIN_SECTION_COUNT;

export default shouldShowToc;
