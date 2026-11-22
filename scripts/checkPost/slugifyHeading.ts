// 본문 제목(h2 · h3)의 id를 빌드와 같은 규칙으로 만듭니다.
// Astro 7의 마크다운 처리기(@astrojs/markdown-satteri)는 제목 글을 github-slugger로 바꿉니다. 바깥 패키지 없이 돌도록 같은 규칙을 옮겼습니다:
// 소문자로 바꾸고, 글자(L) · 결합 부호(M) · 십진 숫자(Nd) · 글자 숫자(Nl) · 이음 부호(Pc) · 하이픈 · 공백만 남긴 뒤 공백을 하이픈으로 바꿉니다.
// 같은 id가 다시 나오면 `-1`, `-2`를 붙입니다.

const REMOVED_CHARACTERS = /[^\p{L}\p{M}\p{Nd}\p{Nl}\p{Pc} -]/gu;

/** 제목 글 하나를 id로 바꿉니다. 겹침은 보지 않습니다 */
export const slugify = (text: string) => text.toLowerCase().replace(REMOVED_CHARACTERS, "").replace(/ /g, "-");

/** 한 글 안에서 겹치는 id에 번호를 붙이는 id 만들기를 만듭니다. 글마다 새로 만듭니다 */
const createHeadingSlugger = () => {
  const occurrences = new Map<string, number>();

  return (text: string) => {
    const original = slugify(text);
    let result = original;

    while (occurrences.has(result)) {
      const count = (occurrences.get(original) ?? 0) + 1;

      occurrences.set(original, count);
      result = `${original}-${count}`;
    }

    occurrences.set(result, 0);

    return result;
  };
};

/** 마크다운 제목 줄의 글을 화면에 보이는 글로 바꿉니다: 인라인 코드의 백틱, 링크 주소, 굵게 · 기울임 표시, 태그를 뺍니다 */
export const toHeadingText = (markdown: string) =>
  markdown
    .replace(/(`+)(.*?)\1/g, "$2")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(^|[^\w*])\*(\S(?:.*?\S)?)\*(?![\w*])/g, "$1$2")
    .replace(/(^|[^\w_])_(\S(?:.*?\S)?)_(?![\w_])/g, "$1$2")
    .trim();

export default createHeadingSlugger;
