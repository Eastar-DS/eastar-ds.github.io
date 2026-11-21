/** 행 번호의 구간. `start`는 들어가고 `end`는 들어가지 않습니다(`rows.slice(start, end)`와 같음) */
export interface RowRange {
  start: number;
  end: number;
}

/** 카드 맨 위를 0으로 둔 세로 구간(px). `start`가 위쪽 끝, `end`가 아래쪽 끝입니다 */
export interface Span {
  start: number;
  end: number;
}

/**
 * 휠을 한 번 돌렸을 때, 메인 스레드가 범위를 다시 구하기 전에 합성기가 먼저 내보낸 프레임을 계산한 값입니다.
 * - `range`: 휠을 돌리기 전에 구해 둔 범위. 합성기 프레임에서도 DOM에는 이 행들만 있습니다
 * - `drawn`: 그린 행이 덮는 구간
 * - `widened`: 휠을 돌리기 전 화면을 위아래로 넓힌 구간
 * - `view`, `nextView`: 휠을 돌리기 전과 뒤의 화면
 * - `coveredBelowPx`: 휠을 돌리기 전, 화면 아래쪽 끝보다 아래로 그려 둔 거리
 * - `blank`: 휠 뒤 화면에서 행 없이 보이는 구간. 없으면 `null`
 */
export interface WheelFrame {
  range: RowRange;
  drawn: Span;
  widened: Span;
  view: Span;
  nextView: Span;
  coveredBelowPx: number;
  blank: Span | null;
}
