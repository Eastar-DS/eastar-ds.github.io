import findPostsBySlugs from "@/shared/content/findPostsBySlugs";
import getPosts from "@/shared/content/getPosts";

/** 글 이름 목록에 맞는 글을 적은 순서대로 가져옵니다. 없는 글 이름이 있으면 빌드를 멈춥니다 */
const getPostsBySlugs = async (slugs: readonly string[]) =>
  findPostsBySlugs({ posts: await getPosts(), slugs });

export default getPostsBySlugs;
