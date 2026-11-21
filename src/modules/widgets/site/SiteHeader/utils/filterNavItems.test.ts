import { describe, expect, it } from "vitest";

import { NAV_ITEMS } from "@/shared/routes/paths";

import filterNavItems from "./filterNavItems";

describe("filterNavItems", () => {
  it("시리즈가 있으면 메뉴를 모두 보인다", () => {
    expect(
      filterNavItems({ items: NAV_ITEMS, hasSeries: true }).map(
        (item) => item.label,
      ),
    ).toEqual(["글", "시리즈", "소개"]);
  });

  it("시리즈가 없으면 갈 구획이 없는 「시리즈」 메뉴를 뺀다", () => {
    expect(
      filterNavItems({ items: NAV_ITEMS, hasSeries: false }).map(
        (item) => item.label,
      ),
    ).toEqual(["글", "소개"]);
  });
});
