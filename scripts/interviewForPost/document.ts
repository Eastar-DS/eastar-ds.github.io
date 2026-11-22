import { field, outsideFences } from "../postWork/markdown.ts";
export interface Question { number: number; title: string; line: number; start: number; end: number; text: string; fields: Record<string, string>; answer: string; answerStart: number; answerEnd: number }
/** 질문의 답은 가변 길이 백틱 펜스로 저장하므로 답 안의 코드 펜스가 문서를 깨지 않습니다. */
export const parseInterviewMd = (text: string) => {
  const visible = outsideFences(text).split("\n");
  const lines = text.split("\n");
  const starts = visible.flatMap((line, index) => /^### Q\d+\. /.test(line) ? [index] : []);
  const questions = starts.map((start, index): Question => {
    const next = starts[index + 1] ?? lines.length;
    const sectionEnd = visible.findIndex((line, at) => at > start && at < next && /^## /.test(line));
    const end = sectionEnd >= 0 ? sectionEnd : next;
    const body = lines.slice(start, end).join("\n");
    const fields = Object.fromEntries(outsideFences(body).split("\n").flatMap((line) => { const match = line.match(/^- ([^:]+):[ \t]*(.*)\r?$/); return match ? [[match[1], match[2].trim()]] : []; }));
    const heading = lines[start].match(/^### Q(\d+)\. (.*)\r?$/)!;
    const answerLabel = lines.findIndex((line, at) => at >= start && at < end && /^- 답:[ \t]*\r?$/.test(line));
    let answerStart = -1;
    let answerEnd = -1;
    if (answerLabel >= 0) {
      const opening = lines.findIndex((line, at) => at > answerLabel && at < end && /^`{4,}(?:text)?\r?$/.test(line));
      if (opening >= 0) {
        const fence = lines[opening].match(/^(`+)/)![1];
        const closing = lines.findIndex((line, at) => at > opening && at < end && line.replace(/\r$/, "") === fence);
        if (closing >= 0) { answerStart = opening; answerEnd = closing; }
      }
    }
    return { number: Number(heading[1]), title: heading[2], line: start + 1, start, end, text: body, fields, answer: answerStart < 0 ? "" : lines.slice(answerStart + 1, answerEnd).join("\n"), answerStart, answerEnd };
  });
  const appendix = text.slice(text.indexOf("\n## 번호 없는 답"));
  const unnumbered = appendix.match(/\n(`{4,})(?:text)?\r?\n([\s\S]*?)\n\1(?:\r?\n|$)/)?.[2] ?? "";
  return { status: field(text.split(/^## /m)[0], "상태"), questions, unnumbered };
};
