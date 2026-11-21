import type { CareerProject } from "@/shared/types/career";

/**
 * 이력서 · 포트폴리오가 함께 쓰는 프로젝트 기본 정보. 이스타가 쓰는 이력서 초안의 경험 머리 줄과 같게 둡니다.
 * 나열 순서는 이력서와 같은 Knot → 셀러홈 → 비드입니다.
 */
export const CAREER_PROJECTS = {
  knot: {
    id: "knot",
    name: "Knot",
    summary: "회의를 녹음하면 주제별 문서로 정리해 주는 팀 회의 기록 서비스",
    facts: ["우아한테크코스 팀 프로젝트", "2026.08 ~ 현재", "FE 3명과 BE 2명"],
    url: "https://knoted.kr",
    role: "프론트엔드(문서 보기, 문서 목록, 녹음 문서 화면, 홈 카드, 소셜 로그인 등, PR 45개 머지), 사용자 데이터 분석과 가설 검증",
  },
  sellerHome: {
    id: "sellerhome",
    name: "셀러홈",
    summary: "쇼핑몰 발주를 버튼 한 번으로 처리하는 서비스",
    facts: [
      "개인 프로젝트, 운영 중",
      "2026.06 ~ 현재",
      "기획과 개발, 영업을 혼자 맡음",
    ],
    url: "https://sellerhome.co.kr",
  },
  bid: {
    id: "bid",
    name: "비드(BID)",
    summary: "창업한 부동산 경매 정보 서비스",
    facts: [
      "대표",
      "2022.06 ~ 2025.03",
      "소프트웨어 마에스트로에서 시작",
      "3명(이스타, BE 1명, FE 1명)과 법률 자문",
    ],
    role: "기획, 영업, 마케팅, 데이터 분석. 개발자가 개발에 집중할 수 있게 개발 밖의 일을 모두 맡음",
  },
} satisfies Record<string, CareerProject>;

/**
 * 프로젝트 id 목록. 글 앞머리의 `projects` 칸(`src/content.config.ts`)이 이 값만 받아서, 없는 프로젝트를 적으면 빌드가 멈춥니다.
 */
export const CAREER_PROJECT_IDS = Object.values(CAREER_PROJECTS).map(
  (project) => project.id,
);
