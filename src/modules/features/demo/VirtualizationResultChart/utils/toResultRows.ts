import type {
  Measurement,
  ResultRow,
} from "@/modules/features/demo/VirtualizationResultChart/types/measurement";

interface FormatValueParams {
  value: number;
  unit: Measurement["unit"];
}

const formatValue = ({ value, unit }: FormatValueParams) =>
  `${value.toLocaleString("ko-KR")}${unit}`;

/**
 * 측정값을 차트 항목으로 바꿉니다. 막대 길이는 항목마다 개선 전 값을 1로 두고 견줍니다(항목마다 단위와 크기가 달라서 한 축에 두지 않음).
 * 줄어든 정도는 소수점 아래를 반올림한 백분율입니다.
 */
const toResultRows = (measurements: Measurement[]) =>
  measurements.map(({ label, condition, before, after, unit }) => {
    const row: ResultRow = {
      label,
      condition,
      before: { text: formatValue({ value: before, unit }), ratio: 1 },
      after: {
        text: formatValue({ value: after, unit }),
        ratio: before === 0 ? 0 : after / before,
      },
      reduction: `${Math.round((1 - after / before) * 100)}% 줄어듦`,
    };

    return row;
  });

export default toResultRows;
