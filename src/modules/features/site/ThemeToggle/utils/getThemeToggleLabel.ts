import type { Theme } from "@/shared/types/theme";

/** 밝기 단추의 이름. 지금 상태가 아니라 누르면 바뀔 상태를 말합니다 */
const getThemeToggleLabel = (currentTheme: Theme) =>
  currentTheme === "dark" ? "밝은 화면으로" : "어두운 화면으로";

export default getThemeToggleLabel;
