// 검사 에이전트가 쓴 대조표(fact-check.md)의 형식과 인용을 검사하는 순수 함수들입니다. 판정이 맞는지는 보지 않고, 근거가 있는지와 인용이 출처에 실제로 있는지를 봅니다.
import { outsideFences, splitCells } from "../postWork/markdown.ts";
import type { ClaimsFile } from "./extractClaims.ts";

/** 판정 여섯 가지. 「대조 안 함」은 대조표가 아니라 「대조 안 함」 표에 적습니다 */
export const VERDICTS = ["맞음", "일부 맞음", "다름", "출처에 없음", "못 엶", "대조 안 함"] as const;

export type Verdict = (typeof VERDICTS)[number];

/** 대조표(맨 앞 표)에 적을 수 있는 판정 */
const TABLE_VERDICTS: readonly Verdict[] = ["맞음", "일부 맞음", "다름", "출처에 없음", "못 엶"];

/** 근거 칸이 시작해야 하는 접두어 */
export const EVIDENCE_PREFIXES = ["인용:", "계산:", "명령:"] as const;

export const SECTION_TITLES = {
  table: "대조표",
  details: "다름과 일부 맞음",
  notFound: "출처에 없음",
  unopened: "못 엶",
  skipped: "대조 안 함",
} as const;

export interface TableRow {
  /** 대조표 파일의 줄 번호 */
  line: number;
  /** 머리 칸 이름 → 값 */
  cells: Record<string, string>;
}

interface Table {
  line: number;
  headers: string[];
  rows: TableRow[];
}

interface DetailSection {
  line: number;
  ids: string[];
  body: { line: number; text: string }[];
}

interface HeaderLine {
  line: number;
  value: string;
}

export interface ParsedReport {
  header: {
    post?: HeaderLine & { sha256?: string };
    date?: HeaderLine;
    sources?: HeaderLine;
    counts?: HeaderLine & { total?: number; byVerdict: Partial<Record<Verdict, number>> };
  };
  sections: Record<string, { line: number; table?: Table; details: DetailSection[] }>;
}

export interface Problem {
  line: number;
  message: string;
}

const CLAIM_ID_PATTERN = /\b[CM]\d+\b/gu;

/** 표의 한 줄을 칸으로 나눕니다. 인라인 코드 안과 `\|`의 막대는 칸을 나누지 않습니다 */
export const splitTableRow = splitCells;

const stripEmphasis = (value: string) => value.replace(/\*\*/gu, "").trim();

/** 칸 글에서 주장 번호(C1, M2)를 모두 뽑습니다. 「C3, C17」처럼 묶은 줄도 받습니다 */
export const readClaimIds = (value: string) => [...new Set(value.match(CLAIM_ID_PATTERN) ?? [])];

const parseCounts = (value: string) => {
  const total = /주장\s*(\d+)\s*건/u.exec(value);
  const byVerdict: Partial<Record<Verdict, number>> = {};
  const list = value.replace(/^.*?건\s*:?/u, "");

  for (const part of list.split(/[,，]/u)) {
    const match = /^\s*(.+?)\s*(\d+)\s*건?\s*$/u.exec(part);
    const name = match?.[1].trim() as Verdict | undefined;

    if (match && name && VERDICTS.includes(name)) byVerdict[name] = Number(match[2]);
  }

  return { total: total ? Number(total[1]) : undefined, byVerdict };
};

