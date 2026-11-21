/** 사이트 전체에서 쓰는 기본 정보 */
export const SITE = {
  title: "이스타의 개발 노트",
  description:
    "프론트엔드 개발자 이스타가 공부하며 만든 것과 배운 것을 적습니다. 브라우저, React, 접근성을 주로 다루고, 글마다 직접 움직여 볼 수 있는 예시를 넣습니다.",
  url: "https://eastar-ds.github.io",
  locale: "ko_KR",
  language: "ko",
  author: {
    name: "이스타",
    githubUrl: "https://github.com/eastar-DS",
  },
  /**
   * 검색 등록용 소유 확인 메타 태그 값. 이스타가 Google Search Console · 네이버 서치어드바이저에 등록할 때 받은 값을 넣습니다.
   * 비어 있으면 Document가 메타 태그를 그리지 않습니다.
   */
  verification: {
    /** Google Search Console의 HTML 태그 방식: <meta name="google-site-verification" content="여기"> */
    google: "",
    /** 네이버 서치어드바이저의 HTML 태그 방식: <meta name="naver-site-verification" content="여기"> */
    naver: "",
  },
} as const;
