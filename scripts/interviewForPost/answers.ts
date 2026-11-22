import { createHash } from "node:crypto";
export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");
export interface AnswerSlice { number: number | null; text: string; start: number; end: number }
/** 줄 머리 번호만 자릅니다. 코드 펜스 안의 번호와 문장 안의 숫자는 답 경계로 보지 않습니다. */
export const splitAnswers = (raw: string) => {
  const markers: { number: number; start: number; content: number }[] = [];
  let offset = 0;
  let fence = "";
  for (const line of raw.match(/[^\n]*\n|[^\n]+$/g) ?? []) {
    const mark = line.match(/^\s*(`{3,}|~{3,})/);
    if (mark) {
      if (!fence) fence = mark[1];
      else if (mark[1][0] === fence[0] && mark[1].length >= fence.length) fence = "";
    } else if (!fence) {
      const match = line.match(/^[ \t]*(?:(\d+)(?:[:.)]|번[:.)]?)|Q(\d+)(?:[:.)])?)(?:[ \t]?)/);
      if (match) markers.push({ number: Number(match[1] ?? match[2]), start: offset, content: offset + match[0].length });
    }
    offset += line.length;
  }
  const slice = (start: number, end: number, number: number | null): AnswerSlice | null => {
    const text = raw.slice(start, end);
    const leading = text.match(/^(?:[ \t]*\r?\n)+/)?.[0].length ?? 0;
    const trailing = text.slice(leading).match(/(?:\r?\n[ \t]*)+$/)?.[0].length ?? 0;
    const from = start + leading;
    const to = end - trailing;
    return from < to ? { number, text: raw.slice(from, to), start: from, end: to } : null;
  };
  if (!markers.length) return [slice(0, raw.length, null)].filter((part): part is AnswerSlice => part !== null);
  return [slice(0, markers[0].start, null), ...markers.map((marker, index) => slice(marker.content, markers[index + 1]?.start ?? raw.length, marker.number))].filter((part): part is AnswerSlice => part !== null);
};
export const readAnswerState = (text: string) => {
  const value = text.replace(/[\s.。]/g, "").toLowerCase();
  if (["없음", "없어", "없습니다", "모름", "모르겠음", "패스", "-", "x"].includes(value)) return "없음";
  if (["나중에", "보류", "다음에"].includes(value)) return "나중에";
  return "답함";
};
export interface AnswerReceipt {
  file: string; sha256: string; start: number; end: number; number: number | null; receivedAt: string;
}
export interface AnswerIndex { version: 1; questions: Record<string, AnswerReceipt[]>; unnumbered: AnswerReceipt[]; unknown: AnswerReceipt[] }
export const emptyAnswerIndex = (): AnswerIndex => ({ version: 1, questions: {}, unnumbered: [], unknown: [] });
/** 원문 파일과 offset이 모두 맞아야 답을 재생성합니다. */
export const receiptText = (receipt: AnswerReceipt, read: (file: string) => string) => {
  const raw = read(receipt.file);
  if (sha256(raw) !== receipt.sha256 || receipt.start < 0 || receipt.end > raw.length || receipt.end <= receipt.start) throw new Error("원문이 바뀌었거나 답 범위가 올바르지 않습니다");
  const part = splitAnswers(raw).find((part) => part.start === receipt.start && part.end === receipt.end && part.number === receipt.number);
  if (!part) throw new Error("답 범위가 원문의 번호 경계와 다릅니다");
  return part.text;
};
export const answerHistoryText = (receipts: AnswerReceipt[], read: (file: string) => string) => receipts.map((receipt, index) => `${index ? `\n\n[${receipt.receivedAt} 다시 받음]\n` : ""}${receiptText(receipt, read)}`).join("");
