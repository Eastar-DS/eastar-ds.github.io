// 글꼴에 넣을 글자를 빌드 결과(HTML · RSS · CSS · JS)에서 모으는 순수 함수들입니다.

// 한글 자모(U+1100–11FF), 호환용 자모(U+3130–318F), 완성형 음절(U+AC00–D7A3)
const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힣]/u;

// 사이트 글꼴에 늘 넣는 글자: 출력 가능한 ASCII 전체. 숫자 · 영문은 날짜 · 읽는 시간처럼 빌드마다 달라질 수 있습니다
export const ASCII_PRINTABLE = Array.from({ length: 0x7e - 0x20 + 1 }, (_, index) =>
  String.fromCharCode(0x20 + index),
);

/**
 * HTML 문자 참조(&#xAC00; &#44032;)를 글자로 되돌립니다.
 * JS의 유니코드 이스케이프(백슬래시 u)는 풀지 않습니다. 번들 속 정규식의 범위 경계까지 글자로 잘못 잡히고,
 * 화면에 그리는 한글은 번들에 이스케이프 없이 그대로 들어 있기 때문입니다.
 */
export const decodeEscapes = (content: string) =>
  content
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number(decimal)));

const isVisible = (character: string) => {
  const code = character.codePointAt(0) ?? 0;

  return code >= 0x20 && code !== 0x7f && !(code >= 0x80 && code < 0xa0);
};

const sortUnique = (characters: Iterable<string>) =>
  [...new Set(characters)].sort((a, b) => (a.codePointAt(0) ?? 0) - (b.codePointAt(0) ?? 0));

/** 사이트 글꼴(Blog Sans · JetBrains Mono)에 넣을 글자. 빌드 결과에 나온 보이는 글자와 출력 가능한 ASCII입니다 */
export const collectSiteCharacters = (contents: string[]) =>
  sortUnique([
    ...ASCII_PRINTABLE,
    ...contents.flatMap((content) => [...decodeEscapes(content)].filter(isVisible)),
  ]);

const CODE_ELEMENT = /<(pre|code)\b[^>]*>([\s\S]*?)<\/\1>/gi;

/** HTML의 코드(<pre> · <code>) 안에 나온 한글. 코드용 한글 글꼴(Blog Code Hangul)에 넣습니다 */
export const collectCodeHangul = (htmlContents: string[]) =>
  sortUnique(
    htmlContents.flatMap((html) =>
      [...html.matchAll(CODE_ELEMENT)].flatMap((match) =>
        [...decodeEscapes((match[2] ?? "").replace(/<[^>]*>/g, ""))].filter((character) =>
          HANGUL.test(character),
        ),
      ),
    ),
  );
