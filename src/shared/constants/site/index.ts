/** 블로그에서 부르는 이름(닉네임) */
const AUTHOR_NAME = "이스타";

/** 본명. 이스타가 2026-11-21에 공개하기로 정했습니다 */
const AUTHOR_REAL_NAME = "김동성";

/** 사이트 전체에서 쓰는 기본 정보 */
export const SITE = {
  title: "이스타의 개발 노트",
  description:
    `도메인에 진심으로 달려드는 프론트엔드 엔지니어 ${AUTHOR_NAME}(${AUTHOR_REAL_NAME})가 공부하며 배운 것과 만든 것을 적습니다.`,
  url: "https://eastar-ds.github.io",
  locale: "ko_KR",
  language: "ko",
  author: {
    /** 블로그에서 부르는 이름. 사이트 이름(「이스타의 개발 노트」)과 꼬리말(「© 2026 이스타」)에 쓰고, Person 구조화 데이터의 alternateName이 됩니다 */
    name: AUTHOR_NAME,
    /** 본명. Person 구조화 데이터의 name이 됩니다 */
    realName: AUTHOR_REAL_NAME,
    /** 소개 첫 문장과 이력서 머리(h1)에 보이는 이름. 닉네임만 두지 않고 본명을 함께 씁니다 */
    displayName: `${AUTHOR_NAME}(${AUTHOR_REAL_NAME})`,
    githubUrl: "https://github.com/eastar-DS",
    /**
     * 연락받을 이메일. 소개와 이력서에 mailto 링크로 보입니다. 비우면 두 페이지가 이메일을 그리지 않습니다.
     * 전화번호는 넣지 않고, 구조화 데이터(Person)에도 이메일을 넣지 않습니다(이스타 결정, 2026-11-21).
     */
    email: "sien0104@gmail.com" as string,
  },
  /**
   * 검색 등록용 소유 확인 메타 태그 값. 이스타가 Google Search Console · 네이버 서치어드바이저에 등록할 때 받은 값을 넣습니다.
   * 비어 있으면 Document가 메타 태그를 그리지 않습니다.
   */
  verification: {
    /** Google Search Console의 HTML 태그 방식: <meta name="google-site-verification" content="여기"> */
    google: "dozu6b55mnzOnfNalOyMYngAv3ErATWIvaa5lMfjcQw",
    /** 네이버 서치어드바이저의 HTML 태그 방식: <meta name="naver-site-verification" content="여기"> */
    naver: "1202f7802ef0ab79f68f2183b48dbf19bfbb8a89",
  },
} as const;
