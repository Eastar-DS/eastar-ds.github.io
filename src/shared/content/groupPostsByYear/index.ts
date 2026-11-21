import formatDate from "@/shared/utils/formatDate";
import type { Post, PostYearGroup } from "@/shared/types/post";

/** 글을 발행 연도별로 묶습니다. 넘긴 순서(최신 글이 먼저)를 그대로 지킵니다 */
const groupPostsByYear = (posts: Post[]) =>
  posts.reduce<PostYearGroup[]>((groups, post) => {
    const year = formatDate({ date: post.publishedAt, format: "year" });
    const lastGroup = groups.at(-1);

    if (lastGroup?.year === year) {
      lastGroup.posts.push(post);
    } else {
      groups.push({ year, posts: [post] });
    }

    return groups;
  }, []);

export default groupPostsByYear;
