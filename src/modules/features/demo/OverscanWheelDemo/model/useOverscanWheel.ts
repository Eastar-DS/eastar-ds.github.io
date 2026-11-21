import { useMemo, useState } from "react";

import {
  OVERSCAN_PX,
  ROW_COUNT,
  ROW_DIVIDER_PX,
  ROW_HEIGHT_PX,
  VIEW_HEIGHT_PX,
  VIEW_START_PX,
  WHEEL_PX,
} from "@/modules/features/demo/OverscanWheelDemo/constants/overscanWheel";
import getRowOffsets from "@/modules/features/demo/OverscanWheelDemo/utils/getRowOffsets";
import getWheelFrame from "@/modules/features/demo/OverscanWheelDemo/utils/getWheelFrame";

/**
 * 미리 그릴 거리와 휠 한 번의 거리를 다루고, 휠을 돌린 뒤 합성기가 먼저 내보낸 프레임을 구합니다.
 * 행 위치(`offsets`)는 바뀌지 않으므로 한 번만 계산합니다.
 */
const useOverscanWheel = () => {
  const [overscanPx, setOverscanPx] = useState<number>(OVERSCAN_PX.initial);
  const [wheelPx, setWheelPx] = useState<number>(WHEEL_PX.initial);
  const offsets = useMemo(
    () =>
      getRowOffsets({
        rowCount: ROW_COUNT,
        rowHeight: ROW_HEIGHT_PX,
        dividerPx: ROW_DIVIDER_PX,
      }),
    [],
  );
  const frame = getWheelFrame({
    offsets,
    viewStart: VIEW_START_PX,
    viewHeight: VIEW_HEIGHT_PX,
    overscanPx,
    wheelPx,
  });

  return {
    overscanPx,
    wheelPx,
    offsets,
    frame,
    changeOverscan: setOverscanPx,
    changeWheel: setWheelPx,
  };
};

export default useOverscanWheel;
