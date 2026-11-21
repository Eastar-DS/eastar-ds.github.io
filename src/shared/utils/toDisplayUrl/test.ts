import { describe, expect, it } from "vitest";

import toDisplayUrl from ".";

describe("toDisplayUrl", () => {
  it.each([
    ["https://github.com/eastar-DS", "github.com/eastar-DS"],
    ["https://eastar-ds.github.io/", "eastar-ds.github.io"],
    ["https://eastar-ds.github.io/portfolio/", "eastar-ds.github.io/portfolio"],
    ["http://knoted.kr", "knoted.kr"],
  ])("%s 를 %s 로 보인다", (url, expected) => {
    expect(toDisplayUrl(url)).toBe(expected);
  });
});
