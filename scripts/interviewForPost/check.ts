import { existsSync } from "node:fs";
import path from "node:path";
import { parseInterviewMd } from "./document.ts";
import { answerHistoryText, readAnswerState, receiptText } from "./answers.ts";
import type { AnswerIndex } from "./answers.ts";
import { parseSourcesMd } from "../gatherPostSources/sourcesDocument.ts";
import { field, outsideFences, sourceIds } from "../postWork/markdown.ts";
import { checkStyle, hiddenNameCount, readLocalFile } from "../postWork/io.ts";
export const checkInterview = ({ text, sources, outline, dir, names }: { text: string; sources: string; outline: string; dir: string; names: readonly string[] }) => {
  const parsed = parseInterviewMd(text);
  const material = parseSourcesMd(sources);
  const problems: string[] = [];
  const add = (line: number, message: string) => problems.push(`${line}: ${message}`);
  if (material.status !== "확정") add(1, "자료 목록을 먼저 확정해야 합니다");
  if (!outline.includes("## 1편")) add(1, "개요가 필요합니다");
  if (!["답 기다림", "답 받음"].includes(parsed.status)) add(1, "인터뷰 상태가 올바르지 않습니다");
  if (!parsed.questions.length || parsed.questions.length > 10 || parsed.questions.length < 5 && !field(text, "모자란 까닭")) add(1, "질문은 5~10개이며 적으면 모자란 까닭을 적어야 합니다");
  if (Number(field(text, "질문 수")) !== parsed.questions.length) add(1, "질문 수가 실제 질문 수와 다릅니다");
  let index: AnswerIndex | null = null;
  if (existsSync(path.join(dir, "answers/index.json"))) {
    try { index = JSON.parse(readLocalFile(dir, "answers/index.json")); } catch { add(1, "답 대조 기록을 읽을 수 없습니다"); }
  }
  const read = (file: string) => { if (!/^answers\/[^/]+\.txt$/.test(file)) throw new Error("답 원문은 answers 안에 둡니다"); return readLocalFile(dir, file); };
  for (const [at, question] of parsed.questions.entries()) {
    const { fields, line } = question;
    if (question.number !== at + 1) add(line, "질문 번호는 Q1부터 이어져야 합니다");
    for (const name of ["꼴", "분류", "묻는 까닭", "자료에서 찾아본 곳", "답을 쓸 곳", "답이 없으면", "상태"]) if (!fields[name]) add(line, `${name} 칸을 채워야 합니다`);
    if (!["열린 질문", "확인 질문"].includes(fields["꼴"])) add(line, "질문의 꼴이 올바르지 않습니다");
    if (!["고른 까닭", "견준 방법", "배운 점", "다음에 다르게 할 점", "독자에게 바라는 것"].includes(fields["분류"])) add(line, "질문의 분류가 올바르지 않습니다");
    if (!["절을 뺌", "표시로 둠", "사실만 씀"].includes(fields["답이 없으면"])) add(line, "답이 없을 때의 처리가 올바르지 않습니다");
    if (!["답 기다림", "답함", "없음", "나중에"].includes(fields["상태"])) add(line, "답 상태가 올바르지 않습니다");
    if (!question.title.endsWith("?") || (question.title.match(/\?/g) ?? []).length !== 1) add(line, "질문 하나에 물음표 하나를 끝에 씁니다");
    const ids = sourceIds(fields["자료에서 찾아본 곳"] ?? "");
    if (fields["분류"] !== "독자에게 바라는 것" && !ids.length || ids.some((id) => !material.rows.some((row) => row.cells[0] === id))) add(line, "자료에서 찾아본 곳의 자료 번호를 확인하세요");
    const target = fields["답을 쓸 곳"] ?? "";
    const part = target.match(/(\d+)편/)?.[1];
    const heading = target.match(/「([^」]+)」/)?.[1];
    const partText = outline.split(new RegExp(`^## ${part}편\\s*$`, "m"))[1]?.split(/^## /m)[0] ?? "";
    if (!part || !heading || !partText.includes(`| ${heading} |`)) add(line, "답을 쓸 곳은 개요의 편과 h2를 가리켜야 합니다");
    if (hiddenNameCount(question.title + (fields["묻는 까닭"] ?? ""), names)) add(line, "질문이나 묻는 까닭에 가릴 이름이 있습니다");
    if (question.answerStart < 0) add(line, "백틱 네 개 이상의 답 펜스가 필요합니다");
    const receipts = index?.questions[`Q${question.number}`] ?? [];
    if (question.answer || fields["상태"] !== "답 기다림") {
      try {
        if (receipts.length) {
          if (receipts.some((receipt) => receipt.number !== question.number)) throw new Error("다른 질문의 답입니다");
          const expected = answerHistoryText(receipts, read);
          if (question.answer !== expected) add(line, `답이 원문과 다릅니다 (Q${question.number})`);
          const latest = receiptText(receipts.at(-1)!, read);
          if (fields["상태"] !== readAnswerState(latest)) add(line, "답 상태가 원문과 다릅니다");
        } else {
          // 번호 없는 답은 원문 파일의 줄 범위만 연결하고, 답을 복사해 채우지 않습니다.
          const location = fields["답 위치"]?.match(/^(answers\/[^/]+\.txt):L(\d+)-L(\d+)$/);
          if (!location || question.answer) throw new Error("원문 대조 기록 없음");
          const lines = read(location[1]).split(/\r?\n/);
          if (Number(location[2]) < 1 || Number(location[3]) < Number(location[2]) || Number(location[3]) > lines.length) throw new Error("원문 줄 범위 오류");
          if (fields["상태"] !== readAnswerState(lines.slice(Number(location[2]) - 1, Number(location[3])).join("\n"))) add(line, "답 상태가 원문과 다릅니다");
        }
      } catch { add(line, `답이 원문과 다릅니다 (Q${question.number})`); }
    } else if (receipts.length) add(line, "저장된 답이 질문에서 사라졌습니다");
  }
  if (parsed.status === "답 받음" && parsed.questions.some((question) => question.fields["상태"] === "답 기다림")) add(1, "아직 기다리는 답이 있습니다");
  try {
    const unnumbered = index ? answerHistoryText([...index.unnumbered, ...index.unknown], read) : "";
    if (parsed.unnumbered !== unnumbered) add(1, "번호 없는 답이 원문과 다릅니다");
  } catch { add(1, "번호 없는 답의 원문을 읽을 수 없습니다"); }
  problems.push(...checkStyle(outsideFences(text).split("\n").map((line) => /^- [^:]+:\s*$/.test(line) ? "" : line).join("\n")));
  return problems;
};
