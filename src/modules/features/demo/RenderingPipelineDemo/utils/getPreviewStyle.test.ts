import { describe, expect, it } from "vitest";

import getPreviewStyle from "./getPreviewStyle";

describe("getPreviewStyle", () => {
  it("고른 속성 하나만 바꾼다", () => {
    expect(getPreviewStyle({ propertyId: "width", progress: 50 })).toEqual({
      width: "calc(48px + (100% - 48px) * 0.5)",
    });
    expect(getPreviewStyle({ propertyId: "transform", progress: 100 })).toEqual(
      { transform: "translateX(calc((100cqw - 48px) * 1))" },
    );
    expect(
      getPreviewStyle({ propertyId: "background-color", progress: 25 }),
    ).toEqual({
      backgroundColor:
        "color-mix(in oklab, var(--color-accent) 25%, var(--color-accent-soft))",
    });
  });

  it("0~100 밖의 값은 끝값으로 맞춘다", () => {
    expect(getPreviewStyle({ propertyId: "width", progress: 140 })).toEqual({
      width: "calc(48px + (100% - 48px) * 1)",
    });
  });
});
