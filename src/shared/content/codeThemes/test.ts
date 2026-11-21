import { describe, expect, it } from "vitest";

import getContrastRatio from "@/shared/utils/getContrastRatio";

import { blogDarkPlus, blogLightPlus, CODE_BACKGROUNDS } from ".";

// 글자 대비 기준 (WCAG 2.2 AA)
const MIN_CONTRAST = 4.5;

/** docs/design-system.md 2.3 「낱말 종류별 최종 색」 표 */
const FINAL_COLORS = {
  light: {
    "본문 글자 · 연산자 · 문장 부호": "#000000",
    "키워드 · JSX 중괄호 · 템플릿": "#0000FF",
    제어문: "#AF00DB",
    함수: "#795E26",
    "변수 · 매개변수 · 속성": "#001080",
    "상수 이름": "#0070C1",
    문자열: "#A31515",
    숫자: "#097F53",
    타입: "#247891",
    주석: "#008000",
    "JSX 태그 · 태그 괄호": "#800000",
    "JSX 속성 · CSS 속성 이름": "#E00000",
    "정규식 괄호 · 부정": "#C44040",
    "이스케이프 문자": "#DF0000",
    "정규식 본문": "#811F3F",
    "CSS 값 · JSON 키": "#0451A5",
    "잘못된 코드": "#CD3131",
    "마크다운 굵게 · diff 머리": "#000080",
  },
  dark: {
    "본문 글자 · 연산자 · 문장 부호": "#D4D4D4",
    "키워드 · JSX 태그 · 중괄호": "#569CD6",
    제어문: "#C586C0",
    함수: "#DCDCAA",
    "변수 · 매개변수 · 속성 · JSX 속성": "#9CDCFE",
    "상수 이름": "#4FC1FF",
    문자열: "#CE9178",
    숫자: "#B5CEA8",
    타입: "#4EC9B0",
    주석: "#6C9C57",
    "태그 괄호": "#919191",
    "정규식 본문": "#D57575",
    "정규식 상수": "#8C8EB2",
    "잘못된 코드": "#F55D5D",
    header: "#8383FF",
    "CSS 선택자": "#D7BA7D",
    "마크다운 목록 기호": "#6796E6",
    이름표: "#C8C8C8",
  },
} as const;

const themes = [
  { mode: "light", theme: blogLightPlus },
  { mode: "dark", theme: blogDarkPlus },
] as const;

const collectForegrounds = (theme: typeof blogLightPlus) => {
  const colors = new Set<string>();
  const editorForeground = theme.colors?.["editor.foreground"];

  if (editorForeground) colors.add(editorForeground.toUpperCase());
  theme.tokenColors?.forEach((rule) => {
    const foreground = rule.settings?.foreground;

    if (foreground) colors.add(foreground.toUpperCase().slice(0, 7));
  });

  return [...colors];
};

describe.each(themes)("$mode 코드 테마", ({ mode, theme }) => {
  const backgrounds = CODE_BACKGROUNDS[mode];

  it("바탕을 코드 칸 바탕으로 바꾼다", () => {
    expect(theme.colors?.["editor.background"]).toBe(backgrounds.base);
  });

  it.each(Object.entries(FINAL_COLORS[mode]))(
    "%s(%s)는 테마에 있고 바탕과 강조 줄 위에서 4.5:1을 넘는다",
    (_, color) => {
      expect(collectForegrounds(theme)).toContain(color);
      expect(getContrastRatio({ foreground: color, background: backgrounds.base })).toBeGreaterThanOrEqual(
        MIN_CONTRAST,
      );
      expect(
        getContrastRatio({ foreground: color, background: backgrounds.lineHighlight }),
      ).toBeGreaterThanOrEqual(MIN_CONTRAST);
    },
  );

  it("테마가 쓰는 모든 글자색이 바탕과 강조 줄 위에서 4.5:1을 넘는다", () => {
    const failures = collectForegrounds(theme).flatMap((color) =>
      [backgrounds.base, backgrounds.lineHighlight]
        .map((background) => ({
          color,
          background,
          ratio: getContrastRatio({ foreground: color, background }),
        }))
        .filter(({ ratio }) => ratio < MIN_CONTRAST),
    );

    expect(failures).toEqual([]);
  });
});
