import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

import { findOgImageProblems } from "@/shared/seo/createOgImage";

interface ReadPostOgImageParams {
  slug: string;
  /** 글 폴더들이 있는 곳. 빌드는 저장소 맨 위에서 돌므로 기본값은 `src/content/posts`입니다 */
  postsDir?: string;
}

/**
 * 글 폴더에 직접 만든 공유 미리보기 그림(`src/content/posts/{slug}/og.png`)을 읽습니다(docs/content-guide.md 6.2).
 * 없으면 `undefined`를 돌려줘서 빌드가 분류와 제목으로 그림을 그리게 하고, 있는데 1200×630이 아니거나 300KB를 넘으면 빌드를 멈춥니다.
 */
const readPostOgImage = async ({ slug, postsDir = path.join(process.cwd(), "src/content/posts") }: ReadPostOgImageParams) => {
  const file = path.join(postsDir, slug, "og.png");

  if (!existsSync(file)) return undefined;

  const png = readFileSync(file);
  const { width = 0, height = 0, format } = await sharp(png).metadata();
  const problems = [
    ...(format === "png" ? [] : [`PNG가 아닙니다(${format})`]),
    ...findOgImageProblems({ width, height, byteLength: png.byteLength }),
  ];

  if (problems.length > 0) {
    throw new Error(`글 폴더의 공유 미리보기 그림 ${path.relative(process.cwd(), file)}: ${problems.join(", ")}`);
  }

  return new Uint8Array(png);
};

export default readPostOgImage;
