// fonteditor-core는 subset이 빈 배열이면 글자를 고르지 않고 글꼴 전체를 남깁니다(D2Coding이면 1MB 넘게).
// 코드 칸에 한글이 하나도 없는 빌드에서도 작은 파일이 나오도록, 넣을 글자가 없으면 공백 하나만 넣습니다.
const SPACE = 0x20;

/** 글꼴에 남길 글자를 fonteditor-core의 subset 값(코드 포인트 배열)으로 바꿉니다 */
const toSubsetCodePoints = (characters: string[]) =>
  characters.length > 0
    ? characters.map((character) => character.codePointAt(0) ?? 0)
    : [SPACE];

export default toSubsetCodePoints;
