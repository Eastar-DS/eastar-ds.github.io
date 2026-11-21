interface GetRowOffsetsParams {
  rowCount: number;
  /** 구분선을 뺀 행 하나의 높이(px) */
  rowHeight: number;
  /** 행 사이 구분선 두께(px). 두 번째 행부터 위쪽에 그어서 그 행의 높이에 들어갑니다 */
  dividerPx: number;
}

/**
 * 높이가 같은 행이 쌓인 카드에서 행마다 위쪽 끝의 위치를 구합니다.
 * 행 수보다 하나 긴 배열을 돌려주고, 마지막 값이 카드 높이입니다.
 * 요약 없는 행(64px)과 구분선(1px)이면 `[0, 64, 129, 194, …]`입니다.
 */
const getRowOffsets = ({ rowCount, rowHeight, dividerPx }: GetRowOffsetsParams) => {
  const offsets = [0];

  for (let index = 0; index < rowCount; index += 1) {
    const divider = index === 0 ? 0 : dividerPx;

    offsets.push(offsets[index] + rowHeight + divider);
  }

  return offsets;
};

export default getRowOffsets;