/** 대조표 파일을 머리 줄, 절(## 제목), 절마다 첫 표와 ### 자세한 절로 나눕니다 */
export const parseReport = (text: string) => {
  const lines = outsideFences(text).split(/\r?\n/u);
  const report: ParsedReport = { header: {}, sections: {} };
  let sectionTitle: string | null = null;
  let detail: DetailSection | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;
    const trimmed = line.trim();
    const h2 = /^##\s+(.+?)\s*$/u.exec(line);
    const h3 = /^###\s+(.+?)\s*$/u.exec(line);

    if (h2) {
      sectionTitle = h2[1];
      report.sections[sectionTitle] ??= { line: lineNumber, details: [] };
      detail = null;
      continue;
    }

    if (h3 && sectionTitle) {
      detail = { line: lineNumber, ids: readClaimIds(h3[1]), body: [] };
      report.sections[sectionTitle].details.push(detail);
      continue;
    }

    if (!sectionTitle) {
      const headerMatch = /^\s*[-*]\s*(글|대조한 날|자료 목록|주장\s*\d+\s*건)\s*:?\s*(.*)$/u.exec(line);

      if (headerMatch) {
        const [, name, rest] = headerMatch;

        if (name === "글") {
          report.header.post = { line: lineNumber, value: rest, sha256: /sha256\s*:?\s*([0-9a-f]{64})/iu.exec(rest)?.[1]?.toLowerCase() };
        } else if (name === "대조한 날") {
          report.header.date = { line: lineNumber, value: rest.trim() };
        } else if (name === "자료 목록") {
          report.header.sources = { line: lineNumber, value: rest.trim() };
        } else {
          report.header.counts = { line: lineNumber, value: trimmed, ...parseCounts(trimmed) };
        }
      }
      continue;
    }

    if (detail) {
      if (trimmed !== "") detail.body.push({ line: lineNumber, text: trimmed });
      continue;
    }

    const section = report.sections[sectionTitle];

    if (trimmed.startsWith("|") && !section.table) {
      const headers = splitTableRow(trimmed).map(stripEmphasis);
      const table: Table = { line: lineNumber, headers, rows: [] };
      let rowIndex = index + 1;

      if (/^\|?[\s:|-]+\|?$/u.test(lines[rowIndex]?.trim() ?? "")) rowIndex += 1;

      for (; rowIndex < lines.length && lines[rowIndex].trim().startsWith("|"); rowIndex += 1) {
        const values = splitTableRow(lines[rowIndex].trim());

        table.rows.push({
          line: rowIndex + 1,
          cells: Object.fromEntries(headers.map((header, cellIndex) => [header, values[cellIndex] ?? ""])),
        });
      }
      section.table = table;
      index = rowIndex - 1;
    }
  }

  return report;
};

const codePoint = (code: number) => Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
const decodeEntities = (text: string) =>
  text
    .replace(/&nbsp;/giu, " ")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/&#(\d+);/gu, (_, code: string) => codePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/giu, (_, code: string) => codePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/giu, "&");

