import { type UIEvent, useMemo } from "react";

import DemoFrame from "@/shared/components/primitives/ui/DemoFrame";

import {
  ROW_COUNT,
  ROW_HEIGHT_PX,
  STRUCTURE_SCALE,
  VIEWPORT_HEIGHT_PX,
} from "./constants/virtualList";
import useVirtualList from "./model/useVirtualList";
import DocumentRows from "./ui/DocumentRows";
import ListControls from "./ui/ListControls";
import RowStats from "./ui/RowStats";
import StructureView from "./ui/StructureView";
import getRowCounts from "./utils/getRowCounts";
import getStructureRows from "./utils/getStructureRows";
import styles from "./index.module.css";

/**
 * 문서 2,000개 목록을 직접 스크롤하며 가상화를 켜고 끄는 데모입니다.
 * 가상화를 켜면 화면 위아래를 overscan만큼 넓힌 구간의 행만 DOM에 그리고, 끄면 2,000행을 모두 그립니다.
 * 오른쪽 구조 보기와 아래 숫자 칸이 DOM에 있는 행, 보이는 행, 미리 그린 행, 그리지 않은 행을 보여 줍니다.
 * 글에서는 `<VirtualListDemo client:visible />`로 씁니다.
 * 서버에서 그린 첫 화면(맨 위, 가상화 켬)이 JavaScript가 없을 때의 정지 화면 몫을 하고, 그때는 스크롤 칸을 움직이지 않습니다.
 * 「보이는 행」은 「고른 것」과 같은 강조색, 「미리 그린 행」은 데이터 색 1(주황)이고, 모양과 이름으로도 나눕니다.
 * @design design/blog.pen 「데모 틀」 M3NVPX
 */
export default function VirtualListDemo() {
  const {
    isVirtualized,
    overscanPx,
    scrollTop,
    isReady,
    ranges,
    toggleVirtualized,
    changeOverscan,
    changeScrollTop,
  } = useVirtualList();
  const counts = getRowCounts({ rowCount: ROW_COUNT, ranges });
  const structure = getStructureRows({
    rowCount: ROW_COUNT,
    rowHeight: ROW_HEIGHT_PX,
    viewportHeight: VIEWPORT_HEIGHT_PX,
    scrollTop,
    scale: STRUCTURE_SCALE,
    ranges,
    isVirtualized,
  });
  const { start, end } = ranges.drawn;
  // 그릴 구간이 그대로면 같은 요소를 돌려줘서, 스크롤할 때마다 목록을 다시 그리지 않습니다
  const documentRows = useMemo(
    () => <DocumentRows start={start} end={end} />,
    [start, end],
  );
  const overscanRows = overscanPx / ROW_HEIGHT_PX;
  const status = isVirtualized
    ? `가상화 켬 · overscan ${overscanPx}px`
    : `가상화 끔 · ${ROW_COUNT.toLocaleString("ko-KR")}행을 모두 그림`;

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    changeScrollTop(event.currentTarget.scrollTop);
  };

  return (
    <DemoFrame
      caption="앞에서 든 숫자 그대로, 행 2,000개에 행 높이 40px, 화면 높이 240px인 목록입니다. 구조 보기는 지금 DOM에 어떤 행이 있는지 보여 주는데요, 스크롤해도 DOM에 있는 행은 열 개 남짓에서 늘지 않아요. 「가상화」 단추를 끄면 2,000개를 모두 그리고, 「overscan」 슬라이더로 위아래에 더 그릴 범위를 바꿀 수 있습니다."
      controls={
        <ListControls
          isVirtualized={isVirtualized}
          onVirtualizedToggle={toggleVirtualized}
          overscanPx={overscanPx}
          onOverscanChange={changeOverscan}
          overscanText={`${overscanPx}px, 위아래 ${overscanRows}행씩`}
          status={status}
        />
      }
    >
      <div className={styles.container}>
        <div className={styles.panes}>
          <div className={styles.pane}>
            <p className={styles.paneLabel}>목록 (스크롤해 보세요)</p>
            <div
              className={`${styles.viewport} ${isReady ? styles.isReady : ""}`}
              role="region"
              aria-label={`문서 ${ROW_COUNT.toLocaleString("ko-KR")}개 목록. 화살표 키로 스크롤합니다`}
              tabIndex={0}
              onScroll={handleScroll}
            >
              {documentRows}
            </div>
          </div>
          <div className={styles.pane}>
            <p className={styles.paneLabel}>구조 (1/3)</p>
            <StructureView {...structure} />
          </div>
        </div>
        <RowStats
          counts={counts}
          visible={ranges.visible}
          rowCount={ROW_COUNT}
          isVirtualized={isVirtualized}
        />
      </div>
    </DemoFrame>
  );
}
