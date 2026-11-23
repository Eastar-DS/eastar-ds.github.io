import { describe, expect, it } from "vitest";

import checkDist, { readPngSize, type DistFiles } from "./checkDist.ts";
import type { PostMeta } from "./types.ts";

const SLUG = "virtual-list-row-range";
const URL_ = `https://eastar-ds.github.io/posts/${SLUG}/`;
const META: PostMeta = {
  title: "목록 가상화의 계산: 행 위치, 그릴 범위, 카드 높이",
  description: "행 높이를 그리기 전에 계산하는 방법을 다룹니다.",
  publishedAt: "2026-11-21",
  category: "React",
  draft: false,
};

const png = ({ width, height, size = 100 }: { width: number; height: number; size?: number }) => {
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);

  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  view.setUint32(16, width);
  view.setUint32(20, height);

  return bytes;
};

const PAGE = `<!DOCTYPE html><html lang="ko"><head>
<title>${META.title} · 이스타의 개발 노트</title>
<meta name="description" content="${META.description}">
<link rel="canonical" href="${URL_}">
<meta property="og:type" content="article">
<meta property="og:title" content="${META.title}">
<meta property="og:description" content="${META.description}">
<meta property="og:url" content="${URL_}">
<meta property="og:image" content="${URL_}og.png">
<meta property="og:image:alt" content="${META.title}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${META.title}">
<meta name="twitter:description" content="${META.description}">
<meta name="twitter:image" content="${URL_}og.png">
<script type="application/ld+json">${JSON.stringify({
  "@type": "BlogPosting",
  headline: META.title,
  description: META.description,
  url: URL_,
  image: `${URL_}og.png`,
  datePublished: "2026-11-21T00:00:00+09:00",
  dateModified: "2026-11-21T00:00:00+09:00",
  author: { "@type": "Person", name: "김동성" },
})}</script>
<script type="application/ld+json">${JSON.stringify({
  "@type": "BreadcrumbList",
  itemListElement: [{ item: "https://eastar-ds.github.io/" }, { item: URL_ }],
})}</script>
<script type="module">document.documentElement.dataset.ready = "1";</script>
</head><body><main><h1>${META.title}</h1>
<h2 id="행-높이는-그리기-전에-어떻게-알까">행 높이</h2>
<a href="#행-높이는-그리기-전에-어떻게-알까">목차</a>
<a href="/posts/virtualized-document-list/#정리">1편</a>
<a href="https://developer.mozilla.org/">MDN</a>
</main></body></html>`;

const FIRST_PAGE = '<html><body><main><h2 id="정리">정리</h2></main></body></html>';

const createDist = (files: Record<string, string | Uint8Array>) => {
  const dist: DistFiles = {
    readText: (path) => {
      const file = files[path];

      return typeof file === "string" ? file : undefined;
    },
    readBytes: (path) => {
      const file = files[path];

      return file === undefined ? undefined : typeof file === "string" ? new TextEncoder().encode(file) : file;
    },
    listFiles: () => Object.keys(files),
  };

  return dist;
};

const goodFiles = () => ({
  "index.html": '<a href="/posts/virtual-list-row-range/">글</a>',
  [`posts/${SLUG}/index.html`]: PAGE,
  [`posts/${SLUG}/og.png`]: png({ width: 1200, height: 630 }),
  "posts/virtualized-document-list/index.html": FIRST_PAGE,
  "rss.xml": `<rss><item><link>${URL_}</link></item></rss>`,
  "sitemap-index.xml": "<sitemapindex><sitemap><loc>https://eastar-ds.github.io/sitemap-0.xml</loc></sitemap></sitemapindex>",
  "sitemap-0.xml": `<urlset><url><loc>${URL_}</loc></url></urlset>`,
  "llms.txt": `- [${META.title}](${URL_}): 요약`,
});

const statusOf = (results: ReturnType<typeof checkDist>) => Object.fromEntries(results.map((result) => [result.id, result.status]));

