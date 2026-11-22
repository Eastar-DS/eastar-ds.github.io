// 글 원문(MDX)을 정본 docs/content-guide.md의 기준으로 검사하는 순수 함수입니다.
// 기준 값과 근거는 ./constants.ts에 있습니다. 검사마다 결과 하나(CheckResult)를 돌려줍니다.
import calculateReadingMinutes from "../../src/shared/content/calculateReadingMinutes/index.ts";
import { SITE } from "../../src/shared/constants/site/index.ts";
import {
  CATEGORIES,
  CATEGORY_BASIS,
  CODE,
  CONTENT_GUIDE,
  DESCRIPTION_LENGTH,
  FIGURE,
  NOTATION,
  MULTIPLE_TILDES,
  POST_LINK_PATTERN,
  QUESTION_HEADING_ENDING,
  REVIEW_MARKER_BASIS,
  SLUG,
  STRUCTURE,
  TITLE_LENGTH,
  VAGUE_LINK_TEXTS,
} from "./constants.ts";
import findPrivateInfo, { PRIVATE_INFO_LABELS } from "./findPrivateInfo.ts";
import findReviewMarkers from "./findReviewMarkers.ts";
import type { ProseLine } from "./parseMdx.ts";
import type { SourcePost } from "./readSourcePost.ts";
import type { CheckResult, CheckStatus, Finding } from "./types.ts";

/** 글자 수. 공백과 문장 부호를 넣어 한 글자씩 셉니다 */
export const countCharacters = (text: string) => [...text].length;

interface ResultParams {
  id: string;
  label: string;
  basis: string;
  /** 찾은 것이 있을 때의 결과. 없으면 통과 */
  statusIfFound: Exclude<CheckStatus, "pass">;
  findings: Finding[];
  passSummary: string;
  failSummary?: string;
  fix?: string;
}

const byFindings = ({ id, label, basis, statusIfFound, findings, passSummary, failSummary, fix }: ResultParams) => {
  const result: CheckResult = {
    id,
    label,
    status: findings.length > 0 ? statusIfFound : "pass",
    summary: findings.length > 0 ? (failSummary ?? `${findings.length}곳`) : passSummary,
    findings,
    basis,
    fix: findings.length > 0 ? fix : undefined,
  };

  return result;
};

interface LengthParams {
  id: string;
  label: string;
  value: string | undefined;
  line?: number;
  range: { min: number; max: number; limit: number; basis: string };
  fix: string;
}

const checkLength = ({ id, label, value, line, range, fix }: LengthParams) => {
  const length = value === undefined ? 0 : countCharacters(value);
  const status: CheckStatus = value === undefined || length > range.limit ? "fail" : length < range.min || length > range.max ? "warn" : "pass";
  const result: CheckResult = {
    id,
    label,
    status,
    summary: value === undefined ? "앞머리에 없습니다" : `${length}자 (권장 ${range.min}~${range.max}자, 상한 ${range.limit}자)`,
    findings: status === "pass" || value === undefined ? [] : [{ line, message: value }],
    basis: range.basis,
    fix: status === "pass" ? undefined : fix,
  };

  return result;
};

const isProse = (line: ProseLine) => line.kind !== "code" && line.kind !== "esm" && line.kind !== "blank";

/** 문장 검사가 볼 글: 본문 문장 줄, 제목과 요약, 그림 설명, alt */
const collectProse = (post: SourcePost) => {
  const { document, meta, frontmatterLines } = post;

  return [
    ...(meta.title ? [{ line: frontmatterLines.title, text: meta.title }] : []),
    ...(meta.description ? [{ line: frontmatterLines.description, text: meta.description }] : []),
    ...document.lines.filter(isProse).map((line) => ({ line: line.line, text: line.text })),
    ...document.figures.flatMap((figure) => (figure.caption ? [{ line: figure.line, text: figure.caption }] : [])),
    ...document.images.flatMap((image) => (image.alt ? [{ line: image.line, text: image.alt }] : [])),
  ];
};

const findInProse = ({ post, pattern }: { post: SourcePost; pattern: RegExp }) =>
  collectProse(post).flatMap(({ line, text }) => {
    const matches = [...text.matchAll(new RegExp(pattern.source, `${pattern.flags.replace("g", "")}g`))];

    return matches.length > 0 ? [{ line, message: excerpt({ text, index: matches[0]?.index ?? 0 }) }] : [];
  });

/** 찾은 곳 앞뒤 글을 조금 보여 줍니다 */
const excerpt = ({ text, index }: { text: string; index: number }) => {
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + 20);

  return `${start > 0 ? "…" : ""}${text.slice(start, end).replace(/\s+/g, " ").trim()}${end < text.length ? "…" : ""}`;
};

/** 백슬래시가 바로 다음 글자를 이스케이프합니다. 두 백슬래시 뒤의 물결표는 이스케이프되지 않습니다. */
const unescapedTildeIndexes = (text: string) => {
  const indexes: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\\") index += 1;
    else if (text[index] === "~") indexes.push(index);
  }
  return indexes;
};

