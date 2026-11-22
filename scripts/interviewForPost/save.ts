import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { answerHistoryText, emptyAnswerIndex, readAnswerState, sha256, splitAnswers } from "./answers.ts";
import type { AnswerIndex, AnswerReceipt } from "./answers.ts";
import { parseInterviewMd } from "./document.ts";
import { fenced } from "../postWork/markdown.ts";
import { physicalPath, readLocalFile, workContext } from "../postWork/io.ts";
export const saveAnswers = ({ work, from, dryRun = false }: { work: string; from: string; dryRun?: boolean }) => {
  const context = workContext(work);
  const source = path.resolve(context.dir, from);
  if (lstatSync(source).isSymbolicLink()) throw new Error("답 원문은 심볼릭 링크일 수 없습니다");
  const raw = readFileSync(source, "utf8");
  const slices = splitAnswers(raw);
  const interview = readLocalFile(context.dir, "interview.md");
  const parsed = parseInterviewMd(interview);
  if (!parsed.questions.length) throw new Error("질문이 없습니다");
  const summary = slices.map((part) => ({ question: part.number, state: readAnswerState(part.text), characters: [...part.text].length, unknown: part.number !== null && !parsed.questions.some((question) => question.number === part.number) }));
  if (dryRun) return summary;
  const answersDir = path.join(context.dir, "answers");
  if (physicalPath(answersDir) !== answersDir) throw new Error("answers는 심볼릭 링크일 수 없습니다");
  mkdirSync(answersDir, { recursive: true });
  const hash = sha256(raw);
  const candidates = readdirSync(answersDir).filter((file) => /^interview-answer-\d+\.txt$/.test(file));
  const same = candidates.find((file) => sha256(readLocalFile(context.dir, `answers/${file}`)) === hash);
  const number = Math.max(0, ...candidates.map((file) => Number(file.match(/\d+/)![0]))) + 1;
  const stored = `answers/${same ?? `interview-answer-${number}.txt`}`;
  if (!same) writeFileSync(path.join(context.dir, stored), raw, { flag: "wx" });
  const indexFile = path.join(context.dir, "answers/index.json");
  const index: AnswerIndex = existsSync(indexFile) ? JSON.parse(readLocalFile(context.dir, "answers/index.json")) : emptyAnswerIndex();
  const date = new Date().toISOString().slice(0, 10);
  const add = (target: AnswerReceipt[], part: typeof slices[number]) => {
    if (!target.some((receipt) => receipt.sha256 === hash && receipt.start === part.start && receipt.end === part.end)) target.push({ file: stored, sha256: hash, start: part.start, end: part.end, number: part.number, receivedAt: date });
  };
  for (const part of slices) {
    if (part.number === null) add(index.unnumbered, part);
    else if (parsed.questions.some((question) => question.number === part.number)) add(index.questions[`Q${part.number}`] ??= [], part);
    else add(index.unknown, part);
  }
  const read = (file: string) => readLocalFile(context.dir, file);
  let lines = interview.split("\n");
  for (const question of [...parsed.questions].reverse()) {
    const receipts = index.questions[`Q${question.number}`];
    if (!receipts?.length) continue;
    if (question.answerStart < 0) throw new Error("답 칸에 백틱 네 개 이상의 펜스가 필요합니다");
    const answer = answerHistoryText(receipts, read);
    const latest = read(receipts.at(-1)!.file).slice(receipts.at(-1)!.start, receipts.at(-1)!.end);
    let body = lines.slice(question.start, question.end);
    body.splice(question.answerStart - question.start, question.answerEnd - question.answerStart + 1, ...fenced(answer).split("\n"));
    body = body.map((line) => /^- 상태:/.test(line) ? `- 상태: ${readAnswerState(latest)}` : /^- 답 위치:/.test(line) ? `- 답 위치: ${stored} (answers/index.json)` : line);
    lines.splice(question.start, question.end - question.start, ...body);
  }
  const unnumbered = answerHistoryText([...index.unnumbered, ...index.unknown], read);
  let output = lines.join("\n");
  const appendix = `## 번호 없는 답\n\n${fenced(unnumbered)}\n`;
  const start = output.indexOf("\n## 번호 없는 답");
  output = start < 0 ? `${output.trimEnd()}\n\n${appendix}` : `${output.slice(0, start)}\n${appendix}`;
  const answered = parseInterviewMd(output).questions.every((question) => question.fields["상태"] !== "답 기다림");
  output = output.replace(/^- 상태:.*$/m, `- 상태: ${answered ? "답 받음" : "답 기다림"}`).replace(/^- 답 받은 날:.*$/m, `- 답 받은 날: ${date}`);
  // 출력 두 파일을 쓰기 전에 경로를 모두 확인합니다.
  for (const file of [indexFile, path.join(context.dir, "interview.md")]) if (physicalPath(file) !== file) throw new Error("결과 파일은 심볼릭 링크일 수 없습니다");
  writeFileSync(indexFile, `${JSON.stringify(index, null, 2)}\n`);
  writeFileSync(path.join(context.dir, "interview.md"), output);
  return summary;
};
