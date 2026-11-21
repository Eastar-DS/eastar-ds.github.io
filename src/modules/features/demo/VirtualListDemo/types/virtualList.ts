/** 행 번호의 구간. `start`는 들어가고 `end`는 들어가지 않습니다(`rows.slice(start, end)`와 같음) */
export interface RowRange {
  start: number;
  end: number;
}

/** 화면에 보이는 행과, DOM에 그린 행의 구간 */
export interface ListRanges {
  visible: RowRange;
  drawn: RowRange;
}

/**
 * 행 하나가 지금 어떤 상태인지
 * - `visible`: 스크롤 칸에 보이는 행
 * - `overscan`: 화면 밖이지만 미리 그릴 거리 안이라 미리 그린 행
 * - `offscreen`: 가상화를 껐을 때 화면 밖인데도 그린 행
 * - `notDrawn`: 그리지 않고 높이만 비워 둔 행
 */
export type RowKind = "visible" | "overscan" | "offscreen" | "notDrawn";

/** 구조 보기에 그릴 행 하나. `top`은 구조 보기 맨 위에서의 위치(px)입니다 */
export interface StructureRow {
  index: number;
  kind: RowKind;
  top: number;
}

/** 숫자 칸에 보일 행 수. `above` · `below`는 보이는 행 위아래에서 그린 행입니다 */
export interface RowCounts {
  drawn: number;
  visible: number;
  above: number;
  below: number;
  notDrawn: number;
}
