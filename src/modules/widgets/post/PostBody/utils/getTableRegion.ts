interface GetTableRegionParams {
  /** 표를 감싼 칸의 내용 폭(`scrollWidth`) */
  scrollWidth: number;
  /** 표를 감싼 칸의 보이는 폭(`clientWidth`) */
  clientWidth: number;
  /** 표를 감싼 `<figure>`의 설명(figcaption) id. 있으면 그 설명이 칸의 이름이 됩니다 */
  captionId?: string;
  /** 표 머리 칸의 글. 설명이 없을 때 이름을 짓는 데 씁니다 */
  headers: string[];
}

// 폭이 소수 픽셀일 때 반올림 차이로 넘친다고 잘못 보지 않게 1px은 봐줍니다
const OVERFLOW_TOLERANCE_PX = 1;

// 설명이 없는 표의 이름에 넣는 머리 칸 수. 이름이 길어지지 않게 앞의 몇 칸만 씁니다
const MAX_HEADERS_IN_LABEL = 3;

/**
 * 표를 감싼 칸이 가로로 넘칠 때 키보드로 밀 수 있는 이름 있는 칸(region)으로 만들지 정합니다.
 * 넘치지 않으면 `undefined`(Tab이 멈추지 않는 보통 칸)이고, 넘치면 이름을 돌려줍니다.
 * 이름은 표 설명(「표 1. …」)이 있으면 그 id(`labelledBy`), 없으면 「표: 머리 칸, …」(`label`)입니다.
 * 모든 표가 같은 이름 「표」를 가지면 화면 낭독기의 구획 목록에서 서로 구별되지 않아서입니다.
 */
const getTableRegion = ({ scrollWidth, clientWidth, captionId, headers }: GetTableRegionParams) => {
  if (scrollWidth <= clientWidth + OVERFLOW_TOLERANCE_PX) return undefined;
  if (captionId) return { labelledBy: captionId };

  const names = headers
    .map((header) => header.trim())
    .filter((header) => header !== "")
    .slice(0, MAX_HEADERS_IN_LABEL);

  return { label: names.length > 0 ? `표: ${names.join(", ")}` : "표" };
};

export default getTableRegion;
