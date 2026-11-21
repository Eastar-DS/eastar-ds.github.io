import type { Theme } from "@/shared/types/theme";

/** 테마 전환 버튼을 눌렀을 때 바뀔 테마입니다 */
const getNextTheme = (theme: Theme) => {
  const nextTheme: Theme = theme === "dark" ? "light" : "dark";

  return nextTheme;
};

export default getNextTheme;
