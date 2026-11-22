// 글(MDX)에서 사실 대조할 주장 후보를 정규식으로 뽑는 순수 함수들입니다. 숫자가 없는 동작 설명과 비교는 뽑지 못하므로 검사 에이전트가 글을 읽고 더합니다.
import { createHash } from "node:crypto";

export type ClaimKind = "number" | "version" | "date" | "ref" | "code" | "codeBlock" | "link" | "marker";

/** claims.json의 `counts`와 표준 출력에 쓰는 종류 차례 */
export const CLAIM_KINDS: readonly ClaimKind[] = [
  "number",
  "version",
  "date",
  "ref",
  "code",
  "codeBlock",
  "link",
  "marker",
];

export interface Claim {
  /** 글에 처음 나온 차례로 C1부터 */
  id: string;
  kind: ClaimKind;
  /** 후보의 글자. 같은 kind와 text는 한 건으로 묶음(codeBlock은 칸마다 한 건) */
  text: string;
  /** 나온 줄 번호(글 파일 기준, 1부터) */
  lines: number[];
  /** 가장 가까운 위쪽 h2. h2 앞이면 「첫 문단」, 앞머리면 「앞머리」 */
  section: string;
  /** 본문에서 처음 나온 줄의 그 후보가 든 문장. 본문에 없으면 앞머리의 값 */
  sentence: string;
  /** link: 링크 글 */
  linkText?: string;
  /** codeBlock: 언어 표시 */
  lang?: string;
  /** codeBlock: `title="…"` 값 */
  title?: string;
  /** codeBlock: 칸 안의 줄 수 */
  lineCount?: number;
}

export interface ClaimsFile {
  post: { slug: string; file: string; sha256: string; lines: number };
  generatedAt: string;
  counts: Record<ClaimKind, number>;
  claims: Claim[];
  notes: string[];
}

export const CLAIMS_NOTES = [
  "정규식으로 뽑은 후보입니다. 숫자가 없는 동작 설명, 비교, 차례(「처음」, 「~부터」, 「~만」)는 들어 있지 않습니다. 글을 처음부터 끝까지 읽고 M 번호로 더하세요.",
  "코드 칸 안의 글자, import 줄, 앞머리의 title과 description 밖의 칸, 내부 링크(/posts/…)에서는 뽑지 않았습니다.",
  "주장이 아닌 후보(예로 든 숫자, 순서 번호)도 번호를 버리지 말고 「대조 안 함」 표에 까닭과 함께 적으세요.",
];

interface Candidate {
  kind: ClaimKind;
  text: string;
  line: number;
  column: number;
  section: string;
  sentence: string;
  isFrontmatter: boolean;
  extra?: Pick<Claim, "linkText" | "lang" | "title" | "lineCount">;
}

interface ScanContext {
  line: number;
  section: string;
  isFrontmatter: boolean;
  /** 표의 줄처럼 문장으로 나누지 않고 통째로 문장으로 쓸 때 */
  wholeSentence?: string;
}

const NUMBER = String.raw`\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?`;
const ASCII_UNITS = ["ms", "fps", "rem", "px", "em", "vh", "vw", "Hz", "KB", "kB", "MB", "GB", "TB", "B", "s", "x"];
const KOREAN_UNITS = [
  "개월",
  "번째",
  "글자",
  "프레임",
  "시간",
  "묶음",
  "단계",
  "가지",
  "배",
  "개",
  "건",
  "번",
  "행",
  "줄",
  "초",
  "분",
  "일",
  "주",
  "달",
  "년",
  "명",
  "회",
  "자",
  "칸",
];
const UNIT = String.raw`(?:(?:${ASCII_UNITS.join("|")})(?![A-Za-z])|%|×|${KOREAN_UNITS.join("|")})`;

/** 숫자와 단위. 쉼표가 든 수, 범위(966~1,155ms), 가로세로(1200×818)를 한 덩어리로 봅니다 */
const NUMBER_PATTERN = new RegExp(
  String.raw`(?<![A-Za-z0-9_.,#/\\-])(?:${NUMBER})(?:\s*[~～–]\s*(?:${NUMBER}))?(?:\s*[×xX]\s*(?:${NUMBER}))?(?:\s?${UNIT})?(?![0-9])`,
  "gu",
);
const UNIT_AT_START = new RegExp(String.raw`^\s?${UNIT}`, "u");

