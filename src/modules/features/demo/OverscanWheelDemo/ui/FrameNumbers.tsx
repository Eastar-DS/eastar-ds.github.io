import type { WheelFrame } from "@/modules/features/demo/OverscanWheelDemo/types/overscanWheel";

import styles from "./FrameNumbers.module.css";

interface FrameNumbersProps {
  frame: WheelFrame;
}

const formatPx = (value: number) => `${value.toLocaleString("ko-KR")}px`;

/**
 * 그림 아래의 숫자 칸입니다. 휠을 돌리기 전에 구한 범위, 그린 행이 덮는 구간, 화면 아래로 그려 둔 거리, 빈 칸의 높이를 글로 알립니다.
 * 빈 칸이 있으면 값 앞에 ■ 표시와 「나쁨」 색을, 없으면 「좋음」 색을 써서 색만으로 나누지 않습니다.
 */
export default function FrameNumbers({ frame }: FrameNumbersProps) {
  const { range, drawn, coveredBelowPx, nextView, blank } = frame;
  const blankPx = blank ? blank.end - blank.start : 0;

  return (
    <dl className={styles.container}>
      <div className={styles.item}>
        <dt className={styles.name}>휠을 돌리기 전 범위</dt>
        <dd className={styles.value}>
          {`{ start: ${range.start}, end: ${range.end} }`}
          <span className={styles.detail}> li {range.end - range.start}개</span>
        </dd>
      </div>
      <div className={styles.item}>
        <dt className={styles.name}>그린 행</dt>
        <dd className={styles.value}>
          {formatPx(drawn.start)}~{formatPx(drawn.end)}
        </dd>
      </div>
      <div className={styles.item}>
        <dt className={styles.name}>화면 아래로 그려 둔 거리</dt>
        <dd className={styles.value}>{formatPx(coveredBelowPx)}</dd>
      </div>
      <div className={styles.item}>
        <dt className={styles.name}>휠 뒤 화면</dt>
        <dd className={styles.value}>
          {formatPx(nextView.start)}~{formatPx(nextView.end)}
        </dd>
      </div>
      <div className={styles.item}>
        <dt className={styles.name}>빈 칸</dt>
        <dd className={`${styles.value} ${blank ? styles.isBad : styles.isGood}`}>
          {blank ? `■ ${formatPx(blankPx)}` : "없음"}
        </dd>
      </div>
    </dl>
  );
}
