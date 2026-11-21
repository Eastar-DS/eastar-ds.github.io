import type { Post } from "@/shared/types/post";

interface FindPostsBySlugsParams {
  /** 모든 글. 순서는 상관없습니다 */
  posts: Post[];
  /** 찾을 글 이름(`src/content/posts/{slug}`의 폴더 이름) */
  slugs: readonly string[];
}

/**
 * 글 이름 목록에 맞는 글을 적은 순서대로 고릅니다. 이력서 줄과 포트폴리오 사례의 「관련 글」이 씁니다.
 * 없는 글 이름이 하나라도 있으면 그 이름을 모두 담아 오류를 냅니다. 빌드가 멈춰서 깨진 링크가 배포되지 않습니다.
 */
const findPostsBySlugs = ({ posts, slugs }: FindPostsBySlugsParams) => {
  const missingSlugs = slugs.filter(
    (slug) => !posts.some((post) => post.slug === slug),
  );

  if (missingSlugs.length > 0) {
    throw new Error(
      `관련 글로 적은 글을 찾을 수 없습니다: ${missingSlugs.join(", ")}`,
    );
  }

  return slugs.flatMap((slug) => posts.filter((post) => post.slug === slug));
};

export default findPostsBySlugs;
