import {
  OVERSCAN_PX,
  WHEEL_PX,
} from "@/modules/features/demo/OverscanWheelDemo/constants/overscanWheel";
import DemoSlider from "@/shared/components/primitives/ui/DemoSlider";

import styles from "./WheelControls.module.css";

interface WheelControlsProps {
  overscanPx: number;
  onOverscanChange: (value: number) => void;
  wheelPx: number;
  onWheelChange: (value: number) => void;
  /** 스크린 리더에 바뀔 때마다 읽어 줄 상태 글. 화면에서는 위의 숫자 칸이 같은 내용을 보입니다 */
  status: string;
}

/**
 * 데모의 조작 줄입니다. overscan 슬라이더와 휠 한 번의 거리 슬라이더를 한 줄에 하나씩 쌓고, 값을 옆에 글로 보입니다.
 * @design design/blog.pen 「데모 틀」 M3NVPX 조작 줄, 「슬라이더」 taHDx
 */
export default function WheelControls({
  overscanPx,
  onOverscanChange,
  wheelPx,
  onWheelChange,
  status,
}: WheelControlsProps) {
  return (
    <div className={styles.container}>
      <div className={styles.group}>
        <span className={styles.label} aria-hidden="true">
          overscan
        </span>
        <DemoSlider
          value={overscanPx}
          min={OVERSCAN_PX.min}
          max={OVERSCAN_PX.max}
          step={OVERSCAN_PX.step}
          onValueChange={onOverscanChange}
          label="overscan"
          valueText={`${overscanPx}px`}
        />
        <span className={styles.value} aria-hidden="true">
          {overscanPx}px
        </span>
      </div>
      <div className={styles.group}>
        <span className={styles.label} aria-hidden="true">
          휠 한 번
        </span>
        <DemoSlider
          value={wheelPx}
          min={WHEEL_PX.min}
          max={WHEEL_PX.max}
          step={WHEEL_PX.step}
          onValueChange={onWheelChange}
          label="휠 한 번에 스크롤하는 거리"
          valueText={`${wheelPx}px`}
        />
        <span className={styles.value} aria-hidden="true">
          {wheelPx}px
        </span>
      </div>
      <span className="visually-hidden" aria-live="polite">
        {status}
      </span>
    </div>
  );
}
