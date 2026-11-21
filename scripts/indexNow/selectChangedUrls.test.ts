import { describe, expect, it } from "vitest";

import { createIndexNowBody, parsePreviousManifest, selectChangedPaths } from "./selectChangedUrls.ts";

describe("selectChangedPaths", () => {
  const previous = { "/": "a1", "/about/": "b1", "/posts/old-post/": "c1" };

  it("새로 생긴 페이지와 글이 바뀐 페이지를 고른다", () => {
    expect(
      selectChangedPaths({
        previous,
        current: { "/": "a2", "/about/": "b1", "/posts/old-post/": "c1", "/posts/new-post/": "d1" },
      }),
    ).toEqual(["/", "/posts/new-post/"]);
  });

  it("없어진 페이지도 골라 검색 엔진이 색인에서 빼게 한다", () => {
    expect(selectChangedPaths({ previous, current: { "/": "a2", "/about/": "b1" } })).toEqual([
      "/",
      "/posts/old-post/",
    ]);
  });

  it("글이 바뀐 페이지가 없으면 아무것도 고르지 않는다", () => {
    expect(selectChangedPaths({ previous, current: { ...previous } })).toEqual([]);
  });

  it("배포된 목록이 없는 처음 배포는 모든 페이지를 고른다", () => {
    expect(selectChangedPaths({ previous: null, current: { "/about/": "b1", "/": "a1" } })).toEqual(["/", "/about/"]);
  });
});

describe("parsePreviousManifest", () => {
  it("200이면 배포된 목록을 읽는다", () => {
    expect(parsePreviousManifest({ status: 200, body: '{"version":1,"pages":{"/":"a1"}}' })).toEqual({
      kind: "found",
      manifest: { "/": "a1" },
    });
  });

  it("404면 처음 배포로 본다", () => {
    expect(parsePreviousManifest({ status: 404, body: "Not Found" })).toEqual({ kind: "first" });
  });

  it("그 밖의 응답이나 모양이 다른 내용은 알 수 없음으로 보고 보내지 않게 한다", () => {
    expect(parsePreviousManifest({ status: 503, body: "" }).kind).toBe("unknown");
    expect(parsePreviousManifest({ status: 200, body: "<html>" }).kind).toBe("unknown");
    expect(parsePreviousManifest({ status: 200, body: '{"version":1}' }).kind).toBe("unknown");
  });
});

describe("createIndexNowBody", () => {
  it("사이트 이름, 키, 키 파일 주소, 절대 주소 목록을 담는다", () => {
    expect(
      createIndexNowBody({
        paths: ["/", "/posts/new-post/"],
        siteUrl: "https://eastar-ds.github.io",
        key: "0123456789abcdef",
      }),
    ).toEqual({
      host: "eastar-ds.github.io",
      key: "0123456789abcdef",
      keyLocation: "https://eastar-ds.github.io/0123456789abcdef.txt",
      urlList: ["https://eastar-ds.github.io/", "https://eastar-ds.github.io/posts/new-post/"],
    });
  });

  it("한 번에 1만 개까지만 담는다", () => {
    const paths = Array.from({ length: 10_001 }, (_, index) => `/posts/post-${index}/`);

    expect(createIndexNowBody({ paths, siteUrl: "https://eastar-ds.github.io", key: "k" }).urlList).toHaveLength(10_000);
  });
});
