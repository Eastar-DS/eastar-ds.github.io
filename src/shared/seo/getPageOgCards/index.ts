import { SITE } from "@/shared/constants/site";
import { PATHS } from "@/shared/routes/paths";
import type { PageOgCard } from "@/shared/types/seo";

/** 첫 화면의 그림. 자기 그림이 없는 페이지(소개, 개인정보 처리 안내, 404)도 이 그림을 씁니다 */
export const DEFAULT_PAGE_OG_CARD: PageOgCard = {
  path: PATHS.home,
  alt: SITE.title,
  card: { title: SITE.title, description: SITE.description },
};

interface GetPageOgCardsParams {
  /** 이력서 페이지가 있는지 (`shared/constants/features`의 `IS_RESUME_SHOWN`) */
  isResumeShown: boolean;
  /** 포트폴리오 페이지가 있는지 (`shared/constants/features`의 `IS_PORTFOLIO_SHOWN`) */
  isPortfolioShown: boolean;
}

/**
 * 글이 아닌 페이지 가운데 자기 공유 미리보기 그림을 갖는 페이지 목록입니다. 첫 번째가 사이트 기본 그림입니다.
 * 이력서와 포트폴리오는 페이지가 있을 때만 넣어서, 없는 페이지의 그림을 만들지 않습니다.
 * 사람 이름은 손으로 적지 않고, 이력서 머리와 같은 표기인 `SITE.author.displayName`(「이스타(김동성)」)에서 읽습니다.
 * 그림 아래의 사이트 이름 줄(「이스타의 개발 노트」)은 `createOgImage`가 따로 그립니다.
 */
const getPageOgCards = ({ isResumeShown, isPortfolioShown }: GetPageOgCardsParams) => {
  const authorName = SITE.author.displayName;
  const cards: PageOgCard[] = [
    DEFAULT_PAGE_OG_CARD,
    ...(isResumeShown
      ? [{ path: PATHS.resume, alt: `${authorName}의 이력서`, card: { label: authorName, title: "이력서" } }]
      : []),
    ...(isPortfolioShown
      ? [{ path: PATHS.portfolio, alt: `${authorName}의 포트폴리오`, card: { label: authorName, title: "포트폴리오" } }]
      : []),
  ];

  return cards;
};

export default getPageOgCards;
