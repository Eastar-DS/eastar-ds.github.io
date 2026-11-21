import { getEntry, render } from "astro:content";

/** 글 본문을 그립니다. 본문 컴포넌트(`Content`)와 제목 목록(`headings`)을 돌려줍니다 */
const renderPost = async (slug: string) => {
  const entry = await getEntry("posts", slug);

  if (!entry) {
    throw new Error(`글을 찾을 수 없습니다: ${slug}`);
  }

  return render(entry);
};

export default renderPost;
