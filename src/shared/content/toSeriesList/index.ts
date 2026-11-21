import type { Post, SeriesSummary } from "@/shared/types/post";

/** 글 목록에서 시리즈를 모읍니다. 최근에 글이 올라온 시리즈가 먼저 옵니다 */
const toSeriesList = (posts: Post[]) => {
  const seriesMap = new Map<string, { count: number; firstPost: Post }>();

  posts.forEach((post) => {
    if (!post.series) return;

    const current = seriesMap.get(post.series.name);
    const isEarlierPart =
      !current || post.series.order < (current.firstPost.series?.order ?? 0);

    seriesMap.set(post.series.name, {
      count: (current?.count ?? 0) + 1,
      firstPost: isEarlierPart ? post : current.firstPost,
    });
  });

  return [...seriesMap].map(([name, { count, firstPost }]) => {
    const summary: SeriesSummary = {
      name,
      count,
      firstPostSlug: firstPost.slug,
    };

    return summary;
  });
};

export default toSeriesList;
