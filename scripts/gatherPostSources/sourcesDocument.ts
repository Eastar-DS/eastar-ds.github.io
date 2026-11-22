import { existsSync } from "node:fs";
import path from "node:path";
import { field, row, section, sourceIds, table } from "../postWork/markdown.ts";
import { hiddenNameCount, readLocalFile, redact } from "../postWork/io.ts";
import { SOURCE_KINDS, USES } from "./types.ts";
import type { SourceScan } from "./types.ts";
export const parseSourcesMd = (text: string) => ({ status: field(text, "상태"), rows: table(text, "자료"), pairs: table(text, "링크와 로컬 원본의 짝"), missing: table(text, "찾지 못한 종류"), questions: section(text, "이스타에게 물을 것"), answers: section(text, "이스타의 답") });
export const renderSources = (scan: SourceScan, names: readonly string[], previous = "") => {
  const old = parseSourcesMd(previous);
  const all = [...scan.items, ...scan.folders];
  const active = all.filter((item) => !item.removed);
  const safe = (text: string) => redact(text, names);
  // 같은 경로의 내용이나 링크도 바뀔 수 있어, 다시 훑은 목록은 답을 반영한 뒤 명시적으로 확정합니다.
  const state = "이스타 확인 기다림";
  const rows = all.map((item) => {
    const prior = old.rows.find((value) => value.cells[0] === item.id)?.cells;
    const restricted = ["단서만", "열지 않음", "쓰면 안 됨"].includes(item.defaultUse);
    const use = restricted ? item.defaultUse : prior?.[4] ?? item.defaultUse;
    const description = restricted ? item.unopenable ? "(열지 않음)" : "내용을 인용하지 않는 단서" : item.removed ? "다시 훑을 때 찾지 못함" : prior?.[3] ?? (item.title ? `\`${item.title.replace(/`/g, "")}\`` : item.fileCount !== undefined ? `폴더 묶음 ${item.fileCount}개` : "이름과 위치를 확인한 자료");
    return row([item.id, item.unopenable ? item.kind : prior?.[1] ?? item.kind, safe(item.path), description, item.removed ? "관련 없음" : use, restricted ? "읽기 정책과 이름 규칙" : prior?.[5] ?? (item.hiddenNameCount ? "가릴 이름을 확인해야 함" : item.defaultUse === "이스타 확인" ? "공개 범위 확인 필요" : "자료 종류에 따른 기본값"), item.unopenable || item.fileCount !== undefined || item.read === "이름만" ? "이름만" : item.read === "단서만" ? "단서만" : "훑음"]);
  });
  const pairs = scan.artifactPairs.map((pair) => {
    const prior = old.pairs.find((value) => value.cells[1] === pair.url)?.cells;
    const hint = pair.hintIds?.length ? `짝 후보: ${pair.hintIds.map((id) => `${id} ${safe(all.find((item) => item.id === id)?.path ?? "")}`).join(", ")} (이스타 확인)` : "";
    return row([safe(pair.text), pair.url, prior?.[3] === "쓰지 않음" ? "" : pair.localId ?? (hint || pair.candidates?.join(", ") || ""), prior?.[3] === "쓰지 않음" ? "쓰지 않음" : pair.state]);
  });
  for (const id of scan.unpairedLocalArtifacts) pairs.push(row(["로컬 원본", "", id, "링크 없음"]));
  let questions = old.questions.trim() || "1. 찾은 자료 밖에 더 있나요? 찾지 못한 종류를 확인하고 위치 또는 「없음」으로 답해 주세요.";
  let questionNumber = Math.max(1, ...[...questions.matchAll(/^(\d+)[.)]/gm)].map((match) => Number(match[1])));
  for (const pair of scan.artifactPairs.filter((pair) => pair.state !== "짝")) {
    if (old.pairs.some((value) => value.cells[1] === pair.url && value.cells[3] === "쓰지 않음") || pair.text && questions.includes(safe(pair.text))) continue;
    if (pair.hintIds?.length) { questions += `\n${++questionNumber}. 아티팩트 「${safe(pair.text)}」의 짝 후보 ${pair.hintIds.join(", ")}를 확인해 주세요. 제목이 달라 자동으로 짝짓지 않았습니다.`; continue; }
    questions += `\n${++questionNumber}. 아티팩트 「${safe(pair.text) || "링크 글 없음"}」의 HTML을 inbox/에 넣어 주시거나 「쓰지 않음」으로 답해 주세요.`;
  }
  return `# 자료 목록: ${scan.work}\n\n- 주제: ${scan.topics.join(", ")}\n- 주제어: ${scan.topics.join(", ")}\n- 훑은 날: ${scan.scannedAt.slice(0, 10)}\n- 상태: ${state}\n\n## 요약\n\n| 종류 | 건수 |\n|---|---|\n${SOURCE_KINDS.map((kind) => row([kind, active.filter((item) => item.kind === kind).length || (kind === "아티팩트 링크" ? scan.artifactPairs.length : kind === "바깥 자료" ? scan.links.filter((link) => link.type === "other").length : 0)])).join("\n")}\n\n| 뿌리 | 찾은 수 |\n|---|---|\n${scan.roots.map((root) => row([root.name, root.itemCount])).join("\n")}\n\n## 자료\n\n| 번호 | 종류 | 위치 | 한 줄 설명 | 쓰임 | 까닭 | 읽은 정도 |\n|---|---|---|---|---|---|---|\n${rows.join("\n")}\n\n## 링크와 로컬 원본의 짝\n\n| 링크 글 | 링크 | 로컬 원본 | 상태 |\n|---|---|---|---|\n${pairs.join("\n")}\n\n## 링크와 경로\n\n| 종류 | 위치 | 찾아낸 곳 | 대상 |\n|---|---|---|---|\n${scan.links.filter((link) => link.type !== "artifact").map((link) => {
    const target = /^https?:/.test(link.url) ? link.url : path.resolve(path.dirname(link.foundIn), link.url);
    return row([link.type, safe(link.url), all.find((item) => item.path === link.foundIn)?.id ?? safe(link.foundIn), all.find((item) => item.path === target)?.id ?? "짝 없음"]);
  }).join("\n")}\n\n## 찾지 못한 종류\n\n| 종류 | 찾아본 곳 | 다음 할 일 |\n|---|---|---|\n${scan.missingKinds.map((kind) => row([kind, `${scan.roots.map((root) => root.name).join(", ")} / ${scan.topics.join(", ")}`, "이스타에게 물음"])).join("\n")}\n\n## 경고\n\n${scan.warnings.map((warning) => `- ${safe(warning)}`).join("\n") || "없음"}\n\n## 이스타에게 물을 것\n\n${questions}\n\n## 이스타의 답\n\n${old.answers.trim()}\n`;
};
export const checkSources = ({ text, scan, names, dir }: { text: string; scan: SourceScan; names: readonly string[]; dir: string }) => {
  const document = parseSourcesMd(text);
  const problems: string[] = [];
  const add = (line: number, message: string) => problems.push(`${line}: ${message}`);
  if (!["이스타 확인 기다림", "확정"].includes(document.status)) add(1, "자료 목록의 상태가 올바르지 않습니다");
  const ids = document.rows.map((value) => value.cells[0]);
  if (new Set(ids).size !== ids.length) add(1, "자료 번호가 겹칩니다");
  for (const item of [...scan.items, ...scan.folders]) if (!ids.includes(item.id)) add(1, `${item.id}가 자료 표에 없습니다`);
  for (const value of document.rows) {
    const [id, kind, location, description, use, reason] = value.cells;
    const item = [...scan.items, ...scan.folders].find((item) => item.id === id);
    if (value.cells.length !== 7 || !item) { add(value.line, "자료 표의 칸 수나 자료 번호가 올바르지 않습니다"); continue; }
    if (![...SOURCE_KINDS, "비밀값 의심", "기타"].includes(kind)) add(value.line, "자료 종류가 올바르지 않습니다");
    if (!USES.includes(use as typeof USES[number]) || !reason) add(value.line, "쓰임과 까닭을 채워야 합니다");
    if (["단서만", "쓰면 안 됨", "열지 않음"].includes(use) && ([...description].length > 40 || /[「」『』"“”]/.test(description))) add(value.line, "제한된 자료의 설명은 인용 없이 40자 이하로 씁니다");
    if (item.unopenable && use !== "열지 않음" || item.read === "단서만" && use !== "단서만") add(value.line, "읽기 정책으로 제한된 쓰임을 풀 수 없습니다");
    if (item.hiddenNameCount && use === "써도 됨") add(value.line, "가릴 이름이 있는 자료는 확인이 필요합니다");
    if (!item.removed && !/^(?:https?:|git:)/.test(item.path) && !existsSync(item.path)) add(value.line, "자료의 위치가 없습니다");
    if (location !== redact(item.path, names)) add(value.line, "자료의 위치가 훑기 결과와 다릅니다");
    if (document.status === "확정" && use === "이스타 확인") add(value.line, "쓰임 확인이 끝나지 않았습니다");
  }
  for (const [index, line] of text.split(/\r?\n/).entries()) if (hiddenNameCount(line, names)) add(index + 1, "가릴 이름이 있습니다");
  for (const pair of scan.artifactPairs) {
    const found = document.pairs.find((value) => value.cells[1] === pair.url);
    if (!found) { add(1, "아티팩트 링크가 짝 표에 없습니다"); continue; }
    const [,, local, state] = found.cells;
    if (found.cells.length !== 4) add(found.line, "아티팩트 짝 표의 칸 수가 올바르지 않습니다");
    if (!["짝", "짝 없음", "여럿", "쓰지 않음"].includes(state)) add(found.line, "아티팩트 짝의 상태가 올바르지 않습니다");
    if (state === "짝" && (sourceIds(local).length !== 1 || !scan.items.some((item) => item.id === local && item.kind === "해설 아티팩트" && !item.removed))) add(found.line, "짝의 로컬 원본 번호가 올바르지 않습니다");
    if (document.status === "확정" && ["짝 없음", "여럿"].includes(state)) add(found.line, "아티팩트 원본을 확인하거나 쓰지 않음으로 정해야 합니다");
  }
  for (const kind of scan.missingKinds) if (!document.missing.some((value) => value.cells[0] === kind && value.cells[1]?.trim())) add(1, `${kind}의 찾아본 곳이 없습니다`);
  if (!/^1[.)]\s+.+/m.test(document.questions)) add(1, "추가 자료를 확인할 첫 질문이 필요합니다");
  if (document.status === "확정") {
    const answers = [...document.answers.matchAll(/answers\/[^\s)`]+\.txt/g)].map((match) => match[0]);
    if (!answers.length) add(1, "확정하려면 추가 자료에 대한 답 원문이 필요합니다");
    for (const file of answers) { try { if (!readLocalFile(dir, file).trim()) add(1, "자료 확인 답이 비어 있습니다"); } catch { add(1, "자료 확인 답 원문 파일을 읽을 수 없습니다"); } }
    if (scan.roots.some((root) => !root.exists) || scan.warnings.some((warning) => !warning.startsWith("hiddenNames"))) add(1, "확인하지 못한 뿌리나 경고가 있어 확정할 수 없습니다");
  }
  return problems;
};
