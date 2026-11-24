interface GetDrawnRowRangeParams {
  rowCount: number;
  rowHeightPx: number;
  /** 그리는 범위의 위쪽 끝(화면 위쪽 끝 - overscan). 카드 맨 위에서 잰 px */
  rangeStartPx: number;
  /** 그리는 범위의 아래쪽 끝(화면 아래쪽 끝 + overscan) */
  rangeEndPx: number;
}

/**
 * 그리는 범위에 조금이라도 걸친 행의 구간을 돌려줍니다. `end`는 들어가지 않는 번호입니다.
 * 경계에 딱 닿기만 한 행은 고르지 않고, 범위가 카드 밖으로 나가면 카드 안으로 자릅니다.
 */
const getDrawnRowRange = ({ rowCount, rowHeightPx, rangeStartPx, rangeEndPx }: GetDrawnRowRangeParams) => {
  const start = Math.min(rowCount, Math.max(0, Math.floor(rangeStartPx / rowHeightPx)));
  const end = Math.min(rowCount, Math.max(start, Math.ceil(rangeEndPx / rowHeightPx)));

  return { start, end };
};

export default getDrawnRowRange;
