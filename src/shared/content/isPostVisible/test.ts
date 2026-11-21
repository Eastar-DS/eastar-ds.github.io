import { describe, expect, it } from "vitest";

import isPostVisible from ".";

describe("isPostVisible", () => {
  it("초안이 아닌 글은 배포 빌드에서도 보인다", () => {
    expect(isPostVisible({ post: { draft: false }, isDev: false })).toBe(true);
    expect(isPostVisible({ post: {}, isDev: false })).toBe(true);
  });

  it("초안은 배포 빌드에서 보이지 않는다", () => {
    expect(isPostVisible({ post: { draft: true }, isDev: false })).toBe(false);
  });

  it("초안도 개발 서버에서는 보인다", () => {
    expect(isPostVisible({ post: { draft: true }, isDev: true })).toBe(true);
  });
});
