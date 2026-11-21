import type { ReactNode } from "react";

import styles from "./index.module.css";

interface DemoFrameProps {
  /** 데모가 움직이는 칸 */
  children: ReactNode;
  /** 칸 아래에 붙는 조작 줄. 보통 `DemoControls`를 넣습니다 */
  controls?: ReactNode;
  /** 데모 아래의 한 줄 설명. 데모를 움직이지 않아도 뜻이 통하게 씁니다 */
  caption: string;
}

/** 글 속 데모를 담는 본문 폭의 둥근 틀입니다. 데모 칸, 조작 줄, 한 줄 설명으로 이루어집니다 */
export default function DemoFrame({
  children,
  controls,
  caption,
}: DemoFrameProps) {
  return (
    <figure className={styles.container}>
      <div className={styles.box}>
        <div className={styles.stage}>{children}</div>
        {controls && <div className={styles.controls}>{controls}</div>}
      </div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}
