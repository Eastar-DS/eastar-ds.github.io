import type { ChangeEvent } from "react";

import ControlIcon from "./ui/ControlIcon";
import styles from "./index.module.css";

interface DemoControlsProps {
  isPlaying: boolean;
  onPlayToggle: () => void;
  onReset: () => void;
  /** 슬라이더 값 (0~100) */
  value: number;
  onValueChange: (value: number) => void;
  /** 슬라이더의 이름. 스크린 리더가 읽습니다 */
  sliderLabel: string;
  /** 슬라이더 값을 말로 풀어 쓴 것. 예: `진행 40%` */
  sliderValueText?: string;
  /** 오른쪽 끝에 보이는 짧은 설명 */
  label?: string;
}

/** 데모 아래의 조작 줄입니다. 재생 · 처음으로 버튼과 슬라이더, 짧은 설명을 한 줄에 둡니다 */
export default function DemoControls({
  isPlaying,
  onPlayToggle,
  onReset,
  value,
  onValueChange,
  sliderLabel,
  sliderValueText,
  label,
}: DemoControlsProps) {
  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(Number(event.target.value));
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.iconButton}
        onClick={onPlayToggle}
        aria-label={isPlaying ? "일시 정지" : "재생"}
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
      <span className={styles.sliderContainer}>
        {/* 채운 막대는 손잡이 가운데까지 오도록 손잡이 폭(14px)의 절반씩 안쪽에서 셉니다 */}
        <span className={styles.track} aria-hidden="true">
          <span
            className={styles.fill}
            style={{ width: `calc(7px + (100% - 14px) * ${value / 100})` }}
          />
        </span>
        <input
          type="range"
          className={styles.slider}
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={handleSliderChange}
          aria-label={sliderLabel}
          aria-valuetext={sliderValueText}
        />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
