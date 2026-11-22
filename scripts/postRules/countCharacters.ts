export { countPostCharacters } from "../../src/shared/content/calculateReadingMinutes/index.ts";
/** 제목과 요약은 공백과 문장 부호를 넣은 코드 포인트 수로 셉니다. */
export const countTitleCharacters = (text: string) => [...text].length;
