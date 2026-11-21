/**
 * 사이트에 쓰인 글자만 담은 글꼴 세 개를 만들고, 빠진 글자가 없는지 검사합니다.
 *
 * | 파일 | 원본 | 넣는 글자 |
 * | --- | --- | --- |
 * | blog-sans.woff2 | Pretendard Variable 1.3.9 (OFL, 예약 이름 Pretendard · Source) | 빌드 결과의 모든 글자 + ASCII. 굵기 축은 400–800만 |
 * | jetbrains-mono.woff2 | JetBrains Mono 400 latin (OFL) | 위와 같은 글자 가운데 이 글꼴에 있는 것 |
 * | blog-code-hangul.woff2 | D2Coding 1.3.2 (OFL, 예약 이름 D2Coding) | <pre> · <code> 안의 한글 |
 *
 * - 글자는 빌드 결과(dist의 HTML · RSS · CSS · JS)에서 모읍니다. 코드 주석 속 한글은 빠지고,
 *   JavaScript가 나중에 그리는 글(데모의 「재생 중」 등)은 JS 번들에서 잡힙니다.
 * - OFL 3조: 예약 이름이 있는 글꼴은 줄인 수정본에 그 이름을 쓸 수 없어 Blog Sans · Blog Code Hangul로 바꿉니다.
 *   저작권 표시는 남기고, 라이선스 전문은 같은 폴더의 *-OFL.txt에 둡니다.
 * - 개발 서버가 바로 쓰도록 결과를 커밋합니다. `pnpm build`가 매번 다시 만들고(글자가 같으면 그대로 둠) 검사합니다.
 *
 * 쓰는 법 (`pnpm build`가 차례로 돌립니다)
 * - `node scripts/buildFonts.ts`: dist를 읽어 글꼴을 다시 만듭니다. 먼저 `astro build`가 있어야 합니다.
 * - `node scripts/buildFonts.ts --check`: dist의 글자가 글꼴에 모두 있는지 검사하고, 빠지면 실패합니다.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { createFont, woff2 } from "fonteditor-core";
import subsetFont from "subset-font";

import {
  ASCII_PRINTABLE,
  collectCodeHangul,
  collectSiteCharacters,
} from "./fonts/collectFontText.ts";
import renameFont from "./fonts/renameFont.ts";
import toSubsetCodePoints from "./fonts/toSubsetCodePoints.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");
const FONT_DIR = path.join(ROOT, "src/shared/styles/fonts");
const require = createRequire(import.meta.url);

// 사이트가 쓰는 굵기 범위 (--font-weight-regular 400 ~ --font-weight-heavy 800)
const WEIGHT_RANGE = { min: 400, max: 800 };

const SOURCES = {
  pretendard: require.resolve("pretendard/dist/web/variable/woff2/PretendardVariable.woff2"),
  jetbrainsMono: require.resolve(
    "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
  ),
  d2coding: path.join(path.dirname(require.resolve("@kfonts/d2coding/package.json")), "src/D2Coding.ttf"),
};

const OUTPUTS = {
  sans: { font: "blog-sans.woff2", list: "blog-sans.txt", family: "Blog Sans" },
  mono: { font: "jetbrains-mono.woff2", list: "jetbrains-mono.txt" },
  codeHangul: { font: "blog-code-hangul.woff2", list: "blog-code-hangul.txt", family: "Blog Code Hangul" },
} as const;

const walk = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);

    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
  });

const readDist = () => {
  if (!existsSync(DIST)) {
    console.error("dist가 없습니다. 먼저 astro build를 돌리세요.");
    process.exit(1);
  }

  const files = walk(DIST).filter((file) => /\.(html|xml|css|js|txt)$/.test(file));
  const read = (file: string) => readFileSync(file, "utf8");

  return {
    all: files.map(read),
    html: files.filter((file) => file.endsWith(".html")).map(read),
  };
};

const outputPath = (file: string) => path.join(FONT_DIR, file);

const isUnchanged = (output: { font: string; list: string }, characters: string[]) =>
  existsSync(outputPath(output.font)) &&
  existsSync(outputPath(output.list)) &&
  readFileSync(outputPath(output.list), "utf8") === `${characters.join("")}\n`;

const writeOutput = (output: { font: string; list: string }, font: Uint8Array, characters: string[]) => {
  writeFileSync(outputPath(output.font), font);
  writeFileSync(outputPath(output.list), `${characters.join("")}\n`);
  console.log(`  ${output.font}: ${characters.length}자 → ${(font.byteLength / 1024).toFixed(1)}KB`);
};

const buildSans = async (characters: string[]) => {
  const sfnt = await subsetFont(readFileSync(SOURCES.pretendard), characters.join(""), {
    targetFormat: "sfnt",
    variationAxes: { wght: WEIGHT_RANGE },
    preserveNameIds: [13, 14],
  });
  const renamed = renameFont({
    sfnt,
    familyName: OUTPUTS.sans.family,
    reservedNames: ["Pretendard", "Source"],
  });

  return woff2.encode(Buffer.from(renamed));
};

const buildMono = async (characters: string[]) =>
  subsetFont(readFileSync(SOURCES.jetbrainsMono), characters.join(""), {
    targetFormat: "woff2",
    preserveNameIds: [13, 14],
  });

const buildCodeHangul = (characters: string[]) => {
  const font = createFont(readFileSync(SOURCES.d2coding), {
    type: "ttf",
    subset: toSubsetCodePoints(characters),
    hinting: false,
  });
  const data = font.get();

  data.name = {
    ...data.name,
    fontFamily: OUTPUTS.codeHangul.family,
    fullName: OUTPUTS.codeHangul.family,
    postScriptName: OUTPUTS.codeHangul.family.replaceAll(" ", ""),
    uniqueSubFamily: `${OUTPUTS.codeHangul.family} Regular`,
    preferredFamily: OUTPUTS.codeHangul.family,
    // 이름 표의 Mac 기록은 한글이 깨질 수 있어 영어로 적습니다
    description:
      "Subset of D2Coding (Copyright (c) 2015, NAVER Corporation) keeping only the Hangul used in this blog's code. Renamed under OFL section 3 (Reserved Font Name: D2Coding).",
    licence: "This Font Software is licensed under the SIL Open Font License, Version 1.1.",
    urlOfLicence: "https://openfontlicense.org",
  };
  font.set(data);

  return font.write({ type: "woff2", hinting: false }) as Uint8Array;
};

const readCmap = (file: string) => {
  const font = createFont(readFileSync(outputPath(file)), { type: "woff2" });

  return new Set(Object.keys(font.get().cmap).map(Number));
};

const findMissing = (characters: string[], cmap: Set<number>) =>
  characters.filter((character) => character !== " " && !cmap.has(character.codePointAt(0) ?? 0));

const generate = async () => {
  const dist = readDist();
  const siteCharacters = collectSiteCharacters(dist.all);
  const codeHangul = collectCodeHangul(dist.html);

  console.log("사이트 글자로 글꼴을 만듭니다");
  if (isUnchanged(OUTPUTS.sans, siteCharacters)) {
    console.log(`  ${OUTPUTS.sans.font}: 글자가 같아 그대로 둡니다`);
  } else {
    writeOutput(OUTPUTS.sans, await buildSans(siteCharacters), siteCharacters);
  }
  if (isUnchanged(OUTPUTS.mono, siteCharacters)) {
    console.log(`  ${OUTPUTS.mono.font}: 글자가 같아 그대로 둡니다`);
  } else {
    writeOutput(OUTPUTS.mono, await buildMono(siteCharacters), siteCharacters);
  }
  if (isUnchanged(OUTPUTS.codeHangul, codeHangul)) {
    console.log(`  ${OUTPUTS.codeHangul.font}: 글자가 같아 그대로 둡니다`);
  } else {
    writeOutput(OUTPUTS.codeHangul, buildCodeHangul(codeHangul), codeHangul);
  }
};

const check = () => {
  const dist = readDist();
  const problems = [
    {
      label: `${OUTPUTS.sans.font} (본문 글꼴)`,
      missing: findMissing(collectSiteCharacters(dist.all), readCmap(OUTPUTS.sans.font)),
    },
    {
      label: `${OUTPUTS.mono.font} (코드 글꼴의 ASCII)`,
      missing: findMissing(ASCII_PRINTABLE, readCmap(OUTPUTS.mono.font)),
    },
    {
      label: `${OUTPUTS.codeHangul.font} (코드 속 한글)`,
      missing: findMissing(collectCodeHangul(dist.html), readCmap(OUTPUTS.codeHangul.font)),
    },
  ].filter(({ missing }) => missing.length > 0);

  if (problems.length > 0) {
    problems.forEach(({ label, missing }) =>
      console.error(`글꼴에 없는 글자 — ${label}: ${missing.join("")}`),
    );
    console.error(
      "pnpm build로 글꼴을 다시 만드세요. 그래도 남으면 원본 글꼴에 없는 글자입니다(다른 글자로 바꾸거나 글꼴을 정하세요).",
    );
    process.exit(1);
  }

  console.log("빠진 글자 없음: 빌드 결과의 글자가 모두 글꼴에 있습니다.");
};

await woff2.init();

if (process.argv.includes("--check")) {
  check();
} else {
  await generate();
}