/** 인용을 견주려고 글을 고릅니다. 마크다운 링크는 링크 글만, 백틱과 굵게 표시는 빼고, 공백은 하나로 줄입니다 */
export const normalizeForMatch = (text: string) =>
  text
    .normalize("NFC")
    .replace(/!?\[((?:[^\][]|\[[^\]]*\])*)\]\([^)]*\)/gu, "$1")
    .replace(/[`*]/gu, "")
    .replace(/[\s ​]+/gu, " ")
    .trim();

/**
 * 출처 파일의 글을 견줄 꼴들로 바꿉니다. HTML은 script와 style을 지우고 태그를 벗기며,
 * 태그 자리를 공백으로 둔 꼴과 빈칸 없이 붙인 꼴을 둘 다 만듭니다(`<b>966</b>ms`도 「966ms」로 찾게)
 */
export const toSearchableTexts = ({ text, isHtml }: { text: string; isHtml: boolean }) => {
  if (!isHtml) return [normalizeForMatch(text)];

  const withoutCode = text.replace(/<(script|style)\b[\s\S]*?<\/\1>/giu, " ").replace(/<!--[\s\S]*?-->/gu, " ");

  return [
    normalizeForMatch(decodeEntities(withoutCode.replace(/<[^>]+>/gu, " "))),
    normalizeForMatch(decodeEntities(withoutCode.replace(/<[^>]+>/gu, ""))),
  ];
};

/** 「」 안의 글을 모두 뽑습니다. 앞뒤를 잘랐다는 표시(…, ...)는 떼어 냅니다 */
export const readQuotes = (value: string) =>
  [...value.matchAll(/「([^」]+)」/gu)]
    .map((match) => match[1].replace(/^(?:…|\.\.\.)\s*|\s*(?:…|\.\.\.)$/gu, "").trim())
    .filter((quote) => quote !== "");

/** 출처 칸에서 웹 주소와 파일 경로 후보를 나눕니다 */
export const readSourceTokens = (value: string) => {
  const codeSpans = [...value.matchAll(/`([^`]+)`/gu)].map((match) => match[1]);
  const rest = value.replace(/`[^`]+`/gu, " ").replace(/<br\s*\/?>/giu, " ");
  const tokens = [...codeSpans, ...rest.split(/[\s,;，、()（）「」[\]]+/u)]
    .map((token) => token.trim().replace(/[.,;:]+$/u, ""))
    .filter((token) => token !== "");
  const urls = tokens.filter((token) => /^https?:\/\//u.test(token));
  const paths = tokens
    .filter((token) => !/^https?:\/\//u.test(token) && /[/\\]|\.[A-Za-z0-9]{1,6}(?::\d+(?:-\d+)?)?$/u.test(token))
    .map((token) => token.replace(/(?::\d+(?:-\d+)?|#L\d+(?:-L?\d+)?)$/u, ""));

  return { urls, paths };
};

/** 판정과 근거 칸에 들어가면 안 되는 점수와 확신도 꼴 */
const SCORE_PATTERN =
  /(신뢰도|확신도|정확도\s*\d|confidence|score|점수|\b\d{1,3}\s*\/\s*(?:10|100)\b(?!\s*[=×*+\-])|\d+\s*점(?![가-힣]))/iu;

export interface VerifyReportParams {
  reportText: string;
  claimsFile: ClaimsFile;
  postText: string;
  /** 지금 글의 sha256 */
  postSha256: string;
  /** 출처 칸의 경로 후보를 실제 파일 경로로 바꿉니다. 없으면 `null` */
  resolveSourcePath: (token: string) => string | null;
  /** 파일의 글. 읽지 못하면 `null` */
  readSourceFile: (filePath: string) => string | null;
  /** 대조표에 들어가면 안 되는 이름 */
  hiddenNames: readonly string[];
}

/** 대조표를 검사해 문제 목록을 줄 번호 차례로 돌려줍니다. 문제가 없으면 빈 배열입니다 */
export const verifyReport = ({
  reportText,
  claimsFile,
  postText,
  postSha256,
  resolveSourcePath,
  readSourceFile,
  hiddenNames,
}: VerifyReportParams) => {
  const report = parseReport(reportText);
  const problems: Problem[] = [];
  const add = (line: number, message: string) => {
    const safe = hiddenNames.reduce((value, name) => name ? value.split(name).join("[가린 이름]") : value, message);
    problems.push({ line, message: safe });
  };
  const sectionLine = (title: string) => report.sections[title]?.line ?? 1;
  const searchableCache = new Map<string, string[] | null>();
  const readSearchable = (filePath: string) => {
    if (!searchableCache.has(filePath)) {
      const text = readSourceFile(filePath);

      searchableCache.set(filePath, text === null ? null : toSearchableTexts({ text, isHtml: /\.x?html?$/iu.test(filePath) }));
    }

    return searchableCache.get(filePath) ?? null;
  };
  const postSearchable = normalizeForMatch(postText);

  /** 인용이 출처 칸의 파일 가운데 하나에 있는지 봅니다(V6) */
  const checkQuotes = ({ line, source, quotes, label }: { line: number; source: string; quotes: string[]; label: string }) => {
    if (quotes.length === 0) return;

    const { urls, paths } = readSourceTokens(source);
    const files = [...new Set(paths.map(resolveSourcePath).filter((file): file is string => file !== null && (urls.length === 0 || file.split(/[\\/]/u).includes("fetched"))))];

    if (files.length === 0) {
      add(
        line,
        urls.length > 0
          ? `${label}: 웹 출처의 받아 둔 원문이 없음(fetched/ 아래 파일을 출처 칸에 함께 적음)`
          : `${label}: 인용을 대조할 출처 파일을 찾지 못함(출처 칸에 파일 경로를 적음)`,
      );
      return;
    }

    for (const quote of quotes) {
      const needle = normalizeForMatch(quote);
      const isFound = files.some((file) => readSearchable(file)?.some((text) => text.includes(needle)));

      if (!isFound) add(line, `${label}: 인용을 출처에서 찾지 못함`);
    }
  };

  // V1 머리의 네 줄
  const headerNames: [keyof ParsedReport["header"], string][] = [
    ["post", "글"],
    ["date", "대조한 날"],
    ["sources", "자료 목록"],
    ["counts", "주장 n건"],
  ];

  for (const [key, name] of headerNames) {
    if (!report.header[key]) add(1, `머리에 「- ${name}:」 줄이 없음`);
  }
  if (report.header.date && !/^\d{4}-\d{2}-\d{2}\b/u.test(report.header.date.value)) {
    add(report.header.date.line, "대조한 날이 YYYY-MM-DD 꼴이 아님");
  }

  // V2 글이 대조 뒤에 바뀌지 않았는지
  const headerSha = report.header.post?.sha256;

  if (report.header.post && !headerSha) {
    add(report.header.post.line, "글 줄에 sha256 값이 없음(claims.json의 post.sha256을 적음)");
  } else if (report.header.post && headerSha) {
    if (headerSha !== claimsFile.post.sha256) {
      add(report.header.post.line, "대조표의 sha256이 claims.json과 다름(claims.json을 다시 만든 뒤 대조하지 않음)");
    }
    if (postSha256 !== claimsFile.post.sha256) {
      add(report.header.post.line, "글이 대조 뒤에 바뀜(claims.json을 만든 뒤 글의 sha256이 달라짐)");
    }
  }

  const mainTable = report.sections[SECTION_TITLES.table]?.table;
  const skippedTable = report.sections[SECTION_TITLES.skipped]?.table;
  const notFoundTable = report.sections[SECTION_TITLES.notFound]?.table;
  const unopenedTable = report.sections[SECTION_TITLES.unopened]?.table;
  const details = report.sections[SECTION_TITLES.details]?.details ?? [];

  if (!mainTable) {
    add(sectionLine(SECTION_TITLES.table), "「## 대조표」 절의 표가 없음");
  } else {
    for (const header of ["번호", "줄", "주장", "출처", "판정", "근거", "고칠 말"]) {
      if (!mainTable.headers.includes(header)) add(mainTable.line, `대조표에 「${header}」 칸이 없음`);
    }
  }

  // V3 claims.json의 번호가 대조표나 「대조 안 함」 표에 한 번씩
  const seen = new Map<string, number[]>();
  const rowsWithIds = [...(mainTable?.rows ?? []), ...(skippedTable?.rows ?? [])];

  for (const row of rowsWithIds) {
    const ids = readClaimIds(row.cells["번호"] ?? "");

    if (ids.length === 0) add(row.line, "번호 칸에 C나 M 번호가 없음");
    for (const id of ids) seen.set(id, [...(seen.get(id) ?? []), row.line]);
  }

  const knownIds = new Set(claimsFile.claims.map((claim) => claim.id));

  for (const claim of claimsFile.claims) {
    if (!seen.has(claim.id)) {
      add(sectionLine(SECTION_TITLES.table), `${claim.id}가 대조표와 「대조 안 함」 표에 없음`);
    }
  }
  for (const [id, rowLines] of seen) {
    if (rowLines.length > 1) add(rowLines[1], `${id}가 두 번 나옴(${rowLines.join(", ")}줄)`);
    if (id.startsWith("C") && !knownIds.has(id)) add(rowLines[0], `${id}는 claims.json에 없는 번호(글에서 더한 주장은 M 번호)`);
  }

  // V4~V8, V10 대조표의 줄마다
  const countByVerdict: Record<Verdict, number> = {
    맞음: 0,
    "일부 맞음": 0,
    다름: 0,
    "출처에 없음": 0,
    "못 엶": 0,
    "대조 안 함": skippedTable?.rows.length ?? 0,
  };
  const findRowById = (table: Table | undefined, ids: string[]) =>
    table?.rows.find((row) => readClaimIds(row.cells["번호"] ?? "").some((id) => ids.includes(id)));

  for (const row of mainTable?.rows ?? []) {
    const ids = readClaimIds(row.cells["번호"] ?? "");
    const label = ids.join(", ") || "번호 없는 줄";
    const verdict = stripEmphasis(row.cells["판정"] ?? "") as Verdict;
    const evidence = stripEmphasis(row.cells["근거"] ?? "");
    const source = row.cells["출처"] ?? "";

    if (verdict === "대조 안 함") {
      add(row.line, `${label}: 대조 안 함은 대조표가 아니라 「대조 안 함」 표에 적음`);
      continue;
    }
    if (!TABLE_VERDICTS.includes(verdict)) {
      add(row.line, `${label}: 모르는 판정(맞음, 일부 맞음, 다름, 출처에 없음, 못 엶 가운데 하나)`);
      continue;
    }
    countByVerdict[verdict] += 1;

    if (SCORE_PATTERN.test(row.cells["판정"] ?? "") || SCORE_PATTERN.test(evidence)) {
      add(row.line, `${label}: 판정이나 근거 칸에 점수나 확신도 꼴의 글자가 있음`);
    }

    if (verdict === "맞음" || verdict === "일부 맞음" || verdict === "다름") {
      if (source.trim() === "") add(row.line, `${label}: 출처 칸이 비어 있음`);

      const prefix = EVIDENCE_PREFIXES.find((item) => evidence.startsWith(item));

      if (evidence === "") add(row.line, `${label}: 근거가 없음`);
      else if (!prefix) add(row.line, `${label}: 근거가 인용:, 계산:, 명령: 가운데 하나로 시작하지 않음`);
      else if (prefix === "인용:") {
        const quotes = readQuotes(evidence);

        if (quotes.length === 0) add(row.line, `${label}: 인용: 뒤에 「」로 감싼 출처의 글이 없음`);
        checkQuotes({ line: row.line, source, quotes, label });
      }
    }

    if (verdict === "일부 맞음" || verdict === "다름") {
      const detail = details.find((item) => item.ids.some((id) => ids.includes(id)));
      const fixInDetail = detail?.body.some((item) => /^[-*]\s*고칠 말\s*:\s*\S/u.test(item.text));

      if (!detail) add(row.line, `${label}: 「## 다름과 일부 맞음」에 「### ${ids[0] ?? "번호"}」 절이 없음`);
      if ((row.cells["고칠 말"] ?? "").trim() === "" && !fixInDetail) add(row.line, `${label}: 고칠 말이 비어 있음`);
    }

    if (verdict === "출처에 없음") {
      const found = findRowById(notFoundTable, ids);

      if (!found) add(row.line, `${label}: 「## 출처에 없음」 표에 줄이 없음`);
      else if ((found.cells["찾은 곳"] ?? "").trim() === "") add(found.line, `${label}: 찾은 곳이 비어 있음`);
    }

    if (verdict === "못 엶") {
      const found = findRowById(unopenedTable, ids);

      if (!found) add(row.line, `${label}: 「## 못 엶」 표에 줄이 없음`);
      else if ((found.cells["실패한 까닭"] ?? "").trim() === "") add(found.line, `${label}: 실패한 까닭이 비어 있음`);
    }
  }

  // V7 따로 적는 표의 빈 칸
  for (const row of notFoundTable?.rows ?? []) {
    if ((row.cells["찾은 곳"] ?? "").trim() === "") add(row.line, "출처에 없음 표의 찾은 곳이 비어 있음");
  }
  for (const row of unopenedTable?.rows ?? []) {
    if ((row.cells["실패한 까닭"] ?? "").trim() === "") add(row.line, "못 엶 표의 실패한 까닭이 비어 있음");
  }
  for (const row of skippedTable?.rows ?? []) {
    if ((row.cells["까닭"] ?? "").trim() === "") add(row.line, "대조 안 함 표의 까닭이 비어 있음");
  }

  // V6 자세한 절의 인용: 「글」 줄은 글에, 「출처의 말」 줄은 그 절의 출처 파일에 있어야 함
  for (const detail of details) {
    const label = detail.ids.join(", ") || "자세한 절";
    const source = detail.body
      .filter((item) => /^[-*]\s*출처\s*:/u.test(item.text))
      .map((item) => item.text.replace(/^[-*]\s*출처\s*:/u, ""))
      .join(" ");

    for (const item of detail.body) {
      if (/^[-*]\s*글\s*(?:\(|（|:)/u.test(item.text)) {
        for (const quote of readQuotes(item.text)) {
          if (!postSearchable.includes(normalizeForMatch(quote))) {
            add(item.line, `${label}: 「글」 줄의 인용이 글에 없음`);
          }
        }
      }
      if (/^[-*]\s*출처의 말\s*:/u.test(item.text)) {
        checkQuotes({ line: item.line, source, quotes: readQuotes(item.text), label });
      }
    }
  }

  // V9 머리의 건수와 표의 줄 수
  const counts = report.header.counts;

  if (counts) {
    const total = Object.values(countByVerdict).reduce((sum, count) => sum + count, 0);

    if (counts.total !== total) add(counts.line, `머리의 주장 건수(${counts.total ?? "없음"})가 표의 줄 수(${total})와 다름`);
    for (const verdict of VERDICTS) {
      if ((counts.byVerdict[verdict] ?? 0) !== countByVerdict[verdict]) {
        add(counts.line, `머리의 「${verdict}」 건수(${counts.byVerdict[verdict] ?? "없음"})가 표(${countByVerdict[verdict]})와 다름`);
      }
    }
  }

  // 숨길 이름: 대조표에 들어가면 안 되는 이름. 이름 자체는 출력하지 않습니다
  const reportLines = reportText.split(/\r?\n/u);

  hiddenNames.forEach((name, nameIndex) => {
    const needle = name.toLocaleLowerCase();

    reportLines.forEach((text, lineIndex) => {
      if (text.toLocaleLowerCase().includes(needle)) add(lineIndex + 1, `숨길 이름(설정 hiddenNames의 ${nameIndex + 1}번째)이 들어 있음`);
    });
  });

  return problems
    .sort((a, b) => a.line - b.line)
    .filter((problem, index, list) => index === 0 || problem.line !== list[index - 1].line || problem.message !== list[index - 1].message);
};

/** 문제 목록을 `줄: 문제` 꼴의 줄로 바꿉니다 */
export const formatProblems = (problems: Problem[]) => problems.map((problem) => `${problem.line}: ${problem.message}`);
