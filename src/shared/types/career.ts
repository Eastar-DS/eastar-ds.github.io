/** 이력서와 포트폴리오가 함께 쓰는 프로젝트 기본 정보 */
export interface CareerProject {
  /** 포트폴리오 페이지 안에서 프로젝트 구획의 id로 씁니다. 예: `knot` */
  id: string;
  name: string;
  /** 무엇을 하는 서비스인지 한 문장 */
  summary: string;
  /** 소속, 기간, 팀처럼 짧은 정보. 화면에는 한 줄로 이어 보입니다 */
  facts: string[];
  /** 서비스 주소. 없으면 그리지 않습니다 */
  url?: string;
  /** 맡은 일. 없으면 그리지 않습니다 */
  role?: string;
}
