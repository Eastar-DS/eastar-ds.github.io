import sharp from "sharp";
import { describe, expect, it } from "vitest";

import tokensCss from "@/shared/styles/tokens.css?raw";

import createOgImage, { findOgImageProblems, getOgTitleFontSize, readLightColors } from ".";

describe("getOgTitleFontSize", () => {
  it("32자 이하 제목은 68px로 쓴다", () => {
    expect(getOgTitleFontSize("라이브러리 없이 목록 가상화하기: 966ms를 46ms로")).toBe(68);
  });

  it("길수록 줄이되 48px 밑으로는 줄이지 않는다", () => {
    expect(getOgTitleFontSize("가".repeat(33))).toBe(60);
    expect(getOgTitleFontSize("가".repeat(40))).toBe(60);
    expect(getOgTitleFontSize("가".repeat(80))).toBe(52);
    expect(getOgTitleFontSize("가".repeat(80))).toBeGreaterThanOrEqual(48);
  });
});

describe("readLightColors", () => {
  it("tokens.css의 light-dark()에서 밝은 화면 값을 읽는다", () => {
    expect(readLightColors(tokensCss)).toEqual({
      bg: "#ffffff",
      text: "#1f2328",
      "text-muted": "#59636e",
      accent: "#2457d6",
      border: "#e5e7eb",
    });
  });

  it("토큰이 없으면 빌드를 멈춘다", () => {
    expect(() => readLightColors(":root { --color-bg: #fff; }")).toThrow("--color-bg");
  });
});

describe("findOgImageProblems", () => {
  it("1200×630, 300KB 이하면 문제가 없다", () => {
    expect(findOgImageProblems({ width: 1200, height: 630, byteLength: 300 * 1024 })).toEqual([]);
  });

  it("크기와 파일 크기가 다르면 알린다", () => {
    expect(findOgImageProblems({ width: 1200, height: 600, byteLength: 301 * 1024 })).toEqual([
      "크기가 1200×600입니다. 1200×630여야 합니다",
      "파일이 301KB입니다. 300KB 이하여야 합니다",
    ]);
  });
});

describe("createOgImage", () => {
  it("글 제목과 분류로 1200×630 PNG를 300KB 이하로 만든다", async () => {
    const png = await createOgImage({
      label: "React",
      title: "라이브러리 없이 목록 가상화하기: 966ms를 46ms로",
    });
    const { width, height, format } = await sharp(png).metadata();

    expect({ width, height, format }).toEqual({ width: 1200, height: 630, format: "png" });
    expect(png.byteLength).toBeLessThanOrEqual(300 * 1024);
  });

  it("Pretendard에 없는 글자가 있으면 빌드를 멈춘다", async () => {
    await expect(createOgImage({ title: "漢字가 든 제목" })).rejects.toThrow("Pretendard에 없는 글자");
  });
});
