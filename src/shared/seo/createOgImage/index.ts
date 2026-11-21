import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { createElement as h } from "react";
import satori, { type Font } from "satori";
import sharp from "sharp";

import { OG_IMAGE } from "@/shared/constants/ogImage";
import { SITE } from "@/shared/constants/site";
import splitTitle from "@/shared/content/splitTitle";
import tokensCss from "@/shared/styles/tokens.css?raw";
import type { OgCard } from "@/shared/types/seo";

/**
 * 공유 미리보기 그림(1200×630 PNG)을 만듭니다. 빌드할 때 `og.png` 엔드포인트가 부릅니다.
 *
 * - 색은 `tokens.css`의 밝은 화면 값을 읽어 씁니다. 공유 카드는 앱마다 바탕이 달라서 밝은 화면 한 벌만 만듭니다.
 * - 글자는 사이트 글꼴(빌드에 쓰인 글자만 담은 Blog Sans)이 아니라 Pretendard 원본 글꼴 전체로 그립니다.
 *   그림 속 글은 사이트 글꼴 만들기(`scripts/buildFonts.ts`)와 따로 그려야 빠진 글자가 생기지 않습니다.
 * - 원본 글꼴에도 없는 글자(한자, 그림 문자 등)가 있으면 빌드를 멈춥니다. 네모로 그려진 그림이 배포되지 않게 하려는 것입니다.
 */

// 그림 안의 배치 값. 1200px 그림이 공유 카드에서 500px 안팎으로 줄어 보이므로 화면 글자 단계보다 크게 잡았습니다.
// 글은 가운데 1080×530px 안에 둡니다(docs/content-guide.md 6.2). 가로 안쪽 72px, 세로 안쪽 64px라 1056×502px입니다.
const LAYOUT = {
  paddingX: 72,
  paddingY: 64,
  labelSize: 32,
  labelGap: 28,
  descriptionSize: 34,
  footerSize: 30,
  footerGap: 28,
  // 공유 카드에서 줄어도 보이게 --border-width-strong(2px) 굵기로 긋습니다
  dividerWidth: 2,
};

/** 제목 글자 크기. 길수록 줄이되 늘 48px 이상입니다(docs/content-guide.md 6.2) */
const TITLE_SIZES = [
  { maxLength: 32, size: 68 },
  { maxLength: 40, size: 60 },
  { maxLength: Infinity, size: 52 },
];

const FONT_FILES = [
  { weight: 400, file: "Pretendard-Regular.otf" },
  { weight: 600, file: "Pretendard-SemiBold.otf" },
  { weight: 700, file: "Pretendard-Bold.otf" },
] as const;

const COLOR_TOKENS = ["bg", "text", "text-muted", "accent", "border"] as const;

type ColorToken = (typeof COLOR_TOKENS)[number];
type OgColors = Record<ColorToken, string>;

/** 제목 길이(글자 수)에 맞는 글자 크기를 고릅니다. 제목은 32자 이하가 기본이고 40자를 넘기지 않습니다(docs/content-guide.md 2.1) */
export const getOgTitleFontSize = (title: string) =>
  TITLE_SIZES.find(({ maxLength }) => [...title].length <= maxLength)?.size ?? 52;

/** `tokens.css`에서 `--color-이름: light-dark(밝은 값, 어두운 값)`의 밝은 값을 읽습니다 */
export const readLightColors = (css: string) =>
  Object.fromEntries(
    COLOR_TOKENS.map((token) => {
      const match = css.match(new RegExp(`--color-${token}:\\s*light-dark\\(\\s*(#[0-9a-fA-F]{3,8})\\s*,`));

      if (!match?.[1]) {
        throw new Error(`tokens.css에서 --color-${token}의 밝은 값을 찾지 못했습니다`);
      }

      return [token, match[1]];
    }),
  ) as OgColors;

interface FindOgImageProblemsParams {
  width: number;
  height: number;
  byteLength: number;
}

/** 공유 미리보기 그림이 크기 규칙(1200×630, 300KB 이하)을 어기는 곳을 찾습니다. 없으면 빈 배열입니다 */
export const findOgImageProblems = ({ width, height, byteLength }: FindOgImageProblemsParams) => [
  ...(width !== OG_IMAGE.width || height !== OG_IMAGE.height
    ? [`크기가 ${width}×${height}입니다. ${OG_IMAGE.width}×${OG_IMAGE.height}여야 합니다`]
    : []),
  ...(byteLength > OG_IMAGE.maxBytes
    ? [`파일이 ${Math.round(byteLength / 1024)}KB입니다. ${OG_IMAGE.maxBytes / 1024}KB 이하여야 합니다`]
    : []),
];