/** 숫자 뒤에 오면 주장이 아닌 순서 표시(시리즈 몇 편, 문서 몇 장 몇 절)로 보는 글자. 「부」는 「0부터」와 겹쳐서 넣지 않습니다 */
const NON_CLAIM_COUNTER = /^(?:편|장|절)/u;
/** 숫자 앞에 오면 그림과 표의 번호로 보는 낱말 */
const LABEL_BEFORE = /(?:그림|표|데모|사진|예|단계)\s*$/u;

const DATE_PATTERNS = [
  /\d{4}년\s*\d{1,2}월(?:\s*\d{1,2}일)?/gu,
  /\d{4}-\d{2}-\d{2}/gu,
  /(?<![0-9])\d{1,2}월\s*\d{1,2}일/gu,
  /(?<![0-9])\d{4}년(?!\s*\d)/gu,
];

const PRODUCT = String.raw`(?:[A-Z]|i(?=OS|Pad)|mac(?=OS))[A-Za-z0-9.+-]*[A-Za-z]`;
/** 제품 이름 뒤의 버전. 「~부터」 같은 꼬리는 글자에 넣습니다 */
const VERSION_PATTERN = new RegExp(
  String.raw`(?<![A-Za-z0-9])(${PRODUCT}(?:\s[A-Z][A-Za-z]+)?)\s+v?(\d+(?:\.\d+){0,3})(?![\d,]|\.\d)(부터|이상|이후|이전|까지)?`,
  "gu",
);

const COMMIT_PATTERN = /^(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}$/;
const REF_PATTERNS: { pattern: RegExp; toText: (match: RegExpExecArray) => string }[] = [
  { pattern: /(?<![A-Za-z])PR\s*#\s*(\d+)/gu, toText: (match) => `PR #${match[1]}` },
  { pattern: /(?<![A-Za-z])ADR\)?\s*#?\s*(\d+)/gu, toText: (match) => `ADR ${match[1]}` },
  { pattern: /(?<![A-Za-z0-9&])#(\d+)\b/gu, toText: (match) => `#${match[1]}` },
  {
    pattern: /(?<![A-Za-z0-9])(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}(?![A-Za-z0-9])/gu,
    toText: (match) => match[0],
  },
];

const LINK_PATTERN = /(!?)\[((?:[^\][]|\[[^\]]*\])*)\]\(((?:[^()\s]|\([^()\s]*\))+)(?:\s+"[^"]*")?\)/gu;
const AUTOLINK_PATTERN = /<(https?:\/\/[^>\s]+)>/gu;
const BARE_URL_PATTERN = /https?:\/\/[^\s)<>\]"'」]+/gu;
const INLINE_CODE_PATTERN = /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/gu;
const MARKER_PATTERN = /〔[^〕]*〕/gu;
const JSX_ATTRIBUTE_PATTERN = /\b(caption|alt)=(?:"([^"]*)"|'([^']*)'|\{"([^"]*)"\}|\{`([^`]*)`\})/gu;
const HREF_PATTERN = /\bhref=(?:"(https?:\/\/[^"]+)"|'(https?:\/\/[^']+)')/gu;
const FENCE_PATTERN = /^\s*(`{3,}|~{3,})(.*)$/u;

/** 글자 그대로의 sha256(16진수) */
export const sha256Text = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

/** 문장에서 링크 주소와 이미지 주소를 빼고 링크 글만 남깁니다 */
const toPlainSentence = (text: string) =>
  text
    .replace(LINK_PATTERN, (_, _bang: string, label: string) => label)
    .replace(/\s+/gu, " ")
    .trim();

