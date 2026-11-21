import type { Theme } from "@/shared/types/theme";

interface ResolveThemeParams {
  /** 사용자가 고른 테마. 고르지 않았으면 undefined나 null입니다 */
  chosenTheme: string | null | undefined;
  isSystemDark: boolean;
}

/** 지금 보이는 테마를 정합니다. 사용자가 고른 것이 먼저이고, 없으면 시스템 설정을 따릅니다 */
const resolveTheme = ({ chosenTheme, isSystemDark }: ResolveThemeParams) => {
  if (chosenTheme === "light" || chosenTheme === "dark") {
    const theme: Theme = chosenTheme;

    return theme;
  }

  const systemTheme: Theme = isSystemDark ? "dark" : "light";

  return systemTheme;
};

export default resolveTheme;
