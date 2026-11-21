import type { APIContext, GetStaticPaths, InferGetStaticPropsType } from "astro";

import { OG_IMAGE } from "@/shared/constants/ogImage";
import getPosts from "@/shared/content/getPosts";
import readPostOgImage from "@/shared/content/readPostOgImage";
import createOgImage from "@/shared/seo/createOgImage";

/**
 * 글의 공유 미리보기 그림(/posts/{slug}/og.png). 글 화면의 og:image가 가리킵니다.
 * 글 폴더에 직접 만든 og.png가 있으면 그것을, 없으면 분류와 제목으로 그린 그림을 냅니다.
 */
export const getStaticPaths = (async () => {
  const posts = await getPosts();

  return posts.map((post) => ({ params: { slug: post.slug }, props: { post } }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET = async ({ props }: APIContext<Props>) => {
  const { post } = props;
  const png =
    (await readPostOgImage({ slug: post.slug })) ??
    (await createOgImage({ label: post.category, title: post.title }));

  return new Response(png, { headers: { "Content-Type": OG_IMAGE.type } });
};
