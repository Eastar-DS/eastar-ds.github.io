import DemoFrame from "@/shared/components/primitives/ui/DemoFrame";

import { VIEW_START_PX } from "./constants/overscanWheel";
import useOverscanWheel from "./model/useOverscanWheel";
import FrameNumbers from "./ui/FrameNumbers";
import FramePanel from "./ui/FramePanel";
import WheelControls from "./ui/WheelControls";
import styles from "./index.module.css";

const formatPx = (value: number) => value.toLocaleString("ko-KR");

/**
 * 휠을 한 번 돌렸을 때, 메인 스레드가 범위를 다시 구하기 전에 합성기가 먼저 내보낸 프레임을 보여 주는 데모입니다.
 * 요약 없는 행 994개짜리 카드에서 화면 위쪽 끝이 카드 맨 위에서 3,000px 아래에 있고, 스크롤 영역은 750px입니다.
 * 왼쪽 칸은 휠을 돌리기 전에 그려 둔 행이고, 오른쪽 칸은 DOM은 그대로인 채 화면만 휠 거리만큼 내려간 프레임입니다.
 * 휠 한 번의 거리가 화면 아래로 그려 둔 거리보다 길면 그 차이만큼 빈 칸이 보입니다.
 * 글에서는 `<OverscanWheelDemo client:visible />`로 씁니다. 서버에서 그린 첫 화면(160px, 휠 300px)이 JavaScript가 없을 때의 정지 화면 몫을 합니다.
 * 「넓힌 구간」은 데이터 색 1(주황 점선), 빈 칸은 「나쁨」 색이고, 그림 안 이름표로도 나눕니다.
 * @design design/blog.pen 「데모 틀」 M3NVPX
 */
export default function OverscanWheelDemo() {
  const { overscanPx, wheelPx, offsets, frame, changeOverscan, changeWheel } =
    useOverscanWheel();
  const { range, view, widened, nextView, blank } = frame;
  const rows = Array.from({ length: range.end - range.start }, (_, k) => ({
    start: offsets[range.start + k],
    end: offsets[range.start + k + 1],
  }));
  const blankText = blank ? `빈 칸 ${blank.end - blank.start}px` : "빈 칸 없음";

  return (
    <DemoFrame
      caption="휠 한 번이 화면 아래로 그려 둔 거리보다 길면, 메인 스레드가 행을 더 그리기 전에 합성기가 내보낸 프레임에 그 차이만큼 빈 칸이 보입니다. overscan 160px는 휠 300px에서 86px가 비고, 325px는 비지 않습니다."
      controls={
        <WheelControls
          overscanPx={overscanPx}
          onOverscanChange={changeOverscan}
          wheelPx={wheelPx}
          onWheelChange={changeWheel}
          status={`overscan ${overscanPx}px, 휠 ${wheelPx}px, ${blankText}`}
        />
      }
    >
      <div className={styles.container}>
        <div className={styles.panels}>
          <FramePanel
            title="휠을 돌리기 전"
            detail={`화면 ${formatPx(view.start)}–${formatPx(view.end)}px`}
            rows={rows}
            view={view}
            widened={widened}
          />
          <FramePanel
            title="합성기가 먼저 내보낸 프레임"
            detail={`화면 ${formatPx(nextView.start)}–${formatPx(nextView.end)}px, DOM은 그대로`}
            rows={rows}
            view={nextView}
            blank={blank}
          />
        </div>
        <p className={styles.note}>
          요약 없는 행 994개짜리 카드, 스크롤 영역 750px, 휠을 돌리기 전 화면 위쪽 끝{" "}
          {formatPx(VIEW_START_PX)}px. 눈금은 카드 맨 위를 0으로 둔 px입니다.
        </p>
        <FrameNumbers frame={frame} />
      </div>
    </DemoFrame>
  );
}
