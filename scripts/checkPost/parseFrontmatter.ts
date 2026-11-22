// 글 파일(index.mdx)의 앞머리(frontmatter)를 읽는 순수 함수입니다.
// 바깥 YAML 패키지 없이 Node로 바로 돌도록, 정본(docs/content-guide.md 1장)의 앞머리에 쓰는 꼴만 읽습니다:
// `칸: 값`, 따옴표 글, 날짜, 참 · 거짓, 숫자, `[a, b]` 목록, 들여쓴 `- 항목` 목록, 두 칸 들여쓴 한 단계 묶음(`series`), `#` 주석.
// 그 밖의 꼴은 읽지 못한 줄로 돌려줘 점검이 실패로 알립니다. 빌드는 Astro의 YAML 처리기와 스키마가 따로 검사합니다.
import type { PostMeta } from "./types.ts";

type Scalar = string | number | boolean;
type FrontmatterValue = Scalar | Scalar[] | Record<string, Scalar | Scalar[]>;

export interface Frontmatter {
  data: Record<string, FrontmatterValue>;
  /** 본문이 시작하는 줄 번호(1부터). 앞머리가 없으면 1 */
  bodyStartLine: number;
  /** 읽지 못한 줄 */
  errors: { line: number; message: string }[];
}

const stripComment = (text: string) => {
  // 따옴표 밖의 ` #`부터 줄 끝까지가 주석입니다
  let quote: string | undefined;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quote) {
      if (char === quote) quote = undefined;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "#" && (index === 0 || /\s/.test(text[index - 1] ?? ""))) {
      return text.slice(0, index).trimEnd();
    }
  }

  return text.trimEnd();
};

const parseScalar = (raw: string) => {
  const text = raw.trim();

  if (text.startsWith('"')) {
    if (!text.endsWith('"') || text.length < 2) return undefined;

    try {
      return JSON.parse(text) as string;
    } catch {
      return undefined;
    }
  }

  if (text.startsWith("'")) {
    if (!text.endsWith("'") || text.length < 2) return undefined;

    return text.slice(1, -1).replaceAll("''", "'");
  }

  if (text === "true") return true;
  if (text === "false") return false;
  if (/^-?\d+$/.test(text)) return Number(text);

  return text;
};

const parseFlowList = (raw: string) => {
  const inner = raw.trim().slice(1, -1).trim();

  if (inner === "") return [];

  const items = inner.split(",").map(parseScalar);

  return items.every((item) => item !== undefined) ? (items as Scalar[]) : undefined;
};

const parseValue = (raw: string) => {
  const text = stripComment(raw).trim();

  if (text.startsWith("[")) return text.endsWith("]") ? parseFlowList(text) : undefined;

  return parseScalar(text);
};

const KEY_LINE = /^([A-Za-z_][\w-]*):(?:\s+(.*))?$/;

/** 글 파일 전체를 받아 앞머리를 읽습니다. 첫 줄이 `---`가 아니면 앞머리가 없는 글입니다 */
const parseFrontmatter = (source: string) => {
  const lines = source.split(/\r?\n/);
  const result: Frontmatter = { data: {}, bodyStartLine: 1, errors: [] };

  if (lines[0]?.trim() !== "---") return result;

  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");

  if (endIndex === -1) {
    result.errors.push({ line: 1, message: "앞머리를 닫는 `---` 줄이 없습니다" });
    return result;
  }

  result.bodyStartLine = endIndex + 2;

  let parentKey: string | undefined;

  for (let index = 1; index < endIndex; index += 1) {
    const lineNumber = index + 1;
    const line = lines[index] ?? "";

    if (line.trim() === "" || line.trim().startsWith("#")) continue;

    const indent = line.length - line.trimStart().length;
    const content = line.trim();

    if (indent === 0) {
      const match = KEY_LINE.exec(stripComment(content));

      if (!match) {
        result.errors.push({ line: lineNumber, message: `읽지 못한 줄: ${content}` });
        parentKey = undefined;
        continue;
      }

      const [, key = "", rawValue = ""] = match;

      if (rawValue.trim() === "") {
        parentKey = key;
        result.data[key] = {};
        continue;
      }

      const value = parseValue(rawValue);

      parentKey = undefined;

      if (value === undefined) {
        result.errors.push({ line: lineNumber, message: `값을 읽지 못했습니다: ${content}` });
      } else {
        result.data[key] = value;
      }

      continue;
    }

    if (!parentKey) {
      result.errors.push({ line: lineNumber, message: `들여쓴 줄 앞에 묶는 칸이 없습니다: ${content}` });
      continue;
    }

    const parent = result.data[parentKey];

    if (content.startsWith("- ")) {
      const item = parseScalar(stripComment(content.slice(2)));
      const list = Array.isArray(parent) ? parent : [];

      if (item === undefined || (!Array.isArray(parent) && Object.keys(parent as object).length > 0)) {
        result.errors.push({ line: lineNumber, message: `읽지 못한 목록 항목: ${content}` });
        continue;
      }

      result.data[parentKey] = [...list, item];
      continue;
    }

    const match = KEY_LINE.exec(stripComment(content));
    const value = match?.[2] === undefined ? undefined : parseValue(match[2]);

    if (!match || value === undefined || Array.isArray(parent) || typeof parent !== "object") {
      result.errors.push({ line: lineNumber, message: `읽지 못한 줄: ${content}` });
      continue;
    }

    result.data[parentKey] = { ...parent, [match[1] ?? ""]: value as Scalar | Scalar[] };
  }

  return result;
};

const asString = (value: FrontmatterValue | undefined) =>
  typeof value === "string" || typeof value === "number" ? String(value) : undefined;

/** 앞머리 값에서 점검에 쓰는 칸만 골라 `PostMeta` 모양으로 바꿉니다 */
export const toPostMeta = (data: Frontmatter["data"]) => {
  const series = data.series;
  const projects = data.projects;
  const meta: PostMeta = {
    title: asString(data.title),
    description: asString(data.description),
    publishedAt: asString(data.publishedAt),
    updatedAt: asString(data.updatedAt),
    category: asString(data.category),
    series:
      series && typeof series === "object" && !Array.isArray(series) && typeof series.name === "string" && typeof series.order === "number"
        ? { name: series.name, order: series.order }
        : undefined,
    projects: Array.isArray(projects) ? projects.map(String) : undefined,
    draft: data.draft === true,
  };

  return meta;
};

export default parseFrontmatter;
