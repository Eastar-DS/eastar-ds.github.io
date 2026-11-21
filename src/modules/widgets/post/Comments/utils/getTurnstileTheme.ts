/**
 * Turnstile 위젯의 밝기를 고릅니다. 밝기 단추로 고른 값(`<html data-theme>`)이 있으면 그것을, 없으면 시스템 설정을 따르는 auto입니다.
 */
const getTurnstileTheme = (chosenTheme: string | undefined) =>
  chosenTheme === "light" || chosenTheme === "dark" ? chosenTheme : "auto";

export default getTurnstileTheme;
