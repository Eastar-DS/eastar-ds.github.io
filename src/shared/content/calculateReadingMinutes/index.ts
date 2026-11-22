// 한글 글을 소리 내지 않고 읽을 때 흔히 잡는 속도입니다. 코드도 글자 수에 넣어 조금 넉넉하게 잡힙니다
const CHARACTERS_PER_MINUTE = 500;

/** MDX 원문에서 공백과 표시를 뺀 글자 수를 셉니다. 코드 내용도 셉니다. */
export const countPostCharacters = (body: string) => {
  const text = body
    .replace(/^(import|export)\s.*$/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/[#*_`>[\]|-]/g, "");
  return text.replace(/\s/g, "").length;
};

/** MDX 원문에서 읽는 시간(분)을 셉니다. 가장 짧아도 1분입니다 */
const calculateReadingMinutes = (body: string) => {
  return Math.max(1, Math.round(countPostCharacters(body) / CHARACTERS_PER_MINUTE));
};

export default calculateReadingMinutes;
