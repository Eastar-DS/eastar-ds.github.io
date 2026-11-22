import { describe, expect, it } from "vitest";

import createRssChannel from ".";

describe("createRssChannel", () => {
  it("Atom 네임스페이스와, 피드 제 주소를 가리키는 atom:link self와 언어를 담는다", () => {
    expect(createRssChannel()).toEqual({
      xmlns: { atom: "http://www.w3.org/2005/Atom" },
      customData:
        '<language>ko</language><atom:link href="https://eastar-ds.github.io/rss.xml" rel="self" type="application/rss+xml"/>',
    });
  });
});
