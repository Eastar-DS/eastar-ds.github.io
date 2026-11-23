import type { Post, SeriesPart } from "@/shared/types/post";
import isPostVisible from "@/shared/content/isPostVisible";

interface ToSeriesPartsParams {
  posts: Post[];
  id: string;
  isDev?: boolean;
}

/** 같은 시리즈의 편을 순서대로 고릅니다. 초안은 배포에서 주소를 주지 않아 「준비 중」으로 보입니다. */
const toSeriesParts = ({ posts, id, isDev }: ToSeriesPartsParams) =>
  posts.filter((post) => post.series?.id === id)
    .sort((a, b) => (a.series?.order ?? 0) - (b.series?.order ?? 0))
    .map((post) => {
      const part: SeriesPart = {
        title: post.title,
        order: post.series?.order ?? 0,
        slug: isPostVisible({ post, isDev }) ? post.slug : undefined,
      };

      return part;
    });

export default toSeriesParts;
