import type {
  ListRanges,
  RowCounts,
} from "@/modules/features/demo/VirtualListDemo/types/virtualList";

interface GetRowCountsParams {
  rowCount: number;
  ranges: ListRanges;
}

/**
 * 데모 아래 숫자 칸에 보일 행 수를 셉니다.
 * 보이는 행 위아래에서 그린 행은 가상화를 켰으면 여유 행, 껐으면 화면 밖에 그린 행입니다.
 */
const getRowCounts = ({ rowCount, ranges }: GetRowCountsParams) => {
  const { visible, drawn } = ranges;
  const drawnCount = drawn.end - drawn.start;

  const counts: RowCounts = {
    drawn: drawnCount,
    visible: visible.end - visible.start,
    above: Math.max(0, visible.start - drawn.start),
    below: Math.max(0, drawn.end - visible.end),
    notDrawn: rowCount - drawnCount,
  };

  return counts;
};

export default getRowCounts;
