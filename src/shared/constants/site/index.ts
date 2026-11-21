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
  /** 이 블로그의 저장소. 댓글(giscus)은 이 저장소의 Discussions에 저장됩니다 */
  repository: {
    url: "https://github.com/eastar-DS/eastar-ds.github.io",
    discussionsUrl: "https://github.com/eastar-DS/eastar-ds.github.io/discussions",
  },
} as const;
