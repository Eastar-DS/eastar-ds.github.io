import { getCollection, type CollectionEntry } from "astro:content";

import calculateReadingMinutes from "@/shared/content/calculateReadingMinutes";
import isPostVisible from "@/shared/content/isPostVisible";
import type { Post } from "@/shared/types/post";

const toPost = (entry: CollectionEntry<"posts">) => {
  const post: Post = {
    slug: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    category: entry.data.category,
    publishedAt: entry.data.publishedAt,
    updatedAt: entry.data.updatedAt ?? entry.data.publishedAt,
    readingMinutes: calculateReadingMinutes(entry.body ?? ""),
    series: entry.data.series,
    projects: entry.data.projects,
    draft: entry.data.draft,
  };

  return post;
};

interface GetPostsOptions {
  /** 초안까지 모두 가져올지. 관련 글 이름이 실제로 있는 글인지 검사할 때만 씁니다 */
  includeDrafts?: boolean;
}

/**
 * 글을 최신순으로 가져옵니다. 배포 빌드에서는 초안(`draft: true`)을 뺍니다.
 * 글 목록, 글 페이지, RSS, llms.txt, 공유 그림이 모두 이 함수를 거치므로 초안은 한 곳에서 걸러집니다.
 */
const getPosts = async ({ includeDrafts = false }: GetPostsOptions = {}) => {
  const entries = await getCollection("posts");

  return entries
    .map(toPost)
    .filter((post) => includeDrafts || isPostVisible({ post }))
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
};

export default getPosts;
