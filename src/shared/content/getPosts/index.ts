import { getCollection, type CollectionEntry } from "astro:content";

import calculateReadingMinutes from "@/shared/content/calculateReadingMinutes";
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
  };

  return post;
};

/** 모든 글을 최신순으로 가져옵니다 */
const getPosts = async () => {
  const entries = await getCollection("posts");

  return entries
    .map(toPost)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
};

export default getPosts;
