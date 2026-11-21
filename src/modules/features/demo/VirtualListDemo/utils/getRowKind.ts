import type {
  ListRanges,
  RowKind,
  RowRange,
} from "@/modules/features/demo/VirtualListDemo/types/virtualList";

interface GetRowKindParams {
  index: number;
  ranges: ListRanges;
  isVirtualized: boolean;
}

interface IsInRangeParams {
  index: number;
  range: RowRange;
}

const isInRange = ({ index, range }: IsInRangeParams) =>
  range.start <= index && index < range.end;

/** 행 하나가 보이는 행인지, 미리 그린 행인지, 화면 밖에 그린 행인지, 그리지 않은 행인지 고릅니다 */
const getRowKind = ({ index, ranges, isVirtualized }: GetRowKindParams) => {
  let kind: RowKind = "notDrawn";

  if (isInRange({ index, range: ranges.visible })) kind = "visible";
  else if (isInRange({ index, range: ranges.drawn }))
    kind = isVirtualized ? "overscan" : "offscreen";

  return kind;
};

export default getRowKind;
