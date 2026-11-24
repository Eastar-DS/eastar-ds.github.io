/**
 * 글 폴더의 `knot-topic-folder.png`(폴더 「고객 문의」를 창 폭 440px로 찍은 그림) 위에 이름표 틀을 얹을 자리입니다.
 * 값은 찍은 범위(440×392 CSS px)에 대한 비율(%)이고, 찍는 스크립트가 폴더 이름(`h3`와 문서 수), 카드(`ul`), 둘째 행(`li`)의 위치를 재서 남긴 값입니다.
 * 그림을 다시 찍으면 이 값도 다시 잽니다.
 */
export const FOLDER_SHOT_MARKS = [
  { label: "폴더 이름", kind: "header", left: 4.55, top: 4.08, width: 16.7, height: 6.12 },
  { label: "카드", kind: "card", left: 3.64, top: 13.27, width: 92.73, height: 82.65 },
  { label: "행", kind: "row", left: 3.64, top: 29.59, width: 92.73, height: 16.58 },
] as const;