interface ToOgCardElementParams {
  card: OgCard;
  colors: OgColors;
}

/** 그림의 요소 나무를 만듭니다. 위에서부터 분류(강조색) → 제목 → 설명(보조색), 맨 아래 구분선과 사이트 이름 · 주소입니다 */
export const toOgCardElement = ({ card, colors }: ToOgCardElementParams) => {
  const titleSize = getOgTitleFontSize(card.title);
  // 사이트 기본 그림은 제목이 곧 사이트 이름이라, 아래 줄에는 주소만 둡니다
  const isSiteCard = card.title === SITE.title;
  const domain = new URL(SITE.url).host;

  return h(
    "div",
    {
      style: {
        width: OG_IMAGE.width,
        height: OG_IMAGE.height,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: `${LAYOUT.paddingY}px ${LAYOUT.paddingX}px`,
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: "Pretendard",
      },
    },
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: LAYOUT.labelGap } },
      card.label &&
        h(
          "div",
          { style: { fontSize: LAYOUT.labelSize, fontWeight: 600, color: colors.accent, lineHeight: 1.2 } },
          card.label,
        ),
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: "-0.02em",
          },
        },
        ...splitTitle(card.title).map((part) =>
          h("div", { style: { wordBreak: "keep-all", textWrap: "balance", lineClamp: 3 } }, part),
        ),
      ),
      card.description &&
        h(
          "div",
          {
            style: {
              fontSize: LAYOUT.descriptionSize,
              lineHeight: 1.5,
              color: colors["text-muted"],
              wordBreak: "keep-all",
              textWrap: "balance",
              lineClamp: 3,
            },
          },
          card.description,
        ),
    ),
    h(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: isSiteCard ? "flex-start" : "space-between",
          alignItems: "center",
          borderTop: `${LAYOUT.dividerWidth}px solid ${colors.border}`,
          paddingTop: LAYOUT.footerGap,
          fontSize: LAYOUT.footerSize,
          lineHeight: 1.2,
        },
      },
      !isSiteCard && h("div", { style: { fontWeight: 700 } }, SITE.title),
      h("div", { style: { color: colors["text-muted"] } }, domain),
    ),
  );
};

const require = createRequire(import.meta.url);
let fonts: Font[] | undefined;

// Pretendard 원본(OTF, 한글 11,172자 모두 있음). 사이트 글꼴 만들기와 같은 pretendard 패키지에서 읽고, 한 번 읽으면 다시 씁니다
const loadFonts = () => {
  fonts ??= FONT_FILES.map(({ weight, file }) => ({
    name: "Pretendard",
    weight,
    style: "normal",
    data: readFileSync(require.resolve(`pretendard/dist/public/static/${file}`)),
  }));

  return fonts;
};

/** 카드 하나를 1200×630 PNG로 그립니다. 원본 글꼴에 없는 글자가 있거나 크기 규칙을 어기면 빌드를 멈춥니다 */
const createOgImage = async (card: OgCard) => {
  const missing: string[] = [];
  const svg = await satori(toOgCardElement({ card, colors: readLightColors(tokensCss) }), {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    fonts: loadFonts(),
    // 글꼴에 없는 글자를 만나면 satori가 부릅니다. 대신 그릴 글꼴을 주지 않고 모아 두었다가 빌드를 멈춥니다
    loadAdditionalAsset: async (_code: string, segment: string) => {
      missing.push(segment);

      return [];
    },
  });

  if (missing.length > 0) {
    throw new Error(
      `공유 미리보기 그림 「${card.title}」에 Pretendard에 없는 글자가 있습니다: ${[...new Set(missing)].join(" ")}`,
    );
  }

  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  const problems = findOgImageProblems({ width: OG_IMAGE.width, height: OG_IMAGE.height, byteLength: png.byteLength });

  if (problems.length > 0) {
    throw new Error(`공유 미리보기 그림 「${card.title}」: ${problems.join(", ")}`);
  }

  return new Uint8Array(png);
};

export default createOgImage;
