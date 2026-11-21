/** 개선 전과 후를 같은 조건에서 잰 값 하나 */
export interface Measurement {
  /** 무엇을 쟀는지 */
  label: string;
  /** 같은 측정의 조건. 예: `세션 녹화 없음` */
  condition?: string;
  before: number;
  after: number;
  unit: "ms" | "개";
}

/** 막대 하나에 그릴 값. `ratio`는 그 항목의 개선 전 값에 견준 길이(0~1)입니다 */
export interface ResultBar {
  text: string;
  ratio: number;
}

/** 차트의 한 항목: 개선 전 막대, 개선 후 막대, 줄어든 정도 */
export interface ResultRow {
  label: string;
  condition?: string;
  before: ResultBar;
  after: ResultBar;
  reduction: string;
}
