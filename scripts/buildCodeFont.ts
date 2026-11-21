/**
 * 코드 칸 속 한글(주석 · 문자열)을 그릴 부분 글꼴을 만듭니다.
 *
 * - 원본: D2Coding 1.3.2 (NAVER, SIL Open Font License 1.1). 개발 의존성 @kfonts/d2coding의 TTF를 씁니다.
 * - 글(src/content/posts)의 코드 칸 · 본문 속 코드에 나오는 한글만 남겨 src/shared/styles/fonts/에 둡니다.
 * - OFL 3조: D2Coding은 「D2Coding」을 예약 글꼴 이름으로 정했으므로, 수정본(부분 글꼴)은 그 이름을 쓰지 않고
 *   「Blog Code Hangul」로 바꿉니다. 저작권 표시는 남기고, OFL 전문은 같은 폴더의 D2Coding-OFL.txt에 둡니다.
 *
 * 쓰는 법
 * - `pnpm fonts:code`: 글자를 모아 글꼴을 다시 만듭니다. 글의 코드에 새 한글을 쓰면 돌립니다.
 * - `pnpm fonts:code --check`: 글에 쓰였는데 글꼴에 없는 한글이 있으면 실패합니다(`pnpm check`가 함께 돌림).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { createFont, woff2 } from "fonteditor-core";

import collectCodeHangul from "../src/shared/content/collectCodeHangul/index.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const POSTS_DIR = path.join(ROOT, "src/content/posts");
const OUT_DIR = path.join(ROOT, "src/shared/styles/fonts");
const OUT_FONT = path.join(OUT_DIR, "blog-code-hangul.woff2");
const OUT_CHARS = path.join(OUT_DIR, "blog-code-hangul.txt");
const FAMILY_NAME = "Blog Code Hangul";

const require = createRequire(import.meta.url);
const SOURCE_FONT = path.join(
  path.dirname(require.resolve("@kfonts/d2coding/package.json")),
  "src/D2Coding.ttf",
);

const readPostSources = () =>
  readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(POSTS_DIR, entry.name, "index.mdx"))
    .filter((file) => existsSync(file))
    .map((file) => readFileSync(file, "utf8"));

const collectNeededCharacters = () => collectCodeHangul(readPostSources().join("\n"));

const readBuiltCharacters = () =>
  existsSync(OUT_CHARS) ? [...readFileSync(OUT_CHARS, "utf8").trim()] : [];

const check = () => {
  const built = new Set(readBuiltCharacters());
  const missing = collectNeededCharacters().filter((character) => !built.has(character));

  if (!existsSync(OUT_FONT) || missing.length > 0) {
    console.error(
      `코드용 한글 글꼴에 없는 글자가 있습니다: ${missing.join("") || "(글꼴 파일 없음)"}\n` +
        "pnpm fonts:code 로 다시 만드세요.",
    );
    process.exit(1);
  }

  console.log(`코드용 한글 글꼴이 글과 맞습니다 (${built.size}자).`);
};

const build = async () => {
  const characters = collectNeededCharacters();
  const font = createFont(readFileSync(SOURCE_FONT), {
    type: "ttf",
    subset: characters.map((character) => character.codePointAt(0) ?? 0),
    hinting: false,
  });
  const data = font.get();

  data.name = {
    ...data.name,
    fontFamily: FAMILY_NAME,
    fullName: FAMILY_NAME,
    postScriptName: FAMILY_NAME.replaceAll(" ", ""),
    uniqueSubFamily: `${FAMILY_NAME} Regular`,
    preferredFamily: FAMILY_NAME,
    // 이름 표의 Mac 기록은 한글이 깨질 수 있어 영어로 적습니다
    description:
      "Subset of D2Coding (Copyright (c) 2015, NAVER Corporation) keeping only the Hangul used in this blog's code. Renamed under OFL section 3 (Reserved Font Name: D2Coding).",
    licence: "This Font Software is licensed under the SIL Open Font License, Version 1.1.",
    urlOfLicence: "https://openfontlicense.org",
  };
  font.set(data);

  await woff2.init();
  writeFileSync(OUT_FONT, font.write({ type: "woff2", hinting: false }) as Buffer);
  writeFileSync(OUT_CHARS, `${characters.join("")}\n`);
  console.log(`코드용 한글 글꼴을 만들었습니다: ${characters.length}자 → ${path.relative(ROOT, OUT_FONT)}`);
};

if (process.argv.includes("--check")) {
  check();
} else {
  await build();
}
