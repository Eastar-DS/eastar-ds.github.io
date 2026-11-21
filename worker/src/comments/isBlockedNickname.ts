import { BLOCKED_NICKNAME_WORDS } from "../constants/comments";

// 한글 음절을 초성 · 중성 · 종성으로 나눌 때 쓰는 표 (유니코드 한글 음절 배열 순서)
const ONSETS = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const VOWELS = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
// 겹받침은 두 자음으로 풀어 둡니다(ㄺ → ㄹㄱ)
const CODAS = ["", "ㄱ", "ㄲ", "ㄱㅅ", "ㄴ", "ㄴㅈ", "ㄴㅎ", "ㄷ", "ㄹ", "ㄹㄱ", "ㄹㅁ", "ㄹㅂ", "ㄹㅅ", "ㄹㅌ", "ㄹㅍ", "ㄹㅎ", "ㅁ", "ㅂ", "ㅂㅅ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

const SYLLABLE_START = 0xac00;
const SYLLABLE_END = 0xd7a3;
// 낱자로 남은 첫소리 · 가운뎃소리 · 끝소리 자모 (NFKC가 호환용 자모 ㄱ · ㅏ를 이 자모로 바꿉니다)
const ONSET_JAMO_START = 0x1100;
const VOWEL_JAMO_START = 0x1161;
const CODA_JAMO_START = 0x11a8;

/** 소리 나지 않는 첫소리 ㅇ. 앞 글자의 받침이 넘어오면(연음) 지웁니다 */
const SILENT_ONSET = "@";

// 된소리 · 거센소리를 예사소리로, 소리가 비슷한 모음을 하나로 모읍니다(이쓰타 · 이스따 → 이스타)
const SIMILAR_SOUNDS: Record<string, string> = {
  ㄲ: "ㄱ",
  ㅋ: "ㄱ",
  ㄸ: "ㄷ",
  ㅌ: "ㄷ",
  ㅃ: "ㅂ",
  ㅍ: "ㅂ",
  ㅆ: "ㅅ",
  ㅉ: "ㅈ",
  ㅊ: "ㅈ",
  ㅐ: "ㅔ",
  ㅒ: "ㅖ",
  ㅢ: "ㅣ",
  ㅙ: "ㅞ",
  ㅚ: "ㅞ",
};

// 한글 사이에 섞어 쓰는 비슷한 꼴의 글자: l · I · | · 1 · ! → ㅣ, o · 0 → ㅇ (ㅇl스타 → 이스타)
const HANGUL_LOOKALIKES: [RegExp, string][] = [
  [/[lI|1!]/g, "ᅵ"],
  [/[oO0]/g, "ᄋ"],
];

// 숫자 · 기호로 바꿔 쓴 영문(3a5t4r → eastar)
const LATIN_LOOKALIKES: Record<string, string> = {
  "4": "a",
  "@": "a",
  "3": "e",
  "1": "i",
  "!": "i",
  "0": "o",
  "5": "s",
  $: "s",
  "7": "t",
};

const NOT_HANGUL = /[^ᄀ-ᇿ㄰-㆏가-힣]/g;

const isVowel = (token: string) => VOWELS.includes(token);

const toJamoTokens = (text: string) =>
  [...text].flatMap((character) => {
    const code = character.codePointAt(0) ?? 0;

    if (code >= SYLLABLE_START && code <= SYLLABLE_END) {
      const index = code - SYLLABLE_START;
      const onset = ONSETS[Math.floor(index / 588)] ?? "";
      const vowel = VOWELS[Math.floor((index % 588) / 28)] ?? "";
      const coda = CODAS[index % 28] ?? "";

      return [onset === "ㅇ" ? SILENT_ONSET : onset, vowel, ...coda];
    }
    if (code >= ONSET_JAMO_START && code < ONSET_JAMO_START + ONSETS.length) {
      return [ONSETS[code - ONSET_JAMO_START] ?? ""];
    }
    if (code >= VOWEL_JAMO_START && code < VOWEL_JAMO_START + VOWELS.length) {
      return [VOWELS[code - VOWEL_JAMO_START] ?? ""];
    }
    if (code >= CODA_JAMO_START && code < CODA_JAMO_START + CODAS.length - 1) {
      return [...(CODAS[code - CODA_JAMO_START + 1] ?? "")];
    }

    return [character];
  });

// 받침 뒤에 소리 없는 ㅇ이 오면 받침이 넘어갑니다(글쓴이 → 글쓰니). 받침 ㅇ은 넘어가지 않습니다
const linkSounds = (tokens: string[]) =>
  tokens.filter(
    (token, index) =>
      !(
        token === SILENT_ONSET &&
        index > 0 &&
        tokens[index - 1] !== "ㅇ" &&
        !isVowel(tokens[index - 1] ?? "") &&
        tokens[index - 1] !== SILENT_ONSET
      ),
  );

/**
 * 한글 낱말을 소리 꼴로 바꿉니다. 띄어쓰기 · 기호 · 영문은 지우고, 자모로 나눠 쓴 글자는 다시 모읍니다.
 * 예: 「이 스 타」, 「ㅇㅣㅅㅡㅌㅏ」, 「이쓰타」 → 모두 같은 값
 */
export const toHangulKey = (text: string) => {
  const compatible = HANGUL_LOOKALIKES.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text.normalize("NFKC"),
  );
  const hangulOnly = compatible.replace(NOT_HANGUL, "").normalize("NFC");

  return linkSounds(toJamoTokens(hangulOnly))
    .map((token) => SIMILAR_SOUNDS[token] ?? token)
    .join("");
};

/** 영문 낱말을 비교용 꼴로 바꿉니다. 숫자 · 기호로 바꿔 쓴 글자를 되돌리고 영문만 남깁니다 */
export const toLatinKey = (text: string) =>
  [...text.normalize("NFKC").toLowerCase()]
    .map((character) => LATIN_LOOKALIKES[character] ?? character)
    .join("")
    .replace(/[^a-z]/g, "");

const HANGUL_WORD = /[가-힣]/;

/**
 * 방문자가 쓸 수 없는 닉네임인지 봅니다. 막는 낱말이 닉네임 어디에든 들어 있으면 막습니다.
 * 띄어쓰기 · 기호 · 자모 나눠 쓰기 · 된소리 · 거센소리 · 비슷한 꼴 글자(l → ㅣ)를 같은 낱말로 봅니다.
 */
const isBlockedNickname = (nickname: string, words: readonly string[] = BLOCKED_NICKNAME_WORDS) => {
  const hangulKey = toHangulKey(nickname);
  const latinKey = toLatinKey(nickname);

  return words.some((word) =>
    HANGUL_WORD.test(word) ? hangulKey.includes(toHangulKey(word)) : latinKey.includes(toLatinKey(word)),
  );
};

export default isBlockedNickname;