/** `index`가 든 문장을 돌려줍니다. 마침표, 물음표, 느낌표 뒤의 공백에서 문장을 나눕니다 */
export const findSentence = ({ text, index }: { text: string; index: number }) => {
  const boundaries = [0];
  const pattern = /[.?!]+["'」』)]*\s+/gu;

  for (const match of text.matchAll(pattern)) {
    boundaries.push((match.index ?? 0) + match[0].length);
  }
  boundaries.push(text.length);

  const start = [...boundaries].reverse().find((boundary) => boundary <= index) ?? 0;
  const end = boundaries.find((boundary) => boundary > index) ?? text.length;

  return toPlainSentence(text.slice(start, end));
};

const normalizeText = (text: string) => text.replace(/\s+/gu, " ").trim();

/** 한 덩어리의 글(본문 한 줄, 그림 설명, 앞머리 값)에서 후보를 뽑습니다 */
const scanText = ({ text, context }: { text: string; context: ScanContext }) => {
  const candidates: Candidate[] = [];
  // 이미 뽑은 곳은 같은 길이의 공백으로 덮어 다음 정규식이 다시 보지 않게 합니다(줄 안 위치는 그대로)
  let masked = text;
  const mask = (start: number, end: number) => {
    masked = masked.slice(0, start) + " ".repeat(Math.max(0, end - start)) + masked.slice(end);
  };
  const push = ({
    kind,
    candidateText,
    column,
    extra,
  }: {
    kind: ClaimKind;
    candidateText: string;
    column: number;
    extra?: Candidate["extra"];
  }) => {
    candidates.push({
      kind,
      text: candidateText,
      line: context.line,
      column,
      section: context.section,
      sentence: context.wholeSentence ?? findSentence({ text, index: column }),
      isFrontmatter: context.isFrontmatter,
      extra,
    });
  };

  for (const match of text.matchAll(MARKER_PATTERN)) {
    const start = match.index ?? 0;

    push({ kind: "marker", candidateText: match[0], column: start });
    mask(start, start + match[0].length);
  }

  for (const match of masked.matchAll(LINK_PATTERN)) {
    const start = match.index ?? 0;
    const [whole, bang, label, url] = match;
    const labelStart = start + bang.length + 1;
    const labelEnd = labelStart + label.length;

    if (!bang && /^https?:\/\//u.test(url)) {
      push({ kind: "link", candidateText: url, column: start, extra: { linkText: toPlainSentence(label) } });
    }
    // 링크 글과 이미지 alt는 남겨 그 안의 숫자와 코드를 뽑고, 주소 부분만 덮습니다
    mask(start, labelStart);
    mask(labelEnd, start + whole.length);
  }

  for (const match of masked.matchAll(AUTOLINK_PATTERN)) {
    const start = match.index ?? 0;

    push({ kind: "link", candidateText: match[1], column: start });
    mask(start, start + match[0].length);
  }

  for (const match of masked.matchAll(BARE_URL_PATTERN)) {
    const start = match.index ?? 0;

    push({ kind: "link", candidateText: match[0], column: start });
    mask(start, start + match[0].length);
  }

  for (const match of masked.matchAll(INLINE_CODE_PATTERN)) {
    const start = match.index ?? 0;
    const code = normalizeText(match[2]);

    if (code !== "") {
      push({ kind: COMMIT_PATTERN.test(code) ? "ref" : "code", candidateText: code, column: start });
    }
    mask(start, start + match[0].length);
  }

  for (const pattern of DATE_PATTERNS) {
    for (const match of masked.matchAll(pattern)) {
      const start = match.index ?? 0;

      push({ kind: "date", candidateText: normalizeText(match[0]), column: start });
      mask(start, start + match[0].length);
    }
  }

  for (const { pattern, toText } of REF_PATTERNS) {
    for (const match of masked.matchAll(pattern)) {
      const start = match.index ?? 0;

      push({ kind: "ref", candidateText: toText(match), column: start });
      mask(start, start + match[0].length);
    }
  }

  for (const match of masked.matchAll(VERSION_PATTERN)) {
    const start = match.index ?? 0;
    const after = masked.slice(start + match[0].length);

    // 「CPU 4배」처럼 뒤에 단위가 붙으면 버전이 아니라 숫자입니다
    if (!match[3] && UNIT_AT_START.test(after)) continue;

    push({ kind: "version", candidateText: `${match[1]} ${match[2]}${match[3] ?? ""}`, column: start });
    mask(start, start + match[0].length);
  }

  for (const match of masked.matchAll(NUMBER_PATTERN)) {
    const start = match.index ?? 0;
    const value = match[0].trimEnd();
    const after = masked.slice(start + value.length);
    const hasUnit = new RegExp(String.raw`${UNIT}$`, "u").test(value);

    if (LABEL_BEFORE.test(masked.slice(0, start))) continue;
    if (!hasUnit && (NON_CLAIM_COUNTER.test(after) || /^[A-Za-z]/u.test(after))) continue;

    push({ kind: "number", candidateText: normalizeText(value).replace(/\s*([~～–×])\s*/gu, "$1"), column: start });
  }

  return candidates;
};

const parseFenceMeta = (meta: string) => {
  const trimmed = meta.trim();
  const titleMatch = /title=(?:"([^"]*)"|'([^']*)'|(\S+))/u.exec(trimmed);
  const firstToken = trimmed.split(/\s+/u)[0] ?? "";
  const lang = firstToken && !firstToken.includes("=") && !firstToken.startsWith("{") ? firstToken : undefined;

  return { lang, title: titleMatch ? (titleMatch[1] ?? titleMatch[2] ?? titleMatch[3]) : undefined };
};

