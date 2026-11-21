import { describe, expect, it } from "vitest";

import toResultRows from "./toResultRows";

describe("toResultRows", () => {
  it("값에 단위와 쉼표를 붙이고 줄어든 정도를 백분율로 쓴다", () => {
    const [row] = toResultRows([
      { label: "목록이 보일 때까지", before: 966, after: 46, unit: "ms" },
    ]);

    expect(row.before.text).toBe("966ms");
    expect(row.after.text).toBe("46ms");
    expect(row.reduction).toBe("95% 줄어듦");
  });

  it("막대 길이는 개선 전 값을 1로 두고 견준다", () => {
    const [row] = toResultRows([
      { label: "화면 요소 수", before: 17696, after: 354, unit: "개" },
    ]);

    expect(row.before).toEqual({ text: "17,696개", ratio: 1 });
    expect(row.after.text).toBe("354개");
    expect(row.after.ratio).toBeCloseTo(0.02, 3);
    expect(row.reduction).toBe("98% 줄어듦");
  });

  it("측정 조건이 있으면 함께 넘긴다", () => {
    const [row] = toResultRows([
      {
        label: "목록이 보일 때까지",
        condition: "세션 녹화 켬",
        before: 1729,
        after: 67,
        unit: "ms",
      },
    ]);

    expect(row.condition).toBe("세션 녹화 켬");
    expect(row.reduction).toBe("96% 줄어듦");
  });
});
