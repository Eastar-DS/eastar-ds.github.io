import { describe, expect, it } from "vitest";

import { makePost, SERIES_FIRST_SOURCE } from "../checkPost/fixtures.ts";
import classifyLinkResult from "./classifyLinkResult.ts";
import collectExternalLinks from "./collectExternalLinks.ts";

describe("collectExternalLinks", () => {
  it("바깥 주소만 한 번씩 모으고 나오는 글과 줄을 적는다", () => {
    const source = `${SERIES_FIRST_SOURCE}\n[다시 MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) [사이트](https://eastar-ds.github.io/about/)\n\n\`\`\`ts\nfetch("https://example.com/in-code");\n\`\`\`\n`;
    const links = collectExternalLinks([makePost({ slug: "virtualized-document-list", source })]);

    expect(links).toEqual([
      {
        url: "https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility",
        places: ["virtualized-document-list:27", "virtualized-document-list:56"],
      },
    ]);
  });
});

describe("classifyLinkResult", () => {
  it("2xx와 3xx는 통과, 404 · 410 · 없는 도메인은 깨짐, 나머지는 확인 못 함", () => {
    expect([200, 301, 404, 410, 403, 429, 503].map((status) => classifyLinkResult({ status }))).toEqual([
      "ok",
      "ok",
      "broken",
      "broken",
      "unknown",
      "unknown",
      "unknown",
    ]);
    expect(classifyLinkResult({ error: "getaddrinfo ENOTFOUND no-such.example" })).toBe("broken");
    expect(classifyLinkResult({ error: "The operation was aborted due to timeout" })).toBe("unknown");
  });
});