const safeDecode = (text: string) => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

const toSitePath = (href: string) => (href.startsWith(SITE.url) ? href.slice(SITE.url.length) || "/" : href);

interface CheckSourceParams {
  post: SourcePost;
  /** 저장소의 모든 글(초안 포함). 링크와 시리즈 검사에 씁니다 */
  posts: SourcePost[];
  /** 공개해도 되는 이메일 (`SITE.author.email`) */
  allowedEmails?: readonly string[];
}

/** 글 원문을 검사해 결과 목록을 돌려줍니다 */
const checkSource = ({ post, posts, allowedEmails = [] }: CheckSourceParams) => {
  const { meta, document, frontmatterLines, slug } = post;
  const results: CheckResult[] = [];
  const h2s = document.headings.filter((heading) => heading.depth === 2);
  const postsBySlug = new Map(posts.map((other) => [other.slug, other]));
  const sourceLines = post.source.split(/\r?\n/);

  // 앞머리
  const missing = (["title", "description", "publishedAt", "category"] as const).filter((key) => meta[key] === undefined);

  results.push(
    byFindings({
      id: "frontmatter",
      label: "앞머리",
      basis: `${CONTENT_GUIDE} 1장`,
      statusIfFound: "fail",
      findings: [
        ...post.frontmatterErrors.map((error) => ({ line: error.line, message: error.message })),
        ...missing.map((key) => ({ message: `꼭 있어야 하는 칸 \`${key}\`가 없습니다` })),
      ],
      passSummary: "꼭 있어야 하는 칸이 모두 있습니다",
      fix: "docs/content-guide.md 1장의 앞머리 예처럼 `칸: 값` 꼴로 씁니다.",
    }),
  );

  // 제목, 요약, 주소, 분류 (2장, 8장)
  results.push(
    checkLength({
      id: "title-length",
      label: "제목 길이",
      value: meta.title,
      line: frontmatterLines.title,
      range: TITLE_LENGTH,
      fix: "핵심 낱말을 앞 20자 안에 두고 25~32자로 맞춥니다.",
    }),
    checkLength({
      id: "description-length",
      label: "요약 길이",
      value: meta.description,
      line: frontmatterLines.description,
      range: DESCRIPTION_LENGTH,
      fix: "글이 답하는 질문과 답의 방향을 한두 문장, 60~80자로 씁니다.",
    }),
  );

  const titleHead = meta.title?.split(": ")[0] ?? "";
  const isRepeatingTitle =
    meta.title !== undefined &&
    meta.description !== undefined &&
    (meta.description.includes(meta.title) || (countCharacters(titleHead) >= 6 && meta.description.includes(titleHead)));

  results.push(
    byFindings({
      id: "description-repeats-title",
      label: "요약이 제목을 되풀이",
      basis: DESCRIPTION_LENGTH.basis,
      statusIfFound: "warn",
      findings: isRepeatingTitle ? [{ line: frontmatterLines.description, message: `요약에 제목 「${titleHead}」가 그대로 들어 있습니다` }] : [],
      passSummary: "되풀이하지 않습니다",
      fix: "제목에 없는 내용(무엇을 알게 되는지)을 씁니다.",
    }),
  );

  const slugWords = slug.split("-").length;

  results.push(
    byFindings({
      id: "slug-format",
      label: "주소 꼴",
      basis: SLUG.basis,
      statusIfFound: "fail",
      findings: SLUG.pattern.test(slug) ? [] : [{ message: `\`${slug}\`: 영어 소문자와 하이픈만 씁니다(숫자, 한글, 밑줄 없음)` }],
      passSummary: `\`${slug}\``,
      fix: "게시 전이면 폴더 이름을 바꿉니다. 게시한 뒤에는 주소를 바꾸지 않습니다(2.3).",
    }),
    byFindings({
      id: "slug-words",
      label: "주소 낱말 수",
      basis: SLUG.basis,
      statusIfFound: "warn",
      findings:
        slugWords < SLUG.minWords || slugWords > SLUG.maxWords
          ? [{ message: `${slugWords}낱말 (권장 ${SLUG.minWords}~${SLUG.maxWords}낱말)` }]
          : [],
      passSummary: `${slugWords}낱말`,
      fix: "게시 전이면 3~5낱말로 바꿉니다.",
    }),
    byFindings({
      id: "category",
      label: "분류",
      basis: CATEGORY_BASIS,
      statusIfFound: "fail",
      findings:
        meta.category !== undefined && CATEGORIES.some((category) => category === meta.category)
          ? []
          : [{ line: frontmatterLines.category, message: `「${meta.category ?? ""}」는 정한 분류(${CATEGORIES.join(", ")})가 아닙니다` }],
      passSummary: meta.category ?? "",
      fix: "정한 분류 가운데 하나를 씁니다. 새 분류는 이스타와 정해 정본 8.1에 먼저 더합니다.",
    }),
  );

  const toDate = (value: string | undefined) => (value && /^\d{4}-\d{2}-\d{2}/.test(value) ? new Date(value) : undefined);
  const publishedAt = toDate(meta.publishedAt);
  const updatedAt = toDate(meta.updatedAt);

  results.push(
    byFindings({
      id: "dates",
      label: "게시일과 수정일",
      basis: `${CONTENT_GUIDE} 9장`,
      statusIfFound: "fail",
      findings: [
        ...(publishedAt && !Number.isNaN(publishedAt.getTime()) ? [] : [{ line: frontmatterLines.publishedAt, message: "`publishedAt`이 날짜(YYYY-MM-DD)가 아닙니다" }]),
        ...(meta.updatedAt !== undefined && (!updatedAt || Number.isNaN(updatedAt.getTime()))
          ? [{ line: frontmatterLines.updatedAt, message: "`updatedAt`이 날짜(YYYY-MM-DD)가 아닙니다" }]
          : []),
        ...(publishedAt && updatedAt && updatedAt < publishedAt ? [{ line: frontmatterLines.updatedAt, message: "`updatedAt`이 `publishedAt`보다 앞섭니다" }] : []),
      ],
      passSummary: `${meta.publishedAt ?? ""}${meta.updatedAt ? `, 고침 ${meta.updatedAt}` : ""}`,
      fix: "날짜를 YYYY-MM-DD로 쓰고, 수정일은 게시일과 같거나 뒤로 둡니다.",
    }),
  );

  // 글 구조 (3장)
  results.push(
    byFindings({
      id: "h1",
      label: "본문 h1 없음",
      basis: STRUCTURE.basis,
      statusIfFound: "fail",
      findings: document.headings.filter((heading) => heading.depth === 1).map((heading) => ({ line: heading.line, message: heading.text })),
      passSummary: "본문에 `#`이 없습니다",
      fix: "h1은 앞머리 `title`입니다. 본문 제목은 `##`부터 씁니다.",
    }),
    byFindings({
      id: "heading-depth",
      label: "제목 깊이",
      basis: STRUCTURE.basis,
      statusIfFound: "fail",
      findings: document.headings
        .filter((heading) => heading.depth > STRUCTURE.maxHeadingDepth)
        .map((heading) => ({ line: heading.line, message: `h${heading.depth} ${heading.text}` })),
      passSummary: "`##` · `###`까지만 씁니다",
      fix: "`####`가 필요하면 글을 나누거나 목록으로 바꿉니다.",
    }),
    byFindings({
      id: "h2-count",
      label: "h2 개수",
      basis: STRUCTURE.basis,
      statusIfFound: "warn",
      findings:
        h2s.length < STRUCTURE.minH2 || h2s.length > STRUCTURE.maxH2
          ? [{ message: `${h2s.length}개 (알맞은 수 ${STRUCTURE.minH2}~${STRUCTURE.maxH2}개)` }]
          : [],
      passSummary: `${h2s.length}개`,
      fix: "절을 합치거나 나눕니다. 일곱 개를 넘으면 시리즈로 나눌지 봅니다.",
    }),
  );

  const trailing = [...h2s].reverse();
  const afterSummary = trailing.findIndex((heading) => !STRUCTURE.afterSummaryHeadings.includes(heading.text));
  const lastBody = afterSummary === -1 ? undefined : trailing[afterSummary];
  const summaryHeading = h2s.find((heading) => heading.text === STRUCTURE.summaryHeading);

  results.push(
    byFindings({
      id: "summary-section",
      label: "끝의 「정리」 절",
      basis: STRUCTURE.basis,
      statusIfFound: "fail",
      findings:
        lastBody?.text === STRUCTURE.summaryHeading
          ? []
          : [
              summaryHeading
                ? { line: summaryHeading.line, message: `「정리」 뒤에 「${lastBody?.text ?? ""}」 절이 있습니다` }
                : { message: "`## 정리` 절이 없습니다" },
            ],
      passSummary: afterSummary > 0 ? "「정리」 뒤에 「고친 내용」만 있습니다" : "마지막 h2가 「정리」입니다",
      fix: "글 끝에 `## 정리`를 두고 핵심 3~5개를 목록으로 씁니다. 「고친 내용」 절만 그 뒤에 둘 수 있습니다(9장).",
    }),
  );

  if (summaryHeading) {
    const nextHeading = document.headings.find((heading) => heading.line > summaryHeading.line && heading.depth <= 2);
    const items = document.lines.filter(
      (line) =>
        line.line > summaryHeading.line &&
        (nextHeading === undefined || line.line < nextHeading.line) &&
        line.kind === "list" &&
        /^([-*+]|\d+[.)])\s/.test(line.text),
    );

    results.push(
      byFindings({
        id: "summary-items",
        label: "「정리」 목록 항목 수",
        basis: STRUCTURE.basis,
        statusIfFound: "warn",
        findings:
          items.length < STRUCTURE.minSummaryItems || items.length > STRUCTURE.maxSummaryItems
            ? [{ line: summaryHeading.line, message: `${items.length}개 (기준 ${STRUCTURE.minSummaryItems}~${STRUCTURE.maxSummaryItems}개)` }]
            : [],
        passSummary: `${items.length}개`,
        fix: "핵심을 3~5개의 목록 항목으로 씁니다.",
      }),
    );
  }

  const bodyH2s = h2s.filter((heading) => heading.text !== STRUCTURE.summaryHeading && !STRUCTURE.afterSummaryHeadings.includes(heading.text));

  results.push(
    byFindings({
      id: "question-heading",
      label: "묻는 꼴 h2",
      basis: `${CONTENT_GUIDE} 10.3`,
      statusIfFound: "warn",
      findings: bodyH2s.some((heading) => QUESTION_HEADING_ENDING.test(heading.text)) ? [] : [{ message: "묻는 꼴(「~까」, 「~나」, 「?」로 끝남)의 h2가 없습니다" }],
      passSummary: `${bodyH2s.filter((heading) => QUESTION_HEADING_ENDING.test(heading.text)).length}개`,
      fix: "사람들이 실제로 검색할 질문을 h2 하나 이상에 씁니다.",
    }),
  );

  const body = sourceLines.slice(post.bodyStartLine - 1).join("\n");
  const readingMinutes = calculateReadingMinutes(body);

  results.push(
    byFindings({
      id: "reading-time",
      label: "읽는 시간",
      basis: STRUCTURE.basis,
      statusIfFound: "warn",
      findings:
        readingMinutes < STRUCTURE.minReadingMinutes || readingMinutes > STRUCTURE.maxReadingMinutes
          ? [{ message: `${readingMinutes}분 (기준 ${STRUCTURE.minReadingMinutes}~${STRUCTURE.maxReadingMinutes}분)` }]
          : [],
      passSummary: `${readingMinutes}분`,
      fix: "12분을 넘으면 시리즈로 나눕니다.",
    }),
  );

  // 코드 칸 (5장)
  const codeLine = (block: (typeof document.codeBlocks)[number], index: number) => block.line + 1 + index;

  results.push(
    byFindings({
      id: "code-fence",
      label: "코드 칸 닫힘",
      basis: CODE.basis,
      statusIfFound: "fail",
      findings: document.codeBlocks.filter((block) => !block.isClosed).map((block) => ({ line: block.line, message: "닫는 ``` 줄이 없습니다" })),
      passSummary: `코드 칸 ${document.codeBlocks.length}개`,
      fix: "코드 칸 끝에 여는 줄과 같은 ```를 둡니다.",
    }),
    byFindings({
      id: "code-language",
      label: "코드 칸 언어",
      basis: CODE.basis,
      statusIfFound: "fail",
      findings: document.codeBlocks.filter((block) => !block.lang).map((block) => ({ line: block.line, message: "언어가 없습니다" })),
      passSummary: "모든 칸에 언어를 적었습니다",
      fix: "```ts, ```bash, ```text(실행 결과)처럼 언어를 적습니다.",
    }),
    byFindings({
      id: "code-line-length",
      label: "코드 한 줄 길이",
      basis: CODE.basis,
      statusIfFound: "fail",
      findings: document.codeBlocks.flatMap((block) =>
        block.lines.flatMap((line, index) =>
          countCharacters(line) > CODE.maxLineLength ? [{ line: codeLine(block, index), message: `${countCharacters(line)}자 (상한 ${CODE.maxLineLength}자)` }] : [],
        ),
      ),
      passSummary: `모든 줄이 ${CODE.maxLineLength}자 이하`,
      fix: "변수로 나누거나 줄을 바꿔 60자 안으로 씁니다.",
    }),
    byFindings({
      id: "code-block-lines",
      label: "코드 칸 줄 수",
      basis: CODE.basis,
      statusIfFound: "fail",
      findings: document.codeBlocks
        .filter((block) => block.lines.length > CODE.maxLines)
        .map((block) => ({ line: block.line, message: `${block.lines.length}줄 (상한 ${CODE.maxLines}줄)` })),
      passSummary: `모든 칸이 ${CODE.maxLines}줄 이하`,
      fix: "핵심만 남기고 「…」 주석으로 줄입니다.",
    }),
    byFindings({
      id: "code-highlight",
      label: "강조 줄 수",
      basis: CODE.basis,
      statusIfFound: "fail",
      findings: document.codeBlocks
        .filter((block) => block.highlightedLineCount > CODE.maxHighlightedLines)
        .map((block) => ({ line: block.line, message: `${block.highlightedLineCount}줄 (상한 ${CODE.maxHighlightedLines}줄)` })),
      passSummary: `모든 칸이 ${CODE.maxHighlightedLines}줄 이하`,
      fix: "짚어 줄 줄을 세 줄 이하로 고릅니다.",
    }),
    byFindings({
      id: "code-shell-prompt",
      label: "셸 명령의 $ 프롬프트",
      basis: CODE.basis,
      statusIfFound: "fail",
      findings: document.codeBlocks
        .filter((block) => block.lang !== undefined && (CODE.shellLanguages as readonly string[]).includes(block.lang))
        .flatMap((block) => block.lines.flatMap((line, index) => (/^\s*\$\s/.test(line) ? [{ line: codeLine(block, index), message: line.trim() }] : []))),
      passSummary: "없습니다",
      fix: "복사해서 바로 쓰게 `$ `를 지웁니다.",
    }),
    byFindings({
      id: "code-indent",
      label: "코드 들여쓰기",
      basis: CODE.basis,
      statusIfFound: "warn",
      findings: document.codeBlocks.flatMap((block) =>
        block.lines.flatMap((line, index) => (/^\t/.test(line) ? [{ line: codeLine(block, index), message: "탭으로 들여썼습니다" }] : [])),
      ),
      passSummary: "탭 들여쓰기가 없습니다",
      fix: "들여쓰기를 스페이스 2칸으로 바꿉니다.",
    }),
  );

  // 한글 표기 (4장)
  const brTags = document.tags.filter((tag) => tag.name.toLowerCase() === "br").map((tag) => ({ line: tag.line, message: "`<br>`" }));
  const hardBreaks = document.lines.flatMap((line, index) => {
    const next = document.lines[index + 1];
    const original = sourceLines[line.line - 1] ?? "";

    if (line.kind !== "text" && line.kind !== "list") return [];
    if (/\\$/.test(original)) return [{ line: line.line, message: "줄 끝 `\\`(줄바꿈)" }];
    if (/\S {2,}$/.test(original) && next?.kind === "text") return [{ line: line.line, message: "줄 끝 공백 두 칸(줄바꿈)" }];

    return [];
  });

  results.push(
    byFindings({
      id: "br",
      label: "<br> 줄바꿈",
      basis: `${NOTATION.basis} 4.4`,
      statusIfFound: "fail",
      findings: [...brTags, ...hardBreaks],
      passSummary: "없습니다",
      fix: "`<br>`과 손 줄바꿈을 지웁니다. 화면의 줄바꿈은 CSS가 맡습니다.",
    }),
  );

  const emojiPattern = /\p{Emoji_Presentation}|\p{Extended_Pictographic}️/u;

  results.push(
    byFindings({
      id: "emoji",
      label: "이모지",
      basis: `${NOTATION.basis} 4.2`,
      statusIfFound: "fail",
      findings: sourceLines.flatMap((line, index) => {
        const match = emojiPattern.exec(line);

        return match ? [{ line: index + 1, message: excerpt({ text: line, index: match.index }) }] : [];
      }),
      passSummary: "없습니다",
      fix: "이모지를 지웁니다. 범주는 이름표나 모양(●▲■◆)으로 나눕니다.",
    }),
    byFindings({
      id: "exclamation",
      label: "느낌표",
      basis: `${NOTATION.basis} 4.2`,
      statusIfFound: "fail",
      findings: findInProse({ post, pattern: /[!！]/ }),
      passSummary: "없습니다",
      fix: "느낌표를 마침표로 바꿉니다. 코드라면 백틱으로 감쌉니다.",
    }),
    byFindings({
      id: "double-quote",
      label: "큰따옴표",
      basis: `${NOTATION.basis} 4.2`,
      statusIfFound: "fail",
      findings: findInProse({ post, pattern: /["“”]/ }),
      passSummary: "코드 밖에 없습니다",
      fix: "화면 문구와 인용은 「」로, 코드 문자열은 백틱으로 씁니다.",
    }),
    byFindings({
      id: "italic",
      label: "기울임꼴",
      basis: `${NOTATION.basis} 4.2`,
      statusIfFound: "fail",
      findings: findInProse({
        post,
        pattern: /(?:^|[^*\w])\*(?=[^\s*])[^*\n]*?[^\s*]\*(?![*\w])|(?:^|[^_\w])_(?=[^\s_])[^_\n]*?[^\s_]_(?![_\w])/,
      }),
      passSummary: "없습니다",
      fix: "기울임꼴을 풀고, 꼭 짚을 낱말이면 굵게(문단에 한 번)를 씁니다.",
    }),
    byFindings({
      id: "bold-per-paragraph",
      label: "문단마다 굵게 한 번 이하",
      basis: `${NOTATION.basis} 4.2`,
      statusIfFound: "fail",
      findings: document.lines
        .filter(isProse)
        .flatMap((line) => {
          const count = (line.text.match(/\*\*(?=\S)[^*]*?\S\*\*|__(?=\S)[^_]*?\S__/g) ?? []).length;

          return count > 1 ? [{ line: line.line, message: `굵게 ${count}번` }] : [];
        }),
      passSummary: "없습니다",
      fix: "핵심 낱말 하나만 굵게 둡니다.",
    }),
    byFindings({
      id: "hard-line-break",
      label: "문단 안 손 줄바꿈",
      basis: `${NOTATION.basis} 4.4`,
      statusIfFound: "warn",
      findings: document.lines.flatMap((line, index) =>
        line.kind === "text" && document.lines[index - 1]?.kind === "text" ? [{ line: line.line, message: "앞 줄과 같은 문단입니다" }] : [],
      ),
      passSummary: "문단마다 한 줄입니다",
      fix: "문단 하나는 한 줄로 씁니다. 다른 문단이면 빈 줄을 둡니다.",
    }),
    byFindings({
      id: "number-comma",
      label: "큰 수의 쉼표",
      basis: `${NOTATION.basis} 4.1`,
      statusIfFound: "warn",
      findings: findInProse({ post, pattern: new RegExp(`(?<![\\d,.])\\d{4,}(?=${NOTATION.counterWords.join("|")})`) }),
      passSummary: "없습니다",
      fix: "세 자리마다 쉼표를 찍습니다(예: 3,000자).",
    }),
  );

  results.push(
    byFindings({
      id: "multiple-tildes",
      label: "본문 한 줄의 물결표 두 개 이상",
      basis: MULTIPLE_TILDES.basis,
      statusIfFound: "fail",
      // parseMdx가 코드 칸·인라인 코드·태그·주소를 가린 본문 줄만 봅니다. 제목·요약은 넣지 않습니다.
      findings: document.lines.filter(isProse).flatMap((line) => {
        const indexes = unescapedTildeIndexes(line.text);
        return indexes.length >= MULTIPLE_TILDES.minCount
          ? [{ line: line.line, message: `물결표 ${indexes.length}개: ${excerpt({ text: line.text, index: indexes[0] ?? 0 })}` }]
          : [];
      }),
      passSummary: "없습니다",
      fix: "이스타가 범위 표기 규칙을 정한 뒤 고칩니다. 코드의 물결표는 백틱으로 감쌉니다.",
    }),
  );

  // 그림 (6장, 표 설명은 3장)
  results.push(
    byFindings({
      id: "image-alt",
      label: "그림 alt",
      basis: FIGURE.basis,
      statusIfFound: "fail",
      findings: document.images.flatMap((image) => {
        if (image.alt === undefined) return [{ line: image.line, message: `${image.src}: alt가 없습니다` }];

        const prefix = FIGURE.bannedAltPrefixes.find((word) => image.alt?.trim().startsWith(word));

        return prefix ? [{ line: image.line, message: `${image.src}: alt가 「${prefix}」 같은 말로 시작합니다` }] : [];
      }),
      passSummary: `그림 ${document.images.length}개`,
      fix: "그림이 전하는 내용을 한 문장으로 씁니다. 「스크린샷」, 「그림」으로 시작하지 않습니다.",
    }),
    byFindings({
      id: "image-alt-empty",
      label: "빈 alt (꾸밈 그림)",
      basis: FIGURE.basis,
      statusIfFound: "warn",
      findings: document.images.filter((image) => image.alt?.trim() === "").map((image) => ({ line: image.line, message: `${image.src}: alt가 비어 있습니다` })),
      passSummary: "없습니다",
      fix: "꾸밈 그림이 아니면 alt를 씁니다. 이 블로그는 꾸밈 그림을 거의 쓰지 않습니다.",
    }),
  );

  const captionFindings = [
    ...document.figures.flatMap((figure) =>
      figure.caption && FIGURE.captionPattern.test(figure.caption)
        ? []
        : [{ line: figure.line, message: figure.caption ? `「${figure.caption.slice(0, 20)}…」: 「그림 n.」이나 「표 n.」로 시작하지 않습니다` : "설명(caption)이 없습니다" }],
    ),
    ...document.images.filter((image) => !image.isInFigure).map((image) => ({ line: image.line, message: `${image.src}: \`<Figure caption="그림 n. …">\`로 감싸지 않았습니다` })),
  ];

  results.push(
    byFindings({
      id: "figure-caption",
      label: "그림 · 표 설명",
      basis: FIGURE.basis,
      statusIfFound: "fail",
      findings: captionFindings,
      passSummary: `설명 ${document.figures.length}개`,
      fix: "그림과 표를 `<Figure caption=\"그림 1. …\">`(표는 「표 1.」과 `captionSide=\"top\"`)으로 감쌉니다.",
    }),
  );

  const numbering = (["그림", "표"] as const).flatMap((kind) => {
    const numbered = document.figures.flatMap((figure) => {
      const match = FIGURE.captionPattern.exec(figure.caption ?? "");

      return match?.[1] === kind ? [{ line: figure.line, number: Number(match[2]) }] : [];
    });

    return numbered.flatMap((figure, index) => (figure.number === index + 1 ? [] : [{ line: figure.line, message: `${kind} ${figure.number}. 자리에 ${kind} ${index + 1}.이 와야 합니다` }]));
  });
  const tableSide = document.figures
    .filter((figure) => figure.caption?.startsWith("표 ") && figure.captionSide !== "top")
    .map((figure) => ({ line: figure.line, message: '표 설명에 captionSide="top"이 없습니다' }));

  results.push(
    byFindings({
      id: "figure-numbering",
      label: "그림 · 표 번호와 자리",
      basis: `${CONTENT_GUIDE} 3장, 6.1`,
      statusIfFound: "warn",
      findings: [...numbering, ...tableSide],
      passSummary: "1부터 차례대로입니다",
      fix: "그림과 표를 각각 1부터 차례로 번호를 붙이고, 표 설명은 위(`captionSide=\"top\"`)에 둡니다.",
    }),
  );

  // 〔이스타 확인〕 표시 (12장)
  const markers = findReviewMarkers({ source: post.source, fromLine: post.bodyStartLine });

  results.push(
    byFindings({
      id: "review-marker",
      label: "〔이스타 확인〕 표시",
      basis: REVIEW_MARKER_BASIS,
      statusIfFound: meta.draft ? "warn" : "fail",
      findings: markers.map((marker) => ({ line: marker.line, message: marker.text })),
      passSummary: "없습니다",
      failSummary: `${markers.length}개${meta.draft ? " (초안이라 경고, 초안을 풀면 실패)" : ""}`,
      fix: "이스타에게 물어 답으로 바꾸거나 문장을 지웁니다. 모델이 답을 지어 채우지 않습니다.",
    }),
  );

  // 링크 (10.5)
  const internalLinks = document.links.map((link) => ({ ...link, path: toSitePath(link.href) }));
  const brokenLinks: Finding[] = [];
  const slashLinks: Finding[] = [];
  const draftLinks: Finding[] = [];

  internalLinks.forEach((link) => {
    if (link.path.startsWith("#")) {
      const id = safeDecode(link.path.slice(1));

      if (!document.headings.some((heading) => heading.id === id)) brokenLinks.push({ line: link.line, message: `${link.href}: 이 글에 없는 제목입니다` });
      return;
    }

    const match = POST_LINK_PATTERN.exec(link.path);

    if (!match) return;

    const [, targetSlug = "", anchor] = match;
    const target = postsBySlug.get(targetSlug);

    if (!target) {
      brokenLinks.push({ line: link.line, message: `${link.href}: 없는 글입니다` });
      return;
    }

    if (anchor !== undefined && !target.document.headings.some((heading) => heading.id === safeDecode(anchor))) {
      brokenLinks.push({ line: link.line, message: `${link.href}: 그 글에 없는 제목입니다` });
    }

    if (!link.path.startsWith(`/posts/${targetSlug}/`)) slashLinks.push({ line: link.line, message: `${link.href}: 주소 끝에 / 가 없습니다` });

    if (target.meta.draft && target.slug !== slug) draftLinks.push({ line: link.line, message: `${link.href}: 「${target.meta.title ?? targetSlug}」는 초안입니다` });
  });

  results.push(
    byFindings({
      id: "internal-links",
      label: "글 안 링크",
      basis: `${CONTENT_GUIDE} 10.5`,
      statusIfFound: "fail",
      findings: brokenLinks,
      passSummary: `이 블로그로 가는 링크 ${internalLinks.filter((link) => link.path.startsWith("/") || link.path.startsWith("#")).length}개`,
      fix: "글 이름(폴더 이름)과 제목 id를 확인합니다. 제목 id는 제목 글에서 문장 부호를 빼고 공백을 하이픈으로 바꾼 값입니다.",
    }),
    byFindings({
      id: "internal-link-slash",
      label: "글 주소 끝의 /",
      basis: `${CONTENT_GUIDE} 1장`,
      statusIfFound: "warn",
      findings: slashLinks,
      passSummary: "모두 / 로 끝납니다",
      fix: "`/posts/글-이름/`처럼 끝에 / 를 붙입니다(trailingSlash: always).",
    }),
    byFindings({
      id: "draft-links",
      label: "초안 글로 가는 링크",
      basis: `${CONTENT_GUIDE} 12장`,
      statusIfFound: meta.draft ? "warn" : "fail",
      findings: draftLinks,
      passSummary: "없습니다",
      failSummary: `${draftLinks.length}곳${meta.draft ? " (초안이라 경고, 이 글을 풀 때 링크한 글도 공개되어 있어야 함)" : ""}`,
      fix: "링크한 글을 먼저 게시하거나, 게시할 때까지 링크를 빼 둡니다.",
    }),
    byFindings({
      id: "link-text",
      label: "링크 글",
      basis: `${CONTENT_GUIDE} 10.5`,
      statusIfFound: "fail",
      findings: document.links
        .filter((link) => {
          const text = link.text.replace(/`/g, "").trim();

          return text === "" || VAGUE_LINK_TEXTS.includes(text);
        })
        .map((link) => ({ line: link.line, message: `「${link.text}」 → ${link.href}` })),
      passSummary: `링크 ${document.links.length}개`,
      fix: "링크 글에 갈 곳을 씁니다(「여기」 대신 「MDN의 content-visibility 문서」).",
    }),
    byFindings({
      id: "external-source",
      label: "출처 링크",
      basis: `${CONTENT_GUIDE} 10.3`,
      statusIfFound: "warn",
      findings: document.links.some((link) => /^https?:\/\//.test(link.href) && !link.href.startsWith(SITE.url))
        ? []
        : [{ message: "바깥 출처 링크가 없습니다" }],
      passSummary: `바깥 링크 ${document.links.filter((link) => /^https?:\/\//.test(link.href) && !link.href.startsWith(SITE.url)).length}개`,
      fix: "숫자와 동작의 출처(공식 문서, 측정 기록)를 본문에 겁니다.",
    }),
  );

  // 시리즈 (8.2)
  const series = meta.series;

  if (series) {
    const group = posts.filter((other) => other.meta.series?.name === series.name);
    const orders = group.map((other) => other.meta.series?.order ?? 0).sort((a, b) => a - b);
    const published = group.filter((other) => !other.meta.draft).map((other) => other.meta.series?.order ?? 0).sort((a, b) => a - b);
    const findings: Finding[] = [];
    const duplicates = orders.filter((order, index) => orders.indexOf(order) !== index);

    if (duplicates.length > 0) findings.push({ line: frontmatterLines.series, message: `번호 ${[...new Set(duplicates)].join(", ")}이 겹칩니다` });
    if (orders.some((order, index) => order !== index + 1) && duplicates.length === 0) {
      findings.push({ line: frontmatterLines.series, message: `번호가 1부터 빈 번호 없이 이어지지 않습니다 (${orders.join(", ")})` });
    }
    if (!meta.draft && published.some((order, index) => order !== index + 1)) {
      findings.push({ line: frontmatterLines.series, message: `게시된 글의 번호에 빈 번호가 있습니다 (게시 ${published.join(", ")}편)` });
    }

    results.push(
      byFindings({
        id: "series-order",
        label: "시리즈 번호",
        basis: `${CONTENT_GUIDE} 8.2`,
        statusIfFound: "fail",
        findings,
        passSummary: `「${series.name}」 ${series.order}편 (모두 ${group.length}편, 게시 ${published.length}편)`,
        fix: "`order`를 1부터 빈 번호 없이 씁니다. 앞 번호 글이 초안이면 먼저 게시합니다.",
      }),
    );
  }

  // 개인 정보 (11장)
  const privateInfo = findPrivateInfo({ text: post.source, allowedEmails });

  results.push(
    byFindings({
      id: "private-info",
      label: "개인 정보와 비밀값",
      basis: `${CONTENT_GUIDE} 11장`,
      statusIfFound: "fail",
      findings: privateInfo.map((match) => ({ line: match.line, message: `${PRIVATE_INFO_LABELS[match.kind]} ${match.masked}` })),
      passSummary: "없습니다",
      fix: "지웁니다. 키나 토큰이었다면 지우는 것만으로는 부족하니 새로 발급하고 기록에서도 지웁니다(11장).",
    }),
  );

  return results;
};

interface WritingStyleOutput {
  /** check.sh가 찾은 줄(「줄번호: 내용」) */
  lines?: string[];
  /** 검사를 돌리지 못한 까닭 */
  error?: string;
}

/** writing-style 검사(check.sh)의 출력을 결과 하나로 바꿉니다 */
export const toWritingStyleResult = ({ lines = [], error }: WritingStyleOutput) => {
  if (error) {
    const result: CheckResult = {
      id: "writing-style",
      label: "금지 표현 (writing-style)",
      status: "warn",
      summary: "검사를 돌리지 못했습니다",
      findings: [{ message: error }],
      basis: ".claude/skills/writing-style",
      fix: "`bash .claude/skills/writing-style/check.sh <글 파일>`을 직접 돌려 봅니다.",
    };

    return result;
  }

  return byFindings({
    id: "writing-style",
    label: "금지 표현 (writing-style)",
    basis: `${CONTENT_GUIDE} 머리말, .claude/skills/writing-style`,
    statusIfFound: "fail",
    findings: lines.map((line) => {
      const match = /^(\d+): (.*)$/.exec(line);

      return match ? { line: Number(match[1]), message: excerpt({ text: match[2] ?? "", index: 0 }) } : { message: line };
    }),
    passSummary: "check.sh 출력 없음",
    fix: ".claude/skills/writing-style/SKILL.md의 금지 목록을 보고 문장을 고칩니다.",
  });
};

export default checkSource;
