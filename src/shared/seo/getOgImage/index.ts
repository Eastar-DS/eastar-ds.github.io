import { OG_IMAGE } from "@/shared/constants/ogImage";
import { SITE } from "@/shared/constants/site";
import { getOgImagePath } from "@/shared/routes/paths";
import { DEFAULT_PAGE_OG_CARD } from "@/shared/seo/getPageOgCards";
import type { OgImage, PageMeta, PageOgCard } from "@/shared/types/seo";

interface GetOgImageParams {
  /** 페이지 주소. 예: `/posts/글-이름/` */
  path: string;
  /** 페이지 제목(사이트 이름 없이). 글 화면에서는 그림 설명(alt)이 됩니다 */
  title?: string;
  ogType: PageMeta["ogType"];
  /** 자기 그림을 갖는 글 아닌 페이지 (`getPageOgCards`) */
  pageCards: PageOgCard[];
}

/**
 * 페이지의 공유 미리보기 그림을 고릅니다.
 * 글은 글마다 만든 그림(`/posts/글-이름/og.png`), 자기 그림이 있는 페이지는 그 그림, 나머지는 사이트 기본 그림(`/og.png`)입니다.
 */
const getOgImage = ({ path, title, ogType, pageCards }: GetOgImageParams) => {
  const picked =
    ogType === "article" && title
      ? { path, alt: title }
      : (pageCards.find((item) => item.path === path) ?? DEFAULT_PAGE_OG_CARD);
  const image: OgImage = {
    url: new URL(getOgImagePath(picked.path), SITE.url).href,
    alt: picked.alt,
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    type: OG_IMAGE.type,
  };

  return image;
};

export default getOgImage;
