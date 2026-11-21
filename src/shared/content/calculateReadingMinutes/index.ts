// 한글 글을 소리 내지 않고 읽을 때 흔히 잡는 속도입니다. 코드도 글자 수에 넣어 조금 넉넉하게 잡힙니다
const CHARACTERS_PER_MINUTE = 500;

/** MDX 원문에서 읽는 시간(분)을 셉니다. 가장 짧아도 1분입니다 */
const calculateReadingMinutes = (body: string) => {
  const text = body
    .replace(/^(import|export)\s.*$/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/[#*_`>[\]|-]/g, "");
  const characterCount = text.replace(/\s/g, "").length;

  return Math.max(1, Math.round(characterCount / CHARACTERS_PER_MINUTE));
};

export default calculateReadingMinutes;
