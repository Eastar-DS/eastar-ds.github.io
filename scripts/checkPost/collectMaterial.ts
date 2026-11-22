// prepublish-check 스킬이 판단 항목(첫 문단에 결론이 있는지, h2마다 첫 문장이 답인지, 출처 링크 등)을 볼 때 쓰는 재료를 글에서 뽑는 순수 함수입니다.
// 판단은 하지 않고 줄 번호와 원문만 모읍니다. `--json` 출력의 `material` 칸이 됩니다.
import { SITE } from "../../src/shared/constants/site/index.ts";
import { QUESTION_HEADING_ENDING } from "./constants.ts";
import findReviewMarkers from "./findReviewMarkers.ts";
import type { SourcePost } from "./readSourcePost.ts";

interface Sentence {
  line: number;
  text: string;
}

const firstSentence = (text: string) => /^.*?[.?!](?=\s|$)/.exec(text.trim())?.[0] ?? text.trim();

/** 글 하나의 판단 재료를 모읍니다 */
const collectMaterial = (post: SourcePost) => {
  const { document } = post;
  const sourceLines = post.source.split(/\r?\n/);
  const original = (line: number) => sourceLines[line - 1]?.trim() ?? "";
  const firstText = document.lines.find((line) => line.kind === "text");

  const headings = document.headings.map((heading) => {
    const next = document.headings.find((other) => other.line > heading.line);
    const body = document.lines.find(
      (line) => line.line > heading.line && (next === undefined || line.line < next.line) && (line.kind === "text" || line.kind === "list"),
    );
    const sentence: Sentence | undefined = body ? { line: body.line, text: firstSentence(original(body.line)) } : undefined;

    return {
      line: heading.line,
      depth: heading.depth,
      text: heading.text,
      id: heading.id,
      isQuestion: QUESTION_HEADING_ENDING.test(heading.text),
      firstSentence: sentence,
    };
  });

  const material = {
    firstParagraph: firstText ? { line: firstText.line, text: original(firstText.line) } : undefined,
    headings,
    links: document.links.map((link) => ({
      line: link.line,
      text: link.text,
      href: link.href,
      kind: link.href.startsWith("#") ? "anchor" : link.href.startsWith("/") || link.href.startsWith(SITE.url) ? "internal" : "external",
    })),
    images: document.images,
    figures: document.figures,
    reviewMarkers: findReviewMarkers({ source: post.source, fromLine: post.bodyStartLine }),
  };

  return material;
};

export type PostMaterial = ReturnType<typeof collectMaterial>;

export default collectMaterial;
