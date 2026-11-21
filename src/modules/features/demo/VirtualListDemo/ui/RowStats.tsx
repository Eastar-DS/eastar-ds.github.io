import type {
  RowCounts,
  RowRange,
} from "@/modules/features/demo/VirtualListDemo/types/virtualList";

import styles from "./RowStats.module.css";

interface RowStatsProps {
  /** `getRowCounts`가 센 행 수 */
  counts: RowCounts;
  /** 보이는 행의 구간(0부터 셈). 화면에는 1부터 센 번호로 보입니다 */
  visible: RowRange;
  rowCount: number;
  isVirtualized: boolean;
}

const formatCount = (count: number) => `${count.toLocaleString("ko-KR")}개`;

/**
 * 데모 아래의 숫자 칸입니다. DOM에 있는 행, 보이는 행, 미리 그린 행(가상화를 끄면 화면 밖에 그린 행), 그리지 않은 행을 셉니다.
 * 이름 앞의 표시는 구조 보기의 막대 색과 같고, 모양(● ▲ ■ □)으로도 나눕니다.
 */
export default function RowStats({
  counts,
  visible,
  rowCount,
  isVirtualized,
}: RowStatsProps) {
  const visibleNumbers =
    counts.visible > 0
      ? `${(visible.start + 1).toLocaleString("ko-KR")}~${visible.end.toLocaleString("ko-KR")}번`
      : "";

  return (
    <dl className={styles.container}>
      <div className={styles.item}>
        <dt className={styles.name}>DOM에 있는 행</dt>
        <dd className={styles.value}>
          {formatCount(counts.drawn)}
          <span className={styles.detail}> / {formatCount(rowCount)}</span>
        </dd>
      </div>
      <div className={styles.item}>
        <dt className={styles.name}>
          <span className={`${styles.marker} ${styles.visible}`} />
          보이는 행
        </dt>
        <dd className={styles.value}>
          {formatCount(counts.visible)}
          <span className={styles.detail}> {visibleNumbers}</span>
        </dd>
      </div>
      <div className={styles.item}>
        <dt className={styles.name}>
          {isVirtualized ? (
            <>
              <span className={`${styles.marker} ${styles.overscan}`} />
              미리 그린 행
            </>
          ) : (
            <>
              <span className={`${styles.marker} ${styles.offscreen}`} />
              화면 밖에 그린 행
            </>
          )}
        </dt>
        <dd className={styles.value}>
          위 {formatCount(counts.above)}, 아래 {formatCount(counts.below)}
        </dd>
      </div>
      <div className={styles.item}>
        <dt className={styles.name}>
          <span className={`${styles.marker} ${styles.notDrawn}`} />
          그리지 않은 행
        </dt>
        <dd className={styles.value}>{formatCount(counts.notDrawn)}</dd>
      </div>
    </dl>
  );
}
