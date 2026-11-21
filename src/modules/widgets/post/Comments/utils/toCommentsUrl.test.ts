import { describe, expect, it } from "vitest";

import toCommentsUrl from "./toCommentsUrl";

describe("toCommentsUrl", () => {
  it("목록 주소에 글 주소를 넣는다", () => {
    expect(
      toCommentsUrl({ workerUrl: "https://eastar-blog.example.workers.dev", postPath: "/posts/browser-layout-and-paint/" }),
    ).toBe("https://eastar-blog.example.workers.dev/comments?postPath=%2Fposts%2Fbrowser-layout-and-paint%2F");
  });

  it("Worker 주소 끝의 / 는 하나로 맞춘다", () => {
    expect(toCommentsUrl({ workerUrl: "http://127.0.0.1:8787/" })).toBe("http://127.0.0.1:8787/comments");
  });
});
