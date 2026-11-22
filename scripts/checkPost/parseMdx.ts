// 글 본문(MDX)을 줄 단위로 읽어 점검에 쓰는 조각(코드 칸, 제목, 태그, 링크, 그림, 문장 줄)으로 나누는 순수 함수입니다.
// MDX 처리기 전체를 돌리지 않고, 정본(docs/content-guide.md)이 쓰는 꼴만 읽습니다.
// 코드 칸, 인라인 코드, import · export 줄, `{/* */}` 주석은 같은 길이의 공백으로 가려서 위치(줄 번호)를 그대로 둡니다.
import createHeadingSlugger, { toHeadingText } from "./slugifyHeading.ts";

export interface CodeBlock {
  /** 여는 ``` 줄 */
  line: number;
  lang?: string;
  /** 언어 뒤의 나머지. 예: `title="resize.ts" {3,5-6}` */
  meta: string;
  title?: string;
  /** 메타의 `{3,5-6}`이 가리키는 줄 수 */
  highlightedLineCount: number;
  /** 코드 줄. 여는 줄 바로 다음 줄이 `line + 1`입니다 */
  lines: string[];
  isClosed: boolean;
}

export interface Heading {
  line: number;
  depth: number;
  /** 화면에 보이는 제목 글 */
  text: string;
  /** 빌드가 붙이는 id */
  id: string;
}

export interface MdxTag {
  name: string;
  attrs: Record<string, string | true>;
  line: number;
  isClosing: boolean;
  isSelfClosing: boolean;
  start: number;
  end: number;
}

export interface MdxLink {
  line: number;
  text: string;
  href: string;
}

export interface MdxImage {
  line: number;
  /** alt 속성이 아예 없으면 `undefined` */
  alt?: string;
  src: string;
  isInFigure: boolean;
}

export interface MdxFigure {
  line: number;
  caption?: string;
  captionSide?: string;
}

/** 줄의 종류. 문장 중간 줄바꿈 같은 검사가 씁니다 */
export type LineKind = "blank" | "code" | "esm" | "jsx" | "heading" | "list" | "table" | "quote" | "text";

export interface ProseLine {
  line: number;
  kind: LineKind;
  /** 코드, 태그, 주소를 가린 글. 원래 길이를 지켜 공백이 섞여 있습니다 */
  text: string;
}

export interface MdxDocument {
  codeBlocks: CodeBlock[];
  headings: Heading[];
  tags: MdxTag[];
  links: MdxLink[];
  images: MdxImage[];
  figures: MdxFigure[];
  /** 본문의 모든 줄(앞머리 뒤부터). 코드 칸 줄은 `kind: "code"`에 글이 비어 있습니다 */
  lines: ProseLine[];
}

const FENCE_OPEN = /^(\s*)(`{3,}|~{3,})\s*(.*)$/;

const blank = (text: string) => text.replace(/[^\n]/g, " ");

const parseHighlightCount = (meta: string) => {
  const ranges = /\{([\d,\s-]+)\}/.exec(meta)?.[1];

  if (!ranges) return 0;

  return ranges
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((count, part) => {
      const [start = 0, end = start] = part.split("-").map(Number);

      return count + Math.max(1, end - start + 1);
    }, 0);
};

/** 코드 칸을 찾고, 코드 칸 줄을 가린 줄 목록을 함께 돌려줍니다 */
const findCodeBlocks = ({ lines, firstLine }: { lines: string[]; firstLine: number }) => {
  const codeBlocks: CodeBlock[] = [];
  const kinds: LineKind[] = lines.map(() => "text");
  let open: { block: CodeBlock; fence: string } | undefined;

  lines.forEach((line, index) => {
    if (open) {
      kinds[index] = "code";
      const close = /^\s*(`{3,}|~{3,})\s*$/.exec(line)?.[1];

      if (close && close[0] === open.fence[0] && close.length >= open.fence.length) {
        open.block.isClosed = true;
        open = undefined;
      } else {
        open.block.lines.push(line);
      }

      return;
    }

    const match = FENCE_OPEN.exec(line);

    if (!match) return;

    const [, , fence = "```", info = ""] = match;
    const [lang, ...rest] = info.trim().split(/\s+/);
    const meta = rest.join(" ");
    const block: CodeBlock = {
      line: firstLine + index,
      lang: lang || undefined,
      meta,
      title: /title=["']([^"']*)["']/.exec(meta)?.[1],
      highlightedLineCount: parseHighlightCount(meta),
      lines: [],
      isClosed: false,
    };

    kinds[index] = "code";
    codeBlocks.push(block);
    open = { block, fence };
  });

  return { codeBlocks, kinds };
};

