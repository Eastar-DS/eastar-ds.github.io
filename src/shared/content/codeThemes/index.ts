import type { ShikiConfig } from "astro";
import darkPlus from "@shikijs/themes/dark-plus";
import lightPlus from "@shikijs/themes/light-plus";

type ShikiTheme = typeof lightPlus;

/**
 * 코드 칸의 바탕과 강조 줄 바탕. tokens.css의 --color-code-bg · --color-code-line-highlight와 같은 값이어야 합니다.
 * 모든 낱말 색은 두 바탕 위에서 4.5:1 이상이어야 합니다 (codeThemes/test.ts가 확인).
 */
export const CODE_BACKGROUNDS = {
  light: { base: "#F6F8FA", lineHighlight: "#F1F5FE" },
  dark: { base: "#1E1E1E", lineHighlight: "#232830" },
} as const;

interface RecolorParams {
  theme: ShikiTheme;
  name: string;
  /** 바꿀 글자색 → 새 글자색 (대소문자 무시) */
  colorMap: Record<string, string>;
  background: string;
}

/** 테마의 글자색 가운데 colorMap에 있는 값만 바꾸고 바탕색을 정합니다. 낱말을 나누는 규칙(scope)은 그대로 둡니다 */
const recolor = ({ theme, name, colorMap, background }: RecolorParams) => {
  const upperMap = Object.fromEntries(
    Object.entries(colorMap).map(([from, to]) => [from.toUpperCase(), to]),
  );
  const recolored: ShikiTheme = {
    ...theme,
    name,
    displayName: name,
    colors: { ...theme.colors, "editor.background": background },
    tokenColors: theme.tokenColors?.map((rule) => {
      const foreground = rule.settings?.foreground?.toUpperCase();

      return foreground && upperMap[foreground]
        ? { ...rule, settings: { ...rule.settings, foreground: upperMap[foreground] } }
        : rule;
    }),
  };

  return recolored;
};

/**
 * 밝은 화면 코드 색. VS Code Light+에서 4.5:1에 모자라는 색만 같은 계열로 고쳤습니다.
 * 정본은 docs/design-system.md 2.3 「코드」입니다.
 */
export const blogLightPlus = recolor({
  theme: lightPlus,
  name: "blog-light-plus",
  colorMap: {
    "#098658": "#097F53", // 숫자
    "#267F99": "#247891", // 타입
    "#E50000": "#E00000", // 속성 이름
    "#D16969": "#C44040", // 정규식 괄호
    "#EE0000": "#DF0000", // 이스케이프 문자
  },
  background: CODE_BACKGROUNDS.light.base,
});

/** 어두운 화면 코드 색. VS Code Dark+에서 4.5:1에 모자라는 색만 같은 계열로 고쳤습니다 */
export const blogDarkPlus = recolor({
  theme: darkPlus,
  name: "blog-dark-plus",
  colorMap: {
    "#6A9955": "#6C9C57", // 주석
    "#808080": "#919191", // 태그 괄호
    "#D16969": "#D57575", // 정규식
    "#646695": "#8C8EB2", // 정규식 상수
    "#F44747": "#F55D5D", // 잘못된 코드
    "#000080": "#8383FF", // header
  },
  background: CODE_BACKGROUNDS.dark.base,
});

/** astro.config.ts의 markdown.shikiConfig.themes에 넣는 두 테마 */
export const CODE_THEMES: NonNullable<ShikiConfig["themes"]> = {
  light: blogLightPlus,
  dark: blogDarkPlus,
};