const readFrontmatterValue = (raw: string) => {
  const value = raw.trim();

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
};

/** 글 전체에서 후보를 글에 나온 차례로 모읍니다(묶기 전) */
export const collectCandidates = (source: string) => {
  const lines = source.split(/\r?\n/u);
  const candidates: Candidate[] = [];
  let index = 0;

  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((line, lineIndex) => lineIndex > 0 && line.trim() === "---");

    for (let lineIndex = 1; lineIndex < (end === -1 ? lines.length : end); lineIndex += 1) {
      const match = /^(title|description):\s*(.*)$/u.exec(lines[lineIndex]);

      if (match) {
        const value = readFrontmatterValue(match[2]);

        candidates.push(
          ...scanText({
            text: value,
            context: { line: lineIndex + 1, section: "앞머리", isFrontmatter: true, wholeSentence: value },
          }),
        );
      }
    }
    index = end === -1 ? lines.length : end + 1;
  }

  let section = "첫 문단";
  let fence: { marker: string; line: number; lang?: string; title?: string; count: number } | null = null;

  for (; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;
    const trimmed = line.trim();
    const fenceMatch = FENCE_PATTERN.exec(line);

    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence.marker[0] && fenceMatch[1].length >= fence.marker.length && fenceMatch[2].trim() === "") {
        candidates.push({
          kind: "codeBlock",
          text: fence.title ?? fence.lang ?? "코드 칸",
          line: fence.line,
          column: 0,
          section,
          sentence: lines[fence.line - 1].trim(),
          isFrontmatter: false,
          extra: { lang: fence.lang, title: fence.title, lineCount: fence.count },
        });
        fence = null;
      } else {
        fence.count += 1;
      }
      continue;
    }

    if (fenceMatch) {
      fence = { marker: fenceMatch[1], line: lineNumber, ...parseFenceMeta(fenceMatch[2]), count: 0 };
      continue;
    }

    if (trimmed === "" || /^(?:import|export)\s/u.test(trimmed) || trimmed.startsWith("{/*")) continue;

    const headingMatch = /^(#{1,6})\s+(.*?)\s*#*\s*$/u.exec(line);

    if (headingMatch) {
      if (headingMatch[1].length === 2) section = toPlainSentence(headingMatch[2]);
      candidates.push(
        ...scanText({
          text: headingMatch[2],
          context: { line: lineNumber, section, isFrontmatter: false, wholeSentence: toPlainSentence(headingMatch[2]) },
        }),
      );
      continue;
    }

    const isJsxLine =
      (trimmed.startsWith("<") && !trimmed.startsWith("<http")) ||
      trimmed === ">" ||
      trimmed.startsWith("/>") ||
      /^[A-Za-z:-]+=/u.test(trimmed);

    if (isJsxLine) {
      for (const match of line.matchAll(JSX_ATTRIBUTE_PATTERN)) {
        const value = match[2] ?? match[3] ?? match[4] ?? match[5] ?? "";

        candidates.push(
          ...scanText({ text: value, context: { line: lineNumber, section, isFrontmatter: false } }).map((candidate) => ({
            ...candidate,
            column: (match.index ?? 0) + candidate.column,
          })),
        );
      }
      for (const match of line.matchAll(HREF_PATTERN)) {
        candidates.push({
          kind: "link",
          text: match[1] ?? match[2],
          line: lineNumber,
          column: match.index ?? 0,
          section,
          sentence: toPlainSentence(trimmed),
          isFrontmatter: false,
        });
      }
      continue;
    }

    if (trimmed.startsWith("|")) {
      if (/^\|?[\s:|-]+\|?$/u.test(trimmed)) continue;

      const row = trimmed
        .replace(/^\||\|$/gu, "")
        .split("|")
        .map((cell) => cell.trim())
        .join(" | ");

      candidates.push(
        ...scanText({
          text: line,
          context: { line: lineNumber, section, isFrontmatter: false, wholeSentence: toPlainSentence(row) },
        }),
      );
      continue;
    }

    // 목록 표시(-, 1.)와 인용 표시(>)는 숫자로 뽑지 않게 같은 길이의 공백으로 바꿉니다
    const body = line.replace(/^(\s*(?:>\s*)*)((?:[-*+]|\d+[.)])\s+)?/u, (whole) => " ".repeat(whole.length));

    candidates.push(...scanText({ text: body, context: { line: lineNumber, section, isFrontmatter: false } }));
  }

  return candidates.sort((a, b) => a.line - b.line || a.column - b.column);
};

