import type { CSSProperties } from "react";

import styles from "./PreviewBox.module.css";

interface PreviewBoxProps {
  /** 상자에 넣을 스타일. 고른 속성 하나만 담깁니다 */
  boxStyle: CSSProperties;
}

/** 고른 속성이 실제로 바뀌는 미리보기 상자입니다. 꾸밈용이라 스크린 리더는 읽지 않습니다 */
export default function PreviewBox({ boxStyle }: PreviewBoxProps) {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.box} style={boxStyle} />
    </div>
  );
}
