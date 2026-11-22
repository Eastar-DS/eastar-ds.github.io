/** 결과 문서의 표, 머리 칸, 펜스를 읽습니다. 줄 번호는 원문 기준 1부터입니다. */
export interface Row { cells: string[]; line: number }
export const splitCells = (line: string) => {
  const cells: string[] = [];
  let cell = "";
  let ticks = 0;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === "\\" && line[i + 1] === "|") { cell += "|"; i++; continue; }
    if (char === "`") {
      const run = line.slice(i).match(/^`+/)![0];
      ticks = ticks === run.length ? 0 : ticks || run.length;
      cell += run; i += run.length - 1; continue;
    }
    if (char === "|" && !ticks) { cells.push(cell.trim()); cell = ""; } else cell += char;
  }
  cells.push(cell.trim());
  if (line.trimStart().startsWith("|")) cells.shift();
  if (line.trimEnd().endsWith("|")) cells.pop();
  return cells;
};
export const field = (text: string, name: string) => text.split(/\r?\n/).map((line) => line.match(/^- ([^:]+):\s*(.*)$/)).find((match) => match?.[1] === name)?.[2]?.trim() ?? "";
export const section = (text: string, heading: string, depth = 2) => {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line === `${"#".repeat(depth)} ${heading}`);
  if (start < 0) return "";
  const end = lines.findIndex((line, index) => index > start && new RegExp(`^#{1,${depth}} `).test(line));
  return lines.slice(start + 1, end < 0 ? undefined : end).join("\n");
};
export const table = (text: string, heading: string, depth = 2): Row[] => {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line === `${"#".repeat(depth)} ${heading}`);
  if (start < 0) return [];
  const rows: Row[] = [];
  let header = false;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (new RegExp(`^#{1,${depth}} `).test(line)) break;
    if (!line.startsWith("|")) continue;
    if (!header) { header = true; continue; }
    if (/^\|[\s|:-]+\|$/.test(line)) continue;
    rows.push({ cells: splitCells(line), line: i + 1 });
  }
  return rows;
};
export const cell = (text: string | number) => String(text).replace(/\r?\n/g, " ").replace(/\|/g, "\\|");
export const row = (cells: (string | number)[]) => `| ${cells.map(cell).join(" | ")} |`;
export const sourceIds = (value: string) => [...value.matchAll(/\b[SF]\d+\b/g)].map((match) => match[0]);
export const fenced = (text: string) => {
  const longest = Math.max(3, ...[...text.matchAll(/`+/g)].map((match) => match[0].length));
  const fence = "`".repeat(longest + 1);
  return `${fence}text\n${text}\n${fence}`;
};
export const outsideFences = (text: string) => {
  let fence = "";
  return text.split(/\r?\n/).map((line) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && /^\s*(`+|~+)\s*$/.test(line)) fence = "";
      return "";
    }
    return fence ? "" : line;
  }).join("\n");
};
