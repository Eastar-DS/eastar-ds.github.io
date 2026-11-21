/** 사이트 전체에서 쓰는 기본 정보 */
export const SITE = {
  title: "이스타의 개발 노트",
  description:
    "도메인에 진심으로 달려드는 프론트엔드 엔지니어 이스타가 공부하며 배운 것과 만든 것을 적습니다.",
  url: "https://eastar-ds.github.io",
  locale: "ko_KR",
  language: "ko",
  author: {
    /** 공개하는 이름은 「이스타」 하나입니다. 본명은 이스타가 정할 때까지 넣지 않습니다 */
    name: "이스타",
    githubUrl: "https://github.com/eastar-DS",
    /**
     * 연락받을 이메일. 공개할지 이스타가 정할 때까지 비워 둡니다.
     * 비어 있으면 소개 · 이력서 페이지가 이메일 줄을 그리지 않습니다.
     */
    email: "" as string,
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
