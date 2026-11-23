import type { Post } from "@/shared/types/post";

interface FindAdjacentPostsParams {
  /** 모든 글. 순서는 상관없습니다 */
  posts: Post[];
  slug: string;
}

const byPublishedAt = (a: Post, b: Post) =>
  a.publishedAt.getTime() - b.publishedAt.getTime();

/**
 * 글 끝에 이을 이전 글과 다음 글을 고릅니다.
 * 시리즈 글이면 같은 시리즈의 앞뒤 편, 아니면 모든 글의 발행일로 바로 앞(더 오래된) 글과 바로 뒤(더 새로운) 글입니다.
 * 없는 쪽은 undefined입니다.
 */
const findAdjacentPosts = ({ posts, slug }: FindAdjacentPostsParams) => {
  const current = posts.find((post) => post.slug === slug);

  if (!current) return { prev: undefined, next: undefined };

  const seriesId = current.series?.id;
  const orderedPosts = seriesId
    ? posts
        .filter((post) => post.series?.id === seriesId)
        .sort((a, b) => (a.series?.order ?? 0) - (b.series?.order ?? 0))
    : [...posts].sort(byPublishedAt);
  const index = orderedPosts.findIndex((post) => post.slug === slug);

  return {
    prev: index > 0 ? orderedPosts[index - 1] : undefined,
    next: orderedPosts[index + 1],
  };
};

export default findAdjacentPosts;
