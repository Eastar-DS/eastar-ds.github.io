import { field, table } from "../postWork/markdown.ts";
export const parseOutlineMd = (text: string) => {
  const parts = [...text.matchAll(/^## (\d+)편\s*$/gm)].map((match, index, matches) => {
    const start = match.index!;
    const end = matches[index + 1]?.index ?? text.indexOf("\n## 이스타에게 물을 것", start);
    const body = text.slice(start, end < 0 ? undefined : end);
    const line = text.slice(0, start).split("\n").length;
    const rows = (heading: string) => table(body, heading, 3).map((row) => ({ ...row, line: line + row.line - 1 }));
    return { number: Number(match[1]), line, body, question: field(body, "답할 질문"), category: field(body, "분류"), estimate: Number(field(body, "어림 합계").replace(/[,자\s]/g, "")), titles: rows("제목 후보"), descriptions: rows("요약 후보"), slugs: rows("주소 후보"), sections: rows("절"), visuals: rows("데모와 그림 후보") };
  });
  return { status: field(text, "상태"), decision: field(text, "결과"), basis: field(text, "근거"), seriesNames: field(text, "시리즈 이름 후보"), interviewApplied: field(text, "인터뷰 반영"), parts };
};
