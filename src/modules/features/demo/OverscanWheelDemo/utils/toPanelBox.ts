import type { Span } from "@/modules/features/demo/OverscanWheelDemo/types/overscanWheel";

interface ToPanelBoxParams {
  /** 카드 맨 위를 0으로 둔 구간(px) */
  span: Span;
  /** 그림에 담는 카드 구간(px) */
  window: Span;
  /** 그림의 높이(px) */
  heightPx: number;
}

/**
 * 카드 좌표의 구간을 그림 안의 위치(`top`)와 높이(`height`)로 바꿉니다. 그림 밖으로 나간 부분은 잘라 냅니다.
 * 구간이 그림 밖에만 있으면 `null`을 돌려줍니다.
 */
const toPanelBox = ({ span, window, heightPx }: ToPanelBoxParams) => {
  const scale = heightPx / (window.end - window.start);
  // 인라인 스타일에 소수점 끝자리 오차가 붙지 않게 0.01px 단위로 맞춥니다
  const round = (value: number) => Math.round(value * 100) / 100;
  const top = round(Math.max(0, (span.start - window.start) * scale));
  const bottom = round(Math.min(heightPx, (span.end - window.start) * scale));

  return bottom > top ? { top, height: round(bottom - top) } : null;
};

export default toPanelBox;
