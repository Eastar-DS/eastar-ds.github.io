// 코드 칸 · 본문 속 코드에서 코드 글꼴(--font-mono)로 그려지는 한글의 범위
// 한글 자모(U+1100–11FF), 호환용 자모(U+3130–318F), 완성형 음절(U+AC00–D7A3)
const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힣]/g;
const FENCED_CODE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[ \t]*$/gm;
const INLINE_CODE = /`[^`\n]+`/g;

/**
 * MDX 원문에서 코드 글꼴로 그려지는 한글(코드 칸 · 코드 칸 파일 이름 · 본문 속 코드)을 모아 겹치지 않게 정렬합니다.
 * 코드용 한글 부분 글꼴에 넣을 글자를 고르는 데 씁니다.
 */
const collectCodeHangul = (mdx: string) => {
  const fencedBlocks = mdx.match(FENCED_CODE) ?? [];
  const withoutFences = mdx.replace(FENCED_CODE, "");
  const inlineCodes = withoutFences.match(INLINE_CODE) ?? [];
  const characters = [...fencedBlocks, ...inlineCodes].join("").match(HANGUL) ?? [];

  return [...new Set(characters)].sort();
};

export default collectCodeHangul;
