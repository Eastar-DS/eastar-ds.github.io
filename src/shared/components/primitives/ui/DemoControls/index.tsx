import DemoSlider from "@/shared/components/primitives/ui/DemoSlider";

import ControlIcon from "./ui/ControlIcon";
import styles from "./index.module.css";

interface DemoControlsProps {
  isPlaying: boolean;
  onPlayToggle: () => void;
  onReset: () => void;
  /** 슬라이더 값 (0~100) */
  value: number;
  onValueChange: (value: number) => void;
  /** 슬라이더가 무엇을 바꾸는지. 스크린 리더가 읽습니다 */
  sliderLabel: string;
  /** 슬라이더 값을 말로 풀어 쓴 것. 예: `진행 40%` */
  sliderValueText?: string;
  /** 오른쪽 끝의 상태 글. 예: `멈춤 · width 40%`. 좁은 칸에서는 숨깁니다 */
  status?: string;
}

/**
 * 데모 아래의 조작 줄입니다. 재생/멈춤 · 처음으로 단추와 슬라이더, 상태 글을 한 줄에 둡니다.
 * 단추는 「아이콘 단추」 모양을 따릅니다. React 섬 안이라 Astro의 IconButton 대신 같은 토큰으로 그립니다. 슬라이더는 `DemoSlider`가 그립니다.
 * @design design/blog.pen 「데모 틀」 M3NVPX 조작 줄, 「슬라이더」 taHDx (기본 p5EjtZ · 포커스 ZWMAF), 「아이콘 단추」 Bh8HQ
 */
export default function DemoControls({
  isPlaying,
  onPlayToggle,
  onReset,
  value,
  onValueChange,
  sliderLabel,
  sliderValueText,
  status,
}: DemoControlsProps) {
  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.iconButton}
        onClick={onPlayToggle}
        aria-label={isPlaying ? "멈춤" : "재생"}
      >
        <ControlIcon name={isPlaying ? "pause" : "play"} />
      </button>
      <button
        type="button"
        className={styles.iconButton}
        onClick={onReset}
        aria-label="처음으로"
      >
        <ControlIcon name="reset" />
      </button>
      <span className={styles.sliderWrapper}>
        <DemoSlider
          value={value}
          onValueChange={onValueChange}
          label={sliderLabel}
          valueText={sliderValueText}
        />
      </span>
      {status && <span className={styles.status}>{status}</span>}
    </div>
  );
}
