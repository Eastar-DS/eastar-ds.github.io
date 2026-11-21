import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";

import readPostOgImage from ".";

const postsDir = mkdtempSync(path.join(tmpdir(), "og-posts-"));

const writePng = async ({ slug, width, height }: { slug: string; width: number; height: number }) => {
  const png = await sharp({
    create: { width, height, channels: 3, background: "#ffffff" },
  })
    .png()
    .toBuffer();

  mkdirSync(path.join(postsDir, slug), { recursive: true });
  writeFileSync(path.join(postsDir, slug, "og.png"), png);

  return png;
};

afterAll(() => rmSync(postsDir, { recursive: true, force: true }));

describe("readPostOgImage", () => {
  it("글 폴더에 og.png가 없으면 undefined를 돌려준다", async () => {
    expect(await readPostOgImage({ slug: "no-image", postsDir })).toBeUndefined();
  });

  it("1200×630 og.png가 있으면 그 파일을 그대로 쓴다", async () => {
    const png = await writePng({ slug: "custom-image", width: 1200, height: 630 });

    expect(await readPostOgImage({ slug: "custom-image", postsDir })).toEqual(new Uint8Array(png));
  });

  it("크기가 다르면 빌드를 멈춘다", async () => {
    await writePng({ slug: "wrong-size", width: 1000, height: 500 });

    await expect(readPostOgImage({ slug: "wrong-size", postsDir })).rejects.toThrow("크기가 1000×500입니다");
  });
});