/** import · export 줄(MDX의 ESM)을 찾습니다. 여러 줄 import는 `from "..."`이나 `;`로 끝나는 줄까지입니다 */
const markEsmLines = ({ lines, kinds }: { lines: string[]; kinds: LineKind[] }) => {
  let isInside = false;

  lines.forEach((line, index) => {
    if (kinds[index] === "code") return;

    if (!isInside && !/^(import|export)\s/.test(line)) return;

    kinds[index] = "esm";
    isInside = !(/\bfrom\s+["'][^"']+["'];?\s*$/.test(line) || /^import\s+["'][^"']+["'];?\s*$/.test(line) || /;\s*$/.test(line));
  });
};

/** `<이름 속성…>` 태그 하나를 읽습니다. 태그가 아니면 `undefined` */
const readTag = ({ text, start }: { text: string; start: number }) => {
  const head = /^<(\/?)([A-Za-z][\w.:-]*)/.exec(text.slice(start, start + 200));

  if (!head) return undefined;

  const attrs: MdxTag["attrs"] = {};
  let index = start + head[0].length;

  while (index < text.length) {
    while (/\s/.test(text[index] ?? "")) index += 1;

    if (text.startsWith("/>", index)) {
      return { name: head[2] ?? "", attrs, isClosing: head[1] === "/", isSelfClosing: true, start, end: index + 2 };
    }

    if (text[index] === ">") {
      return { name: head[2] ?? "", attrs, isClosing: head[1] === "/", isSelfClosing: false, start, end: index + 1 };
    }

    const name = /^[^\s=/>"'{}]+/.exec(text.slice(index))?.[0];

    if (!name) return undefined;

    index += name.length;

    if (text[index] !== "=") {
      attrs[name] = true;
      continue;
    }

    index += 1;
    const quote = text[index];

    if (quote === '"' || quote === "'") {
      const close = text.indexOf(quote, index + 1);

      if (close === -1) return undefined;

      attrs[name] = text.slice(index + 1, close);
      index = close + 1;
    } else if (quote === "{") {
      let depth = 0;
      let cursor = index;

      for (; cursor < text.length; cursor += 1) {
        if (text[cursor] === "{") depth += 1;
        if (text[cursor] === "}") depth -= 1;
        if (depth === 0) break;
      }

      if (depth !== 0) return undefined;

      attrs[name] = text.slice(index, cursor + 1);
      index = cursor + 1;
    } else {
      return undefined;
    }
  }

  return undefined;
};

const lineAt = ({ lineStarts, offset, firstLine }: { lineStarts: number[]; offset: number; firstLine: number }) => {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);

    if ((lineStarts[middle] ?? 0) <= offset) low = middle;
    else high = middle - 1;
  }

  return firstLine + low;
};

const classifyLine = (text: string): LineKind => {
  const trimmed = text.trim();

  if (trimmed === "") return "blank";
  if (/^#{1,6}\s/.test(trimmed)) return "heading";
  if (/^([-*+]|\d+[.)])\s/.test(trimmed)) return "list";
  if (trimmed.startsWith("|")) return "table";
  if (trimmed.startsWith(">")) return "quote";

  return "text";
};

