import type { RowRange } from "@/modules/features/demo/OverscanWheelDemo/types/overscanWheel";

interface GetVisibleRangeParams {
  /** 행마다 위쪽 끝의 위치. 행 수보다 하나 길고, 마지막 값이 카드 높이입니다 */
  offsets: number[];
  /** 화면 위쪽 끝이 카드 맨 위에서 몇 px 아래에 있는지 */
  viewStart: number;
  /** 화면 아래쪽 끝이 카드 맨 위에서 몇 px 아래에 있는지 */
  viewEnd: number;
  /** 화면 위아래로 넓혀서 미리 그릴 거리(px) */
  overscanPx: number;
}

/**
 * 화면 위아래를 `overscanPx`만큼 넓힌 구간에 조금이라도 걸친 행의 범위를 구합니다.
 * 글에서 소개한 Knot의 `getVisibleRange`와 같은 계산이라, 끝이 맞닿기만 한 행은 고르지 않습니다.
 */
const getVisibleRange = ({
  offsets,
  viewStart,
  viewEnd,
  overscanPx,
}: GetVisibleRangeParams) => {
  const rangeStart = viewStart - overscanPx;
  const rangeEnd = viewEnd + overscanPx;
  const rowCount = offsets.length - 1;
  let firstInRange = -1;
  let lastInRange = -1;

  for (let index = 0; index < rowCount; index += 1) {
    const isInRange =
      offsets[index + 1] > rangeStart && offsets[index] < rangeEnd;

    if (isInRange) {
      if (firstInRange === -1) firstInRange = index;
      lastInRange = index;
    }
  }

  const range: RowRange =
    firstInRange === -1
      ? { start: 0, end: 0 }
      : { start: firstInRange, end: lastInRange + 1 };

  return range;
};

export default getVisibleRange;
