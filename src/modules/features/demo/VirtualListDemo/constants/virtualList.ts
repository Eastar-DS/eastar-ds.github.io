/** 목록의 행 수. 글에서 다룬 문서 1,939개와 비슷한 크기로 잡았습니다 */
export const ROW_COUNT = 2000;

/** 행 하나의 높이(px). `ui/DocumentRows.module.css`의 `.row` 높이와 같아야 합니다 */
export const ROW_HEIGHT_PX = 40;

/** 스크롤 칸의 높이(px). 행 6개가 보입니다. `index.module.css`의 `.viewport` 높이와 같아야 합니다 */
export const VIEWPORT_HEIGHT_PX = 240;

/** 화면 위아래로 넓혀서 미리 그릴 거리(px). 슬라이더로 바꾸고, 한 칸이 행 하나입니다 */
export const OVERSCAN_PX = {
  min: 0,
  max: 240,
  step: ROW_HEIGHT_PX,
  initial: 80,
} as const;

/**
 * 구조 보기가 목록을 몇 분의 1로 줄여 그리는지.
 * 화면 높이의 3배(위 · 화면 · 아래)를 스크롤 칸과 같은 높이에 담아서, 위아래 여유 거리를 최대 240px까지 보여 줍니다.
 */
export const STRUCTURE_SCALE = 3;

/** 행에 붙이는 지어낸 문서 제목. 행 번호를 따라 돌아가며 씁니다 */
export const DOCUMENT_TITLES = [
  "배포 일정 논의",
  "검색 화면 개선안",
  "온보딩 흐름 점검",
  "알림 설정 정리",
  "로그인 오류 돌아보기",
  "다음 분기 목표",
  "디자인 검토 메모",
  "성능 측정 결과 공유",
] as const;
