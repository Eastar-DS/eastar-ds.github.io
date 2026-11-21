import { PANEL } from "@/modules/features/demo/OverscanWheelDemo/constants/overscanWheel";
import type { Span } from "@/modules/features/demo/OverscanWheelDemo/types/overscanWheel";
import toPanelBox from "@/modules/features/demo/OverscanWheelDemo/utils/toPanelBox";

import styles from "./FramePanel.module.css";

interface FramePanelProps {
  /** 칸 이름. 예: `휠을 돌리기 전` */
  title: string;
  /** 칸 이름 아래의 한 줄. 예: `화면 3,000~3,750px` */
  detail: string;
  /** DOM에 있는 행마다의 구간 */
  rows: Span[];
  view: Span;
  /** 넓힌 구간. 합성기 프레임에서는 범위를 다시 구하지 않았으므로 넘기지 않습니다 */
  widened?: Span;
  /** 행 없이 보이는 구간 */
  blank?: Span | null;
}

const toBox = (span: Span) =>
  toPanelBox({ span, window: PANEL, heightPx: PANEL.heightPx });

const formatPx = (value: number) => value.toLocaleString("ko-KR");

/**
 * 카드의 2,500~4,500px 구간을 줄여 그린 칸 하나입니다. 행(li), 화면, 넓힌 구간, 빈 칸을 위치대로 보입니다.
 * 같은 내용을 아래 숫자 칸이 글로 알려 주므로, 그림은 스크린 리더에 읽히지 않게 둡니다.
 */
export default function FramePanel({
  title,
  detail,
  rows,
  view,
  widened,
  blank,
}: FramePanelProps) {
  const viewBox = toBox(view);
  const widenedBox = widened ? toBox(widened) : null;
  const blankBox = blank ? toBox(blank) : null;

  return (
    <div className={styles.container}>
      <p className={styles.title}>{title}</p>
      <p className={styles.detail}>{detail}</p>
      <div className={styles.chart} aria-hidden="true">
        {PANEL.ticks.map((tick) => {
          const box = toBox({ start: tick, end: tick + 1 });

          return (
            box && (
              <span key={tick} className={styles.tick} style={{ top: box.top }}>
                {formatPx(tick)}
              </span>
            )
          );
        })}
        <div className={styles.plot}>
          <span className={styles.card} />
          {rows.map((row) => {
            const box = toBox(row);

            return (
              box && (
                <span
                  key={row.start}
                  className={styles.row}
                  style={{ top: box.top, height: box.height }}
                />
              )
            );
          })}
          {blankBox && (
            <>
              <span
                className={styles.blank}
                style={{ top: blankBox.top, height: blankBox.height }}
              />
              <span className={styles.blankTag} style={{ top: blankBox.top }}>
                빈 칸
              </span>
            </>
          )}
          {widenedBox && (
            <span
              className={styles.widened}
              style={{ top: widenedBox.top, height: widenedBox.height }}
            >
              <span className={styles.widenedTag}>넓힌 구간</span>
            </span>
          )}
          {viewBox && (
            <span
              className={styles.view}
              style={{ top: viewBox.top, height: viewBox.height }}
            >
              <span className={styles.viewTag}>화면</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
