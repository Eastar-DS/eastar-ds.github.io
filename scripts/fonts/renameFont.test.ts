import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import subsetFont from "subset-font";
import { describe, expect, it } from "vitest";

import renameFont, { readNames } from "./renameFont";

const require = createRequire(import.meta.url);
const PRETENDARD = require.resolve("pretendard/dist/web/variable/woff2/PretendardVariable.woff2");

describe("renameFont", () => {
  it("글꼴 이름만 바꾸고 저작권 표시는 그대로 둔다", async () => {
    const sfnt = await subsetFont(readFileSync(PRETENDARD), "가A", { targetFormat: "sfnt" });
    const renamed = renameFont({
      sfnt,
      familyName: "Blog Sans",
      reservedNames: ["Pretendard"],
    });
    const names = readNames(renamed);
    const pick = (nameID: number) =>
      names.find((record) => record.nameID === nameID && record.platformID === 3)?.value;

    expect(pick(1)).not.toContain("Pretendard");
    expect(pick(1)).toContain("Blog Sans");
    expect(pick(6)).toContain("BlogSans");
    expect(pick(0)).toBe(readNames(sfnt).find((record) => record.nameID === 0 && record.platformID === 3)?.value);
    expect(renamed.byteLength).toBeGreaterThan(sfnt.byteLength - 64);
  });
});
