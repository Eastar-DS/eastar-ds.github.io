import { OVERSCAN_PX } from "@/modules/features/demo/VirtualListDemo/constants/virtualList";
import DemoSlider from "@/shared/components/primitives/ui/DemoSlider";

import styles from "./ListControls.module.css";

interface ListControlsProps {
  isVirtualized: boolean;
  onVirtualizedToggle: () => void;
  overscanPx: number;
  onOverscanChange: (value: number) => void;
  /** 슬라이더 값을 말로 풀어 쓴 것. 예: `80px, 위아래 2행씩` */
  overscanText: string;
  /** 오른쪽 끝의 상태 글. 좁은 칸에서는 숨기고, 스크린 리더에는 바뀔 때마다 읽어 줍니다 */
  status: string;
}

/**
 * 가상화 목록 데모의 조작 줄입니다. 가상화 켜고 끄기 단추와 미리 그릴 거리 슬라이더, 상태 글을 한 줄에 둡니다.
 * 켜고 끄기 단추는 「칩」의 고름 모양(체크 아이콘 · 강조색 바탕)으로 지금 상태를 알리고, `aria-pressed`로 스크린 리더에도 알립니다.
 * 가상화를 끄면 미리 그릴 거리가 뜻이 없어서 슬라이더를 끕니다.
 * @design design/blog.pen 「데모 틀」 M3NVPX 조작 줄, 「칩」 prFrh (고름 iJMPy), 「슬라이더」 taHDx
 */
export default function ListControls({
  isVirtualized,
  onVirtualizedToggle,
  overscanPx,
  onOverscanChange,
  overscanText,
  status,
}: ListControlsProps) {
  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={isVirtualized}
        onClick={onVirtualizedToggle}
      >
        {isVirtualized && (
          <svg
            className={styles.check}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
        가상화
      </button>
      <span className={styles.sliderLabel} aria-hidden="true">
        미리 그릴 거리
      </span>
      <DemoSlider
        value={overscanPx}
        min={OVERSCAN_PX.min}
        max={OVERSCAN_PX.max}
        step={OVERSCAN_PX.step}
        onValueChange={onOverscanChange}
        label="미리 그릴 거리"
        valueText={overscanText}
        isDisabled={!isVirtualized}
      />
      <span className={styles.status} aria-hidden="true">
        {status}
      </span>
      <span className="visually-hidden" aria-live="polite">
        {status}
      </span>
    </div>
  );
}
