import type { WheelFrame } from "@/modules/features/demo/OverscanWheelDemo/types/overscanWheel";

import getVisibleRange from "./getVisibleRange";

interface GetWheelFrameParams {
  /** 행마다 위쪽 끝의 위치(`getRowOffsets`가 돌려준 값) */
  offsets: number[];
  /** 휠을 돌리기 전 화면 위쪽 끝이 카드 맨 위에서 몇 px 아래에 있는지 */
  viewStart: number;
  /** 스크롤 영역의 보이는 높이(px) */
  viewHeight: number;
  /** 화면 위아래로 넓혀서 미리 그릴 거리(px) */
  overscanPx: number;
  /** 휠 한 번에 스크롤하는 거리(px). 아래로 돌린 경우만 셉니다 */
  wheelPx: number;
}

/**
 * 휠을 한 번 아래로 돌렸을 때, 합성기가 메인 스레드를 기다리지 않고 먼저 내보낸 프레임을 계산합니다.
 * 그 프레임의 DOM은 휠을 돌리기 전에 구한 범위 그대로이고 화면만 `wheelPx`만큼 내려가서,
 * 휠 뒤 화면 아래쪽 끝이 그린 행의 아래쪽 끝보다 아래에 있으면 그 사이가 빈 칸으로 보입니다.
 */
const getWheelFrame = ({
  offsets,
  viewStart,
  viewHeight,
  overscanPx,
  wheelPx,
}: GetWheelFrameParams) => {
  const viewEnd = viewStart + viewHeight;
  const range = getVisibleRange({ offsets, viewStart, viewEnd, overscanPx });
  const drawn = { start: offsets[range.start], end: offsets[range.end] };
  const nextView = { start: viewStart + wheelPx, end: viewEnd + wheelPx };
  const frame: WheelFrame = {
    range,
    drawn,
    widened: { start: viewStart - overscanPx, end: viewEnd + overscanPx },
    view: { start: viewStart, end: viewEnd },
    nextView,
    coveredBelowPx: drawn.end - viewEnd,
    blank:
      nextView.end > drawn.end ? { start: drawn.end, end: nextView.end } : null,
  };

  return frame;
};

export default getWheelFrame;