describe("checkDist: 게시할 글", () => {
  it("메타, 구조화 데이터, 그림, 피드, 링크가 맞으면 모두 통과한다", () => {
    const results = checkDist({ slug: SLUG, meta: META, dist: createDist(goodFiles()) });

    expect(results.filter((result) => result.status !== "pass")).toEqual([
      expect.objectContaining({ id: "dist-fact-check", status: "skip", basis: "docs/content-guide.md 10.3, 12장" }),
    ]);
    expect(results.find((result) => result.id === "dist-js")?.summary).toMatch(/^0\.\dKB \/ 예산 5\.0KB \(데모 없음\)$/);
  });

  it("og:title에 사이트 이름이 붙거나 BlogPosting이 없으면 실패한다", () => {
    const page = PAGE.replace(`property="og:title" content="${META.title}"`, `property="og:title" content="${META.title} · 이스타의 개발 노트"`).replace(
      /<script type="application\/ld\+json">\{"@type":"BlogPosting"[^<]*<\/script>/,
      "",
    );
    const results = checkDist({ slug: SLUG, meta: META, dist: createDist({ ...goodFiles(), [`posts/${SLUG}/index.html`]: page }) });

    expect(statusOf(results)).toMatchObject({ "dist-og": "fail", "dist-blogposting": "fail" });
    expect(results.find((result) => result.id === "dist-og")?.findings[0]?.message).toContain("og:title");
  });

  it("RSS, 사이트맵, llms.txt에 없으면 실패한다", () => {
    const files = { ...goodFiles(), "rss.xml": "<rss></rss>", "llms.txt": "# 사이트" };
    const feeds = checkDist({ slug: SLUG, meta: META, dist: createDist(files) }).find((result) => result.id === "dist-feeds");

    expect(feeds?.findings.map((finding) => finding.message)).toEqual(["RSS(rss.xml)에 없습니다", "llms.txt에 없습니다"]);
  });

  it("공유 그림 크기가 다르거나 없는 페이지 자리로 가는 링크는 실패한다", () => {
    const files = {
      ...goodFiles(),
      [`posts/${SLUG}/og.png`]: png({ width: 1200, height: 600 }),
      "posts/virtualized-document-list/index.html": "<main></main>",
    };
    const results = checkDist({ slug: SLUG, meta: META, dist: createDist(files) });

    expect(results.find((result) => result.id === "dist-og-image")?.findings[0]?.message).toBe("1200×600 (기대 1200×630)");
    expect(results.find((result) => result.id === "dist-links")?.findings[0]?.message).toBe("/posts/virtualized-document-list/#정리: #정리 자리가 없습니다");
  });

  it("글 페이지가 없으면 그 실패 하나만 낸다", () => {
    const { [`posts/${SLUG}/index.html`]: _page, ...files } = goodFiles();

    expect(statusOf(checkDist({ slug: SLUG, meta: META, dist: createDist(files) }))).toEqual({ "dist-fact-check": "skip", "dist-page": "fail" });
  });
});

describe("checkDist: 초안", () => {
  it("글 페이지 항목은 건너뜀으로 내고, 빌드에 새지 않았으면 통과한다", () => {
    const files = {
      "index.html": "<main></main>",
      "rss.xml": "<rss></rss>",
      "sitemap-index.xml": "<sitemapindex></sitemapindex>",
      "llms.txt": "# 사이트",
    };
    const results = checkDist({ slug: SLUG, meta: { ...META, draft: true }, dist: createDist(files) });

    expect(results.filter((result) => result.status === "skip")).toHaveLength(11);
    expect(results.find((result) => result.id === "dist-draft-excluded")?.status).toBe("pass");
  });

  it("초안이 RSS나 다른 페이지 링크에 새면 실패한다", () => {
    const results = checkDist({ slug: SLUG, meta: { ...META, draft: true }, dist: createDist(goodFiles()) });

    expect(results.find((result) => result.id === "dist-draft-excluded")?.findings.map((finding) => finding.message)).toEqual([
      `posts/${SLUG}/index.html이 있습니다`,
      `posts/${SLUG}/og.png가 있습니다`,
      "RSS에 들어 있습니다",
      "사이트맵에 들어 있습니다",
      "llms.txt에 들어 있습니다",
      "index.html이 이 초안으로 링크합니다",
    ]);
  });
});

describe("readPngSize", () => {
  it("PNG 머리에서 폭과 높이를 읽고, PNG가 아니면 undefined", () => {
    expect(readPngSize(png({ width: 1200, height: 630 }))).toEqual({ width: 1200, height: 630 });
    expect(readPngSize(new TextEncoder().encode("GIF89a........................"))).toBeUndefined();
  });
});


it("한국 날짜 0시 대신 같은 날 UTC 0시나 한국 9시를 쓴 BlogPosting은 실패한다", () => {
  for (const wrong of ["2026-11-21T00:00:00.000Z", "2026-11-21T09:00:00+09:00"]) {
    const files = { ...goodFiles(), [`posts/${SLUG}/index.html`]: PAGE.replaceAll("2026-11-21T00:00:00+09:00", wrong) };
    const result = checkDist({ slug: SLUG, meta: META, dist: createDist(files) }).find((result) => result.id === "dist-blogposting");
    expect(result?.status).toBe("fail");
    expect(result?.findings.some((finding) => finding.message.includes("datePublished"))).toBe(true);
  }
});

it("시리즈 글은 사이트, 시리즈, 글 세 단계의 Breadcrumb을 검사한다", () => {
  const meta = { ...META, series: { id: "virtual-list", name: "목록 가상화", order: 2 } };
  const files = goodFiles();
  const inspect = () => checkDist({ slug: SLUG, meta, dist: createDist(files) }).find((r) => r.id === "dist-breadcrumb");
  expect(inspect()?.status).toBe("fail");
  files[`posts/${SLUG}/index.html`] = PAGE.replace('{"item":"https://eastar-ds.github.io/"},', '{"item":"https://eastar-ds.github.io/"},{"item":"https://eastar-ds.github.io/series/virtual-list/"},');
  expect(inspect()?.status).toBe("pass");
});
