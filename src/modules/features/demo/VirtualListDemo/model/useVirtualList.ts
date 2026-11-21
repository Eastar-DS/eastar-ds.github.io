import { useEffect, useState } from "react";

import {
  OVERSCAN_PX,
  ROW_COUNT,
  ROW_HEIGHT_PX,
  VIEWPORT_HEIGHT_PX,
} from "@/modules/features/demo/VirtualListDemo/constants/virtualList";
import getListRanges from "@/modules/features/demo/VirtualListDemo/utils/getListRanges";

/**
 * 가상화 목록 데모의 상태입니다. 가상화를 켰는지, 미리 그릴 거리, 스크롤 위치를 다루고, 보이는 행과 그릴 행의 구간을 구합니다.
 * `isReady`는 JavaScript가 붙은 뒤에 참이 됩니다. 그 전에는 스크롤 칸을 움직이지 않게 해서, 서버에서 그린 첫 화면 밖의 빈 높이가 보이지 않게 합니다.
 */
const useVirtualList = () => {
  const [isVirtualized, setIsVirtualized] = useState(true);
  const [overscanPx, setOverscanPx] = useState<number>(OVERSCAN_PX.initial);
  const [scrollTop, setScrollTop] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const ranges = getListRanges({
    rowCount: ROW_COUNT,
    rowHeight: ROW_HEIGHT_PX,
    viewportHeight: VIEWPORT_HEIGHT_PX,
    scrollTop,
    overscanPx,
    isVirtualized,
  });

  const toggleVirtualized = () => {
    setIsVirtualized((previous) => !previous);
  };

  return {
    isVirtualized,
    overscanPx,
    scrollTop,
    isReady,
    ranges,
    toggleVirtualized,
    changeOverscan: setOverscanPx,
    changeScrollTop: setScrollTop,
  };
};

export default useVirtualList;
