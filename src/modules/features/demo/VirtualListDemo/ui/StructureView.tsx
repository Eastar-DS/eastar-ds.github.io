import type {
  RowKind,
  StructureRow,
} from "@/modules/features/demo/VirtualListDemo/types/virtualList";

import styles from "./StructureView.module.css";

interface StructureViewProps {
  /** `getStructureRows`가 구한 행. `top`은 이 칸 맨 위에서의 위치(px)입니다 */
  rows: StructureRow[];
  /** 줄여 그린 행 하나의 높이(px) */
  rowHeight: number;
  /** 이 칸 안에서 화면(스크롤 칸)이 시작하는 위치(px) */
  viewTop: number;
  /** 줄여 그린 화면의 높이(px) */
  viewHeight: number;
}

const KIND_CLASS_NAMES: Record<RowKind, string> = {
  visible: styles.visible,
  overscan: styles.overscan,
  offscreen: styles.offscreen,
  notDrawn: styles.notDrawn,
};

/**
 * 스크롤 칸의 위아래까지 목록을 1/3 크기로 줄여, 어느 행이 DOM에 있는지 보여 주는 칸입니다.
 * 가운데 테두리가 화면이고, 막대 색이 행의 상태(보이는 행 · 여유 행 · 화면 밖에 그린 행 · 그리지 않은 행)입니다.
 * 같은 내용을 아래 숫자 칸이 글로 알려 주므로, 스크린 리더에는 읽히지 않게 둡니다.
 */
export default function StructureView({
  rows,
  rowHeight,
  viewTop,
  viewHeight,
}: StructureViewProps) {
  return (
    <div className={styles.root} aria-hidden="true">
      {rows.map(({ index, kind, top }) => (
        <span
          key={index}
          className={`${styles.row} ${KIND_CLASS_NAMES[kind]}`}
          style={{ top, height: rowHeight }}
        />
      ))}
      <span className={styles.view} style={{ top: viewTop, height: viewHeight }} />
    </div>
  );
}
