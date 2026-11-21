import type { ChangeEvent } from "react";

import styles from "./index.module.css";

interface DemoSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
  /** 슬라이더가 무엇을 바꾸는지. 스크린 리더가 읽습니다 */
  label: string;
  /** 값을 말로 풀어 쓴 것. 예: `진행 40%` */
  valueText?: string;
  /** 지금은 바꿀 수 없을 때. 회색으로 보이고 Tab으로 닿지 않습니다 */
  isDisabled?: boolean;
}

/**
 * 데모 조작 줄의 슬라이더입니다. 남은 줄 · 채운 줄 · 손잡이를 그리고, 누르는 영역은 높이 44px로 잡습니다.
 * 남는 폭을 채우므로, 감싸는 줄이 폭을 정합니다.
 * @design design/blog.pen 「슬라이더」 taHDx (기본 p5EjtZ · 포커스 ZWMAF)
 */
export default function DemoSlider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  label,
  valueText,
  isDisabled = false,
}: DemoSliderProps) {
  const ratio = max === min ? 0 : (value - min) / (max - min);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(Number(event.target.value));
  };

  return (
    <span className={styles.container}>
      {/* 채운 줄은 손잡이 가운데까지 오도록 손잡이 폭(16px)의 절반씩 안쪽에서 셉니다 */}
      <span className={styles.track} aria-hidden="true">
        <span
          className={styles.fill}
          style={{ width: `calc(8px + (100% - 16px) * ${ratio})` }}
        />
      </span>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={isDisabled}
        aria-label={label}
        aria-valuetext={valueText}
      />
    </span>
  );
}
