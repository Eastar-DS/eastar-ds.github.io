import findAdjacentPosts from "@/shared/content/findAdjacentPosts";
import getPosts from "@/shared/content/getPosts";

/** 글 하나의 이전 글과 다음 글을 가져옵니다 */
const getAdjacentPosts = async (slug: string) =>
  findAdjacentPosts({ posts: await getPosts(), slug });

export default getAdjacentPosts;
