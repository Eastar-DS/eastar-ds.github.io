import { SERIES_DESCRIPTIONS } from "@/shared/constants/series";
import type { Post, SeriesSummary } from "@/shared/types/post";

/** 글 목록에서 시리즈를 모읍니다. 최근에 글이 올라온 시리즈가 먼저 옵니다 */
const toSeriesList = (posts: Post[]) => {
  const seriesMap = new Map<string, { count: number; firstPost: Post }>();

  posts.forEach((post) => {
    if (!post.series) return;

    const current = seriesMap.get(post.series.id);
    const isEarlierPart =
      !current || post.series.order < (current.firstPost.series?.order ?? 0);

    seriesMap.set(post.series.id, {
      count: (current?.count ?? 0) + 1,
      firstPost: isEarlierPart ? post : current.firstPost,
    });
  });

  return [...seriesMap].map(([id, { count, firstPost }]) => {
    const summary: SeriesSummary = {
      id,
      name: firstPost.series?.name ?? "",
      description: SERIES_DESCRIPTIONS[id] ?? firstPost.description,
      count,
      firstPostSlug: firstPost.slug,
    };

    return summary;
  });
};

export default toSeriesList;
