/** 사용자가 고른 화면 테마를 저장하는 localStorage 키. 고르지 않았으면 값이 없고, 시스템 설정을 따릅니다 */
export const THEME_STORAGE_KEY = "theme";

export const THEMES = ["light", "dark"] as const;
