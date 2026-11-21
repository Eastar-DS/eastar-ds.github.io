import type {
  ListRanges,
  RowRange,
} from "@/modules/features/demo/VirtualListDemo/types/virtualList";

interface GetRowRangeParams {
  rowCount: number;
  rowHeight: number;
  /** 구간의 위쪽 끝이 목록 맨 위에서 몇 px 아래에 있는지. 음수일 수 있습니다 */
  rangeStart: number;
  /** 구간의 아래쪽 끝이 목록 맨 위에서 몇 px 아래에 있는지 */
  rangeEnd: number;
}

/**
 * 높이가 모두 같은 행 가운데, 주어진 구간에 조금이라도 걸친 행의 구간을 구합니다.
 * 걸친 행이 없으면 `start`와 `end`가 같습니다.
 */
export const getRowRange = ({
  rowCount,
  rowHeight,
  rangeStart,
  rangeEnd,
}: GetRowRangeParams) => {
  const clamp = (index: number) => Math.min(rowCount, Math.max(0, index));
  const start = clamp(Math.floor(rangeStart / rowHeight));
  const end = clamp(Math.ceil(rangeEnd / rowHeight));
  const range: RowRange = { start, end: Math.max(start, end) };

  return range;
};

interface GetListRangesParams {
  rowCount: number;
  rowHeight: number;
  viewportHeight: number;
  scrollTop: number;
  /** 화면 위아래로 넓혀서 미리 그릴 거리(px) */
  overscanPx: number;
  /** 끄면 행을 모두 그립니다 */
  isVirtualized: boolean;
}

/**
 * 스크롤 칸에 보이는 행과 DOM에 그릴 행의 구간을 구합니다.
 * 가상화를 켜면 화면 위아래를 `overscanPx`만큼 넓힌 구간에 걸친 행만 그리고, 끄면 모든 행을 그립니다.
 */
const getListRanges = ({
  rowCount,
  rowHeight,
  viewportHeight,
  scrollTop,
  overscanPx,
  isVirtualized,
}: GetListRangesParams) => {
  const visible = getRowRange({
    rowCount,
    rowHeight,
    rangeStart: scrollTop,
    rangeEnd: scrollTop + viewportHeight,
  });
  const drawn = isVirtualized
    ? getRowRange({
        rowCount,
        rowHeight,
        rangeStart: scrollTop - overscanPx,
        rangeEnd: scrollTop + viewportHeight + overscanPx,
      })
    : { start: 0, end: rowCount };
  const ranges: ListRanges = { visible, drawn };

  return ranges;
};

export default getListRanges;
