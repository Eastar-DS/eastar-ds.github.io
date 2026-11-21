import type { ReactNode } from "react";

import NoScriptNotice from "./ui/NoScriptNotice";
import styles from "./index.module.css";

interface DemoFrameProps {
  /** 데모가 움직이는 칸 */
  children: ReactNode;
  /** 칸 아래에 붙는 조작 줄. 보통 `DemoControls`를 넣습니다 */
  controls?: ReactNode;
  /** 데모 아래의 한 줄 설명. 데모가 보여 주는 결론을 데모를 움직이지 않아도 뜻이 통하게 씁니다 */
  caption: string;
}

/**
 * 글 속 데모를 담는 본문 폭의 `<figure>`입니다. 데모 화면, 조작 줄, 한 줄 설명으로 이루어집니다.
 * 데모 화면은 넓은 칸에서 높이를 200px 이상으로 잡아, JavaScript가 늦게 와도 아래 글이 밀리지 않게 합니다.
 * JavaScript가 꺼져 있으면 조작 줄 대신 안내를 보입니다(서버에서 그린 첫 화면이 정지 그림 몫을 합니다).
 * @design design/blog.pen 「데모 틀」 M3NVPX (멈춤 iePqZ · 재생 iBsD0 · JavaScript 없음 SLF8h)
 */
export default function DemoFrame({
  children,
  controls,
  caption,
}: DemoFrameProps) {
  return (
    <figure className={styles.container}>
      <div className={styles.box}>
        <div className={styles.stage}>{children}</div>
        {controls && (
          <div className={styles.footer}>
            <div className={styles.controls}>{controls}</div>
            <NoScriptNotice />
          </div>
        )}
      </div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}
