import type { MarkdownHeading } from "astro";

import type { TocItem } from "@/modules/widgets/post/TableOfContents/types/toc";

const isTocDepth = (depth: number): depth is TocItem["depth"] =>
  depth === 2 || depth === 3;

/** 글의 제목 목록에서 목차에 넣을 h2, h3만 고릅니다 */
const toTocItems = (headings: MarkdownHeading[]) =>
  headings.flatMap((heading) => {
    const { depth } = heading;

    if (!isTocDepth(depth)) return [];

    const item: TocItem = { id: heading.slug, text: heading.text, depth };

    return [item];
  });

export default toTocItems;
