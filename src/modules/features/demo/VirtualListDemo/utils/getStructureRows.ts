import type {
  ListRanges,
  StructureRow,
} from "@/modules/features/demo/VirtualListDemo/types/virtualList";

import getRowKind from "./getRowKind";

interface GetStructureRowsParams {
  rowCount: number;
  rowHeight: number;
  viewportHeight: number;
  scrollTop: number;
  /** 몇 분의 1로 줄여 그리는지. 3이면 화면 높이의 3배를 스크롤 칸 높이에 담습니다 */
  scale: number;
  ranges: ListRanges;
  isVirtualized: boolean;
}

/**
 * 구조 보기에 그릴 행을 구합니다. 구조 보기는 화면을 가운데에 두고 그 위아래까지 목록을 줄여 보여 줍니다.
 * 행마다 구조 보기 맨 위에서의 위치(`top`, px)와 상태(`kind`)를 돌려줍니다. 목록 밖(맨 위보다 위, 맨 끝보다 아래)에는 행이 없습니다.
 * `viewTop`은 구조 보기 안에서 화면(스크롤 칸)이 시작하는 위치입니다.
 */
const getStructureRows = ({
  rowCount,
  rowHeight,
  viewportHeight,
  scrollTop,
  scale,
  ranges,
  isVirtualized,
}: GetStructureRowsParams) => {
  const windowHeight = viewportHeight * scale;
  const windowStart = scrollTop - (windowHeight - viewportHeight) / 2;
  const first = Math.max(0, Math.floor(windowStart / rowHeight));
  const last = Math.min(
    rowCount,
    Math.ceil((windowStart + windowHeight) / rowHeight),
  );
  const rows = Array.from({ length: Math.max(0, last - first) }, (_, k) => {
    const index = first + k;
    const row: StructureRow = {
      index,
      kind: getRowKind({ index, ranges, isVirtualized }),
      top: (index * rowHeight - windowStart) / scale,
    };

    return row;
  });

  return {
    rows,
    rowHeight: rowHeight / scale,
    viewTop: (scrollTop - windowStart) / scale,
    viewHeight: viewportHeight / scale,
  };
};

export default getStructureRows;
