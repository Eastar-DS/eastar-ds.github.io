const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/** 그려진 제목 HTML에서 태그를 지우고 글자만 남깁니다. 앵커 링크의 이름(「제목」 절의 주소)에 씁니다 */
const toPlainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39);/g, (entity) => HTML_ENTITIES[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim();

export default toPlainText;
