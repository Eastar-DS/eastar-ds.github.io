/** 카드의 행 수. Knot 「주제별」 목록에서 가장 큰 폴더의 문서 수와 같습니다 */
export const ROW_COUNT = 994;

/** 요약 없는 행 하나의 높이(px)와 두 번째 행부터 더하는 구분선 두께(px) */
export const ROW_HEIGHT_PX = 64;
export const ROW_DIVIDER_PX = 1;

/** 휠을 돌리기 전 화면 위쪽 끝이 카드 맨 위에서 몇 px 아래에 있는지 */
export const VIEW_START_PX = 3000;

/** 스크롤 영역(`main`)의 보이는 높이(px). 측정한 창(1200×818)에서 잰 값입니다 */
export const VIEW_HEIGHT_PX = 750;

/** 미리 그릴 거리 슬라이더. 실제 빌드에서 잰 값(0 · 160 · 325 · 650px)을 모두 고를 수 있게 5px 단위로 둡니다 */
export const OVERSCAN_PX = {
  min: 0,
  max: 650,
  step: 5,
  initial: 160,
} as const;

/** 휠 한 번에 스크롤하는 거리 슬라이더(px). 실제 빌드에서는 150px와 300px로 쟀습니다 */
export const WHEEL_PX = {
  min: 50,
  max: 500,
  step: 10,
  initial: 300,
} as const;

/**
 * 그림에 담을 카드 구간(px). 넓힌 구간이 650px일 때 위쪽은 잘리지만, 휠 뒤 화면과 그린 행의 끝은 언제나 들어갑니다.
 * 그림 높이는 `ui/FramePanel.module.css`의 `.chart` 높이(280px)와 같아야 합니다.
 */
export const PANEL = {
  start: 2500,
  end: 4500,
  heightPx: 280,
  ticks: [3000, 3500, 4000],
} as const;
