import { CATEGORIES, DESCRIPTION_LENGTH, H2_COUNT, POST_CHARACTERS, SERIES_MIN_POSTS, SLUG, TITLE_LENGTH } from "../postRules/constants.ts";
import { countTitleCharacters } from "../postRules/countCharacters.ts";
import { checkStyle, hiddenNameCount } from "../postWork/io.ts";
import { sourceIds } from "../postWork/markdown.ts";
import { parseSourcesMd } from "../gatherPostSources/sourcesDocument.ts";
import { parseInterviewMd } from "../interviewForPost/document.ts";
import { parseOutlineMd } from "./document.ts";
export const checkSlug = (slug: string, existing: readonly string[] = []) => {
  const count = slug.split("-").length;
  return SLUG.pattern.test(slug) && count >= SLUG.minWords && count <= SLUG.maxWords && !existing.includes(slug);
};
export const checkOutline = ({ text, sources, interview = "", existingSlugs = [], names = [] }: { text: string; sources: string; interview?: string; existingSlugs?: readonly string[]; names?: readonly string[] }) => {
  const outline = parseOutlineMd(text);
  const material = parseSourcesMd(sources);
  const problems: string[] = [];
  const add = (line: number, message: string) => problems.push(`${line}: ${message}`);
  if (material.status !== "확정") add(1, "자료 목록을 먼저 확정해야 합니다");
  if (!["초안", "이스타 확인 기다림", "확정"].includes(outline.status)) add(1, "개요 상태가 올바르지 않습니다");
  const series = outline.decision.match(/^시리즈 (\d+)편$/);
  const expectedCount = outline.decision === "한 편" ? 1 : outline.decision === "글 두 편" ? 2 : series ? Number(series[1]) : 0;
  if (!expectedCount || expectedCount !== outline.parts.length) add(1, "판단의 편 수와 개요의 편 수가 다릅니다");
  if (!outline.basis || !/(?:정본|content-guide)/.test(outline.basis)) add(1, "판단의 근거와 정본의 절을 적어야 합니다");
  if (series && expectedCount < SERIES_MIN_POSTS) add(1, "두 편은 시리즈로 만들지 않습니다(정본 8.2)");
  const seriesNames = [...outline.seriesNames.matchAll(/「([^」]+)」/g)].map((match) => match[1]);
  if (series && new Set(seriesNames).size !== 3) add(1, "시리즈 이름 후보가 세 개 필요합니다");
  if (!series && outline.seriesNames) add(1, "한 편이나 글 두 편에는 시리즈 이름 후보를 두지 않습니다");
  const slugs = new Map<string, number>();
  const visualIds = new Set<string>();
  const checkSource = (id: string, line: number, used: boolean) => {
    const source = material.rows.find((row) => row.cells[0] === id);
    if (!source) add(line, "자료 목록에 없는 자료 번호입니다");
    else if (used && !["써도 됨", "다시 써서 씀"].includes(source.cells[4])) add(line, "글에 쓸 수 없는 자료를 가리킵니다");
  };
  const prose = text.split("\n").map(() => "");
  for (const [index, part] of outline.parts.entries()) {
    if (part.number !== index + 1) add(part.line, "편 번호는 1편부터 이어져야 합니다");
    if (!part.question || outline.parts.some((other) => other !== part && other.question === part.question)) add(part.line, "편마다 다른 질문이 필요합니다");
    if (!CATEGORIES.includes(part.category as typeof CATEGORIES[number])) add(part.line, "정본의 분류에서 골라야 합니다");
    for (const [candidates, rule, label] of [[part.titles, TITLE_LENGTH, "제목"], [part.descriptions, DESCRIPTION_LENGTH, "요약"]] as const) {
      if (candidates.length !== 3 || new Set(candidates.map((row) => row.cells[0])).size !== 3) add(part.line, `${label} 후보는 서로 다른 세 개가 필요합니다`);
      for (const value of candidates) {
        if (value.cells.length !== 2) add(value.line, `${label} 후보 표의 칸 수가 올바르지 않습니다`);
        const length = countTitleCharacters(value.cells[0]);
        if (length < rule.min || length > rule.max) add(value.line, `${label} 길이가 ${rule.min}~${rule.max}자 범위 밖입니다 (${length}자)`);
        if (Number(value.cells[1]?.replace(/[,자\s]/g, "")) !== length) add(value.line, `${label} 글자 수가 실제 값과 다릅니다`);
        prose[value.line - 1] = value.cells[0];
      }
    }
    for (const value of part.descriptions) if (part.titles.some((title) => title.cells[0] === value.cells[0])) add(value.line, "요약이 제목을 되풀이합니다");
    if (part.slugs.length !== 3) add(part.line, "주소 후보가 세 개 필요합니다");
    for (const value of part.slugs) {
      if (value.cells.length !== 2) add(value.line, "주소 후보 표의 칸 수가 올바르지 않습니다");
      const slug = value.cells[0];
      if (!checkSlug(slug, existingSlugs)) add(value.line, "주소의 꼴, 낱말 수, 기존 글과의 겹침을 확인하세요");
      if (Number(value.cells[1]) !== slug.split("-").length) add(value.line, "주소의 낱말 수가 실제 값과 다릅니다");
      if (slugs.has(slug)) add(value.line, "같은 개요에서 주소 후보가 겹칩니다");
      slugs.set(slug, part.number);
    }
    if (part.sections.length < H2_COUNT.min || part.sections.length > H2_COUNT.max) add(part.line, "h2는 정본의 개수 범위에 맞춰야 합니다");
    if (part.sections.at(-1)?.cells[1] !== "정리") add(part.line, "마지막 h2는 정리여야 합니다");
    if (!part.sections.some((value) => /(?:까|나|\?)$/.test(value.cells[1]))) add(part.line, "묻는 꼴의 h2가 하나 이상 필요합니다");
    let sum = 0;
    for (const [at, value] of part.sections.entries()) {
      const [order, heading, answer, materials, estimate,,,] = value.cells;
      if (value.cells.length !== 7 || Number(order) !== at + 1) add(value.line, "절 표의 칸 수나 순서를 확인하세요");
      if (!heading || /^(?:들어가며|본론|배경|구현|결과)$/.test(heading)) add(value.line, "h2에는 그 절의 질문이나 내용을 적어야 합니다");
      if (heading !== "정리" && (!answer || /(?:설명합니다|다룹니다|알아봅니다)[.!]?$/.test(answer))) add(value.line, "완성된 답 첫 문장이 필요합니다");
      const ids = sourceIds(materials ?? "");
      if (heading !== "정리" && !ids.length && !/Q\d+|필요|인터뷰/.test(value.cells[6] ?? "")) add(value.line, "자료 번호 또는 인터뷰가 필요한 까닭이 필요합니다");
      for (const id of ids) checkSource(id, value.line, true);
      const count = Number(estimate?.replace(/[,자\s]/g, ""));
      if (!Number.isFinite(count) || count <= 0) add(value.line, "절의 글자 수 어림은 양수여야 합니다");
      sum += count;
      prose[value.line - 1] = `${heading}\n${answer}`;
    }
    if (sum !== part.estimate) add(part.line, "절별 어림 합계와 편 머리의 어림 합계가 다릅니다");
    if (part.estimate < POST_CHARACTERS.min || part.estimate > POST_CHARACTERS.max) add(part.line, `어림 합계가 범위 밖입니다 (${part.estimate < POST_CHARACTERS.min ? POST_CHARACTERS.min - part.estimate : part.estimate - POST_CHARACTERS.max}자 ${part.estimate < POST_CHARACTERS.min ? "모자람" : "넘음"})`);
    if (part.visuals.filter((value) => value.cells[2] === "데모").length > 2) add(part.line, "데모는 편마다 두 개 이하로 고릅니다");
    for (const value of part.visuals) {
      const [, source, shape, conclusion, target] = value.cells;
      if (value.cells.length !== 5 || !["데모", "정지 그림", "표", "쓰지 않음"].includes(shape)) add(value.line, "데모와 그림 후보의 칸이나 꼴을 확인하세요");
      const ids = sourceIds(source ?? "");
      if (!ids.length) add(value.line, "바탕 자료 번호가 필요합니다");
      for (const id of ids) { visualIds.add(id); checkSource(id, value.line, shape !== "쓰지 않음"); }
      if (shape === "데모" && !conclusion?.trim()) add(value.line, "데모가 보여 줄 결론 한 문장이 필요합니다");
      if (shape !== "쓰지 않음" && !part.sections.some((section) => section.cells[0] === target)) add(value.line, "데모나 그림을 넣을 절 번호가 올바르지 않습니다");
    }
  }
  for (const source of material.rows) if (["해설 아티팩트", "PR 그림과 도식"].includes(source.cells[1]) && !visualIds.has(source.cells[0])) add(1, `${source.cells[0]}를 데모와 그림 후보에서 정해야 합니다`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(outline.interviewApplied)) {
    if (!interview) add(1, "인터뷰 반영 날짜가 있으면 인터뷰 파일이 필요합니다");
    const sectionsText = outline.parts.flatMap((part) => part.sections.map((value) => value.cells.join(" "))).join("\n");
    for (const question of parseInterviewMd(interview).questions.filter((question) => question.fields["상태"] === "답함")) if (!new RegExp(`\\bQ${question.number}\\b`).test(sectionsText)) add(1, `Q${question.number}의 답이 개요 절에 반영되지 않았습니다`);
  }
  for (const [index, line] of text.split("\n").entries()) if (hiddenNameCount(line, names)) add(index + 1, "가릴 이름이 있습니다");
  problems.push(...checkStyle(prose.join("\n")));
  return problems;
};
