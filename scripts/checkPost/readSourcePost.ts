// 글 파일 하나를 점검에 쓰는 모양(앞머리 값 + 본문 조각)으로 읽는 순수 함수입니다.
import parseFrontmatter, { toPostMeta } from "./parseFrontmatter.ts";
import parseMdx, { type MdxDocument } from "./parseMdx.ts";
import type { PostMeta } from "./types.ts";

export interface SourcePost {
  slug: string;
  /** 저장소 안 경로. 결과와 CI 알림에 씁니다. 예: `src/content/posts/글-이름/index.mdx` */
  file: string;
  source: string;
  meta: PostMeta;
  frontmatterErrors: { line: number; message: string }[];
  /** 앞머리 칸이 있는 줄 번호. 예: `{ title: 2 }` */
  frontmatterLines: Record<string, number>;
  bodyStartLine: number;
  document: MdxDocument;
}

interface ReadSourcePostParams {
  slug: string;
  file: string;
  source: string;
}

const readSourcePost = ({ slug, file, source }: ReadSourcePostParams) => {
  const frontmatter = parseFrontmatter(source);
  const frontmatterLines = Object.fromEntries(
    source
      .split(/\r?\n/)
      .slice(1, Math.max(1, frontmatter.bodyStartLine - 2))
      .flatMap((line, index) => {
        const key = /^([A-Za-z_][\w-]*):/.exec(line)?.[1];

        return key ? [[key, index + 2]] : [];
      }),
  ) as Record<string, number>;
  const post: SourcePost = {
    slug,
    file,
    source,
    meta: toPostMeta(frontmatter.data),
    frontmatterErrors: frontmatter.errors,
    frontmatterLines,
    bodyStartLine: frontmatter.bodyStartLine,
    document: parseMdx({ source, bodyStartLine: frontmatter.bodyStartLine }),
  };

  return post;
};

export default readSourcePost;