/** 같은 kind와 text의 후보를 한 건으로 묶고 C1부터 번호를 붙입니다 */
export const groupCandidates = (candidates: Candidate[]) => {
  const groups = new Map<string, { first: Candidate; firstBody?: Candidate; lines: Set<number> }>();

  for (const candidate of candidates) {
    const key =
      candidate.kind === "codeBlock" ? `codeBlock\u0000${candidate.line}` : `${candidate.kind}\u0000${candidate.text}`;
    const group = groups.get(key);

    if (group) {
      group.lines.add(candidate.line);
      if (!group.firstBody && !candidate.isFrontmatter) group.firstBody = candidate;
    } else {
      groups.set(key, {
        first: candidate,
        firstBody: candidate.isFrontmatter ? undefined : candidate,
        lines: new Set([candidate.line]),
      });
    }
  }

  return [...groups.values()].map(({ first, firstBody, lines }, index) => {
    const shown = firstBody ?? first;
    const claim: Claim = {
      id: `C${index + 1}`,
      kind: first.kind,
      text: first.text,
      lines: [...lines].sort((a, b) => a - b),
      section: shown.section,
      sentence: shown.sentence,
      ...first.extra,
    };

    return claim;
  });
};

/** 글에서 주장 후보를 뽑아 번호를 붙입니다 */
export const extractClaims = (source: string) => groupCandidates(collectCandidates(source));

/** 종류마다 뽑은 개수 */
export const countClaims = (claims: Claim[]) =>
  Object.fromEntries(CLAIM_KINDS.map((kind) => [kind, claims.filter((claim) => claim.kind === kind).length])) as Record<
    ClaimKind,
    number
  >;

interface CreateClaimsFileParams {
  source: string;
  slug: string;
  file: string;
  generatedAt: string;
}

/** claims.json에 쓸 내용을 만듭니다 */
export const createClaimsFile = ({ source, slug, file, generatedAt }: CreateClaimsFileParams) => {
  const claims = extractClaims(source);
  const claimsFile: ClaimsFile = {
    post: { slug, file, sha256: sha256Text(source), lines: source.split(/\r?\n/u).length - (source.endsWith("\n") ? 1 : 0) },
    generatedAt,
    counts: countClaims(claims),
    claims,
    notes: CLAIMS_NOTES,
  };

  return claimsFile;
};
