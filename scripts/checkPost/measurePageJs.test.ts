import { gzipSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import measurePageJs from "./measurePageJs.ts";

const encode = (text: string) => new TextEncoder().encode(text);
const gzip = (text: string) => gzipSync(encode(text)).byteLength;

// 빌드 결과(_astro)의 모양을 줄여 옮겼습니다: 렌더러(client)가 React 덩어리를 부르고, 데모가 React 덩어리와 자기 부품을 부릅니다
const FILES: Record<string, string> = {
  "_astro/client.js": 'import{a as e}from"./react.js";import"./runtime.js";export const render=1;',
  "_astro/react.js": 'import"./runtime.js";export const a=1;',
  "_astro/runtime.js": "export const r=1;",
  "_astro/Demo.js": 'import{a as e}from"./react.js";import{s}from"./Slider.js";const later=()=>import("./Comments.js");',
  "_astro/Slider.js": "export const s=1;",
  "_astro/Comments.js": "export const c=1;",
};

const readBytes = (path: string) => (FILES[path] === undefined ? undefined : encode(FILES[path] ?? ""));

describe("measurePageJs", () => {
  it("인라인 스크립트와 데모 섬의 정적 import를 따라가 gzip 크기를 더한다", () => {
    const inline = "document.documentElement.classList.remove('no-js');";
    const html = `<head><script>${inline}</script><script type="application/ld+json">{"a":1}</script></head>
<body><astro-island component-url="/_astro/Demo.js" renderer-url="/_astro/client.js" opts="{&quot;name&quot;:&quot;VirtualListDemo&quot;}"></astro-island></body>`;
    const result = measurePageJs({ html, readBytes });
    const staticFiles = ["client.js", "react.js", "runtime.js", "Demo.js", "Slider.js"];

    expect(result.files.map((file) => file.path).sort()).toEqual(["(인라인 1)", ...staticFiles.map((name) => `_astro/${name}`)].sort());
    expect(result.totalGzipBytes).toBe(gzip(inline) + staticFiles.reduce((sum, name) => sum + gzip(FILES[`_astro/${name}`] ?? ""), 0));
    expect(result.islands).toEqual([{ name: "VirtualListDemo", ownGzipBytes: gzip(FILES["_astro/Demo.js"] ?? "") + gzip(FILES["_astro/Slider.js"] ?? "") }]);
    expect(result.lazyFiles.map((file) => file.path)).toEqual(["_astro/Comments.js"]);
    expect(result.missingFiles).toEqual([]);
  });

  it("script src와 modulepreload도 출발점으로 보고, 없는 파일은 따로 알린다", () => {
    const html = '<script type="module" src="/_astro/Slider.js"></script><link rel="modulepreload" href="/_astro/missing.js">';
    const result = measurePageJs({ html, readBytes });

    expect(result.files.map((file) => file.path)).toEqual(["_astro/Slider.js", "_astro/missing.js"]);
    expect(result.missingFiles).toEqual(["_astro/missing.js"]);
  });
});
