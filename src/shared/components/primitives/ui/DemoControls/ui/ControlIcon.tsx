interface ControlIconProps {
  name: "play" | "pause" | "reset";
}

/** 데모 조작 버튼의 아이콘입니다. Lucide(ISC 라이선스)의 모양을 따랐습니다 */
export default function ControlIcon({ name }: ControlIconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {name === "play" && <path d="M6 3 20 12 6 21z" />}
      {name === "pause" && (
        <>
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </>
      )}
      {name === "reset" && (
        <>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </>
      )}
    </svg>
  );
}
