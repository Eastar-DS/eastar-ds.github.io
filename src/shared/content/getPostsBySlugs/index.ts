import findPostsBySlugs from "@/shared/content/findPostsBySlugs";
import getPosts from "@/shared/content/getPosts";
import isPostVisible from "@/shared/content/isPostVisible";

/**
 * 글 이름 목록에 맞는 글을 적은 순서대로 가져옵니다. 없는 글 이름이 있으면 빌드를 멈춥니다.
 * 초안인 글은 있는 글로 보고 오류를 내지 않되, 배포 빌드에서는 링크를 그리지 않게 뺍니다.
 */
const getPostsBySlugs = async (slugs: readonly string[]) =>
  findPostsBySlugs({ posts: await getPosts({ includeDrafts: true }), slugs }).filter(
    (post) => isPostVisible({ post }),
  );

export default getPostsBySlugs;
