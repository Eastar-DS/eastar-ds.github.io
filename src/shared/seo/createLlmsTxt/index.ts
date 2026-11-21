import { SITE } from "@/shared/constants/site";
import { getPostPath, PATHS } from "@/shared/routes/paths";
import type { Post } from "@/shared/types/post";
import formatDate from "@/shared/utils/formatDate";

interface CreateLlmsTxtParams {
  /** 최신순 글 목록 (`getPosts`) */
  posts: Post[];
  /** 이력서 페이지가 있는지 (`shared/constants/features`의 `IS_RESUME_SHOWN`) */
  isResumeShown: boolean;
  /** 포트폴리오 페이지가 있는지 (`shared/constants/features`의 `IS_PORTFOLIO_SHOWN`) */
  isPortfolioShown: boolean;
}

interface LlmsLink {
  name: string;
  path: string;
  note: string;
}

const toUrl = (path: string) => new URL(path, SITE.url).href;

// 링크 글의 [ ] 가 마크다운 링크를 끊지 않게 막습니다
const escapeLinkText = (text: string) => text.replace(/[[\]]/g, "\\$&");

const toListItem = ({ name, path, note }: LlmsLink) => `- [${escapeLinkText(name)}](${toUrl(path)}): ${note}`;

const toPostNote = (post: Post) => {
  const published = formatDate({ date: post.publishedAt, format: "long" });
  const updated = formatDate({ date: post.updatedAt, format: "long" });
  const dates = updated === published ? `${published} 씀` : `${published} 씀, ${updated} 고침`;

  return `${post.description} (분류 ${post.category}, ${dates})`;
};

/**
 * llms.txt(https://llmstxt.org 규격 v2)를 만듭니다. AI 에이전트가 이 사이트에서 읽을 곳을 찾을 때 봅니다.
 * - H1 사이트 이름 → 인용문 사이트 설명 → 읽는 법 문단 → H2마다 링크 목록(`- [이름](주소): 설명`) 순서입니다.
 * - 글은 최신순으로 제목, 주소, 요약, 분류, 쓴 날을 적습니다.
 * - 「글쓴이」 절의 소개 설명에는 이력서 머리와 같은 이름 표기(`SITE.author.displayName`, 「이스타(김동성)」)를 씁니다.
 * - 이력서와 포트폴리오는 페이지가 있을 때만 넣고, RSS와 사이트맵 같은 보조 링크는 규격의 관례대로 「Optional」 절에 둡니다.
 */
const createLlmsTxt = ({ posts, isResumeShown, isPortfolioShown }: CreateLlmsTxtParams) => {
  const authorLinks: LlmsLink[] = [
    {
      name: "소개",
      path: PATHS.about,
      note: `글쓴이 ${SITE.author.displayName}를 소개하고 지금까지 한 일을 적은 페이지입니다.`,
    },
    ...(isPortfolioShown
      ? [
          {
            name: "포트폴리오",
            path: PATHS.portfolio,
            note: "프로젝트마다 찾은 문제, 세운 가설, 한 일, 결과를 차례대로 적은 페이지입니다.",
          },
        ]
      : []),
    ...(isResumeShown
      ? [{ name: "이력서", path: PATHS.resume, note: "경력, 기술, 교육을 적은 이력서입니다." }]
      : []),
  ];
  const optionalLinks: LlmsLink[] = [
    { name: "RSS", path: PATHS.rss, note: "새 글을 받아 보는 피드입니다." },
    { name: "사이트맵", path: PATHS.sitemap, note: "검색 엔진에 알리는 전체 페이지 주소 목록입니다." },
    {
      name: "개인정보 처리 안내",
      path: PATHS.privacy,
      note: "블로그가 모으는 정보와 브라우저에 남기는 값을 알리는 페이지입니다.",
    },
  ];

  return [
    `# ${SITE.title}`,
    "",
    `> ${SITE.description}`,
    "",
    "한국어로 쓰는 기술 블로그이며, 글 목록에는 글마다 요약과 분류, 쓴 날을 적었습니다. 글 페이지는 JavaScript 없이 읽히는 정적 HTML이라 주소를 그대로 받으면 본문 전체를 읽을 수 있습니다.",
    "",
    // An empty heading tells readers nothing, so the section waits for the first published post.
    ...(posts.length > 0
      ? [
          "## 글",
          "",
          ...posts.map((post) => toListItem({ name: post.title, path: getPostPath(post.slug), note: toPostNote(post) })),
          "",
        ]
      : []),
    "## 글쓴이",
    "",
    ...authorLinks.map(toListItem),
    "",
    "## Optional",
    "",
    ...optionalLinks.map(toListItem),
    "",
  ].join("\n");
};

export default createLlmsTxt;
