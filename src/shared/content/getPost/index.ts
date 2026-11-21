import getPosts from "@/shared/content/getPosts";

/** 글 하나를 가져옵니다. 없는 글이면 빌드를 멈춥니다 */
const getPost = async (slug: string) => {
  const posts = await getPosts();
  const post = posts.find((item) => item.slug === slug);

  if (!post) {
    throw new Error(`글을 찾을 수 없습니다: ${slug}`);
  }

  return post;
};

export default getPost;
