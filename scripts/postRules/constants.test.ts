import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORIES, DESCRIPTION_LENGTH, H2_COUNT, POST_CHARACTERS, SERIES_MIN_POSTS, SLUG, TITLE_LENGTH } from "./constants.ts";
import { countPostCharacters, countTitleCharacters } from "./countCharacters.ts";
const guide = readFileSync(path.resolve(import.meta.dirname, "../../docs/content-guide.md"), "utf8");
describe("정본의 숫자", () => {
  it("제목, 요약, 주소, 절, 분량, 시리즈 기준이 정본과 같다", () => {
    for (const phrase of [`${TITLE_LENGTH.min}~${TITLE_LENGTH.max}자`, `${TITLE_LENGTH.limit}자를 넘기지`, `${DESCRIPTION_LENGTH.min}~${DESCRIPTION_LENGTH.max}자`, `${DESCRIPTION_LENGTH.limit}자를 넘기지`, `${SLUG.minWords}~${SLUG.maxWords}낱말`, `${H2_COUNT.min}~${H2_COUNT.max}개`, `${POST_CHARACTERS.min.toLocaleString("en-US")}~${POST_CHARACTERS.max.toLocaleString("en-US")}자`, SERIES_MIN_POSTS === 3 ? "세 편 이상" : "상수 갱신 필요"]) expect(guide).toContain(phrase);
    for (const category of CATEGORIES) expect(guide).toContain(category);
  });
  it("본문은 기존 읽는 시간 계산과 같고 제목은 공백과 코드 포인트를 센다", () => {
    expect(countPostCharacters('import Demo from "demo";\n## 제목\n가 나 <Demo /> [링크](https://example.com)\n```ts\nconst x = 1;\n```')).toBe(17);
    expect(countTitleCharacters("가 나😀")).toBe(4);
  });
});
