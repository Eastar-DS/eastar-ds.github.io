import styles from "./NoScriptNotice.module.css";

/**
 * JavaScript가 꺼져 있을 때 조작 줄 자리에 보이는 안내입니다.
 * `<html class="no-js">`일 때만 보이며, 클래스는 Document의 인라인 스크립트가 지웁니다.
 */
export default function NoScriptNotice() {
  return (
    <p className={styles.root}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      JavaScript가 꺼져 있어 멈춘 그림으로 보여 줍니다.
    </p>
  );
}