const MARKDOWN_LINK = /(!?)\[([^\]]*)\]\(\s*<?([^()\s>]+)>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;

interface ParseMdxParams {
  /** 글 파일 전체 */
  source: string;
  /** 본문이 시작하는 줄 번호(앞머리 다음 줄) */
  bodyStartLine: number;
}

/** 글 본문을 점검에 쓰는 조각으로 나눕니다 */
const parseMdx = ({ source, bodyStartLine }: ParseMdxParams) => {
  const lines = source.split(/\r?\n/).slice(bodyStartLine - 1);
  const { codeBlocks, kinds } = findCodeBlocks({ lines, firstLine: bodyStartLine });

  markEsmLines({ lines, kinds });

  // 1. 코드 칸과 ESM 줄을 가립니다
  const original = lines.join("\n");
  let masked = lines.map((line, index) => (kinds[index] === "text" ? line : blank(line))).join("\n");

  // 2. MDX 주석과 인라인 코드를 가립니다
  masked = masked.replace(/\{\/\*[\s\S]*?\*\/\}/g, blank);
  masked = masked.replace(/(`+)(?:(?!\1)[^\n])+?\1/g, blank);

  const lineStarts = [0, ...[...masked.matchAll(/\n/g)].map((match) => (match.index ?? 0) + 1)];
  const toLine = (offset: number) => lineAt({ lineStarts, offset, firstLine: bodyStartLine });
  const links: MdxLink[] = [];
  const images: MdxImage[] = [];

  // 3. <https://…> 꼴 자동 링크를 읽고 가립니다
  masked = masked.replace(/<(https?:\/\/[^>\s]+)>/g, (match, href: string, offset: number) => {
    links.push({ line: toLine(offset), text: href, href });
    return blank(match);
  });

  // 4. 태그를 읽습니다
  const tags: MdxTag[] = [];

  for (let index = masked.indexOf("<"); index !== -1; index = masked.indexOf("<", index + 1)) {
    const tag = readTag({ text: masked, start: index });

    if (!tag) continue;

    // 위치는 가린 글로 찾고, 속성 값은 원문에서 읽습니다. 가린 인라인 코드가 그림 설명 속 백틱 글을 지우지 않게 합니다
    const exact = readTag({ text: original, start: index });

    tags.push({ ...tag, attrs: exact?.end === tag.end ? exact.attrs : tag.attrs, line: toLine(tag.start) });
    index = tag.end - 1;
  }

  // 5. 그림 묶음(Figure)의 범위를 정합니다
  const figures: MdxFigure[] = [];
  const figureRanges: { start: number; end: number }[] = [];

  tags.forEach((tag, index) => {
    if (tag.name.toLowerCase() !== "figure" || tag.isClosing) return;

    const caption = tag.attrs.caption;
    const captionSide = tag.attrs.captionSide;
    const close = tags.slice(index + 1).find((other) => other.name === tag.name && other.isClosing);

    figures.push({
      line: tag.line,
      caption: typeof caption === "string" ? caption : undefined,
      captionSide: typeof captionSide === "string" ? captionSide : undefined,
    });
    figureRanges.push({ start: tag.end, end: tag.isSelfClosing ? tag.end : (close?.start ?? masked.length) });
  });

  const isInFigure = (offset: number) => figureRanges.some((range) => offset >= range.start && offset < range.end);

  tags.forEach((tag, index) => {
    if (tag.isClosing) return;

    const name = tag.name.toLowerCase();

    if (name === "img" || name === "image" || name === "picture") {
      const alt = tag.attrs.alt;
      const src = tag.attrs.src;

      images.push({
        line: tag.line,
        alt: typeof alt === "string" ? alt : alt === true ? "" : undefined,
        src: typeof src === "string" ? src : "",
        isInFigure: isInFigure(tag.start),
      });
    }

    if (name === "a" && typeof tag.attrs.href === "string") {
      const close = tags.slice(index + 1).find((other) => other.name === tag.name && other.isClosing);
      const text = close ? original.slice(tag.end, close.start).replace(/<[^>]+>/g, "").trim() : "";

      links.push({ line: tag.line, text, href: tag.attrs.href });
    }
  });

  // 6. 태그를 가린 뒤 마크다운 그림과 링크를 읽고 가립니다. 링크 글은 문장으로 남깁니다
  tags.forEach((tag) => {
    masked = masked.slice(0, tag.start) + blank(masked.slice(tag.start, tag.end)) + masked.slice(tag.end);
  });

  masked = masked.replace(MARKDOWN_LINK, (match, bang: string, text: string, href: string, offset: number) => {
    const textStart = offset + bang.length + 1;
    const exactText = original.slice(textStart, textStart + text.length);

    if (bang) {
      images.push({ line: toLine(offset), alt: exactText, src: href, isInFigure: isInFigure(offset) });
      return blank(match);
    }

    links.push({ line: toLine(offset), text: exactText.trim(), href });
    return ` ${text}${blank(match.slice(1 + text.length))}`;
  });

  // 7. 문장 속 주소를 가립니다
  masked = masked.replace(/https?:\/\/[^\s)>\]]+/g, blank);

  const maskedLines = masked.split("\n");
  const proseLines = maskedLines.map((text, index) => {
    const kind = kinds[index] === "text" ? classifyLine(lines[index] ?? "") : (kinds[index] ?? "text");
    const isOnlyTag = kind === "text" && text.trim() === "" && (lines[index] ?? "").trim() !== "";
    const line: ProseLine = { line: bodyStartLine + index, kind: isOnlyTag ? "jsx" : kind, text };

    return line;
  });

  const slug = createHeadingSlugger();
  const headings = lines.flatMap((line, index) => {
    if (kinds[index] !== "text") return [];

    const match = /^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(line);

    if (!match) return [];

    const text = toHeadingText(match[2] ?? "");
    const heading: Heading = { line: bodyStartLine + index, depth: match[1]?.length ?? 0, text, id: slug(text) };

    return [heading];
  });

  const document: MdxDocument = { codeBlocks, headings, tags, links, images, figures, lines: proseLines };

  return document;
};

export default parseMdx;
