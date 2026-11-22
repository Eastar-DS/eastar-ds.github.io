// 빌드 결과(dist)에서 글 페이지의 메타, 구조화 데이터, 피드, JavaScript 크기를 검사하는 순수 함수입니다(docs/content-guide.md 10.6).
// 파일은 넘겨받은 읽기 함수로만 읽어서, 시험에서는 메모리 속 파일로 돌립니다.
import { SITE } from "../../src/shared/constants/site/index.ts";
import { DIST } from "./constants.ts";
import measurePageJs from "./measurePageJs.ts";
import type { CheckResult, Finding, PostMeta } from "./types.ts";

export interface DistFiles {
  /** dist 안 경로(예: `posts/글-이름/index.html`)의 글. 없으면 `undefined` */
  readText: (path: string) => string | undefined;
  readBytes: (path: string) => Uint8Array | undefined;
  /** dist 안의 모든 파일 경로 */
  listFiles: () => string[];
}

const decodeEntities = (text: string) =>
  text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal: string) => String.fromCodePoint(Number(decimal)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const readAttributes = (tag: string) =>
  Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1] ?? "", decodeEntities(match[2] ?? "")]));

/** `<meta>`를 name · property별 content로 모읍니다 */
export const readMetaTags = (html: string) => {
  const head = html.slice(0, html.search(/<\/head>/i) + 1 || html.length);
  const metas = new Map<string, string>();

  [...head.matchAll(/<meta\b[^>]*>/gi)].forEach(([tag]) => {
    const attrs = readAttributes(tag);
    const key = attrs.property ?? attrs.name;

    if (key && attrs.content !== undefined && !metas.has(key)) metas.set(key, attrs.content);
  });

  return metas;
};

export const readJsonLds = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((match) => {
    try {
      return [JSON.parse(match[1] ?? "") as Record<string, unknown>];
    } catch {
      return [];
    }
  });

/** PNG 머리에서 폭과 높이를 읽습니다. PNG가 아니면 `undefined` */
export const readPngSize = (bytes: Uint8Array) => {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  if (bytes.length < 24 || signature.some((byte, index) => bytes[index] !== byte)) return undefined;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  return { width: view.getUint32(16), height: view.getUint32(20) };
};

const toKb = (bytes: number) => `${(bytes / 1024).toFixed(1)}KB`;

const result = ({ id, label, findings, passSummary, basis, fix }: Omit<CheckResult, "status" | "summary"> & { passSummary: string }) => {
  const checkResult: CheckResult = {
    id,
    label,
    status: findings.length > 0 ? "fail" : "pass",
    summary: findings.length > 0 ? `${findings.length}곳` : passSummary,
    findings,
    basis,
    fix: findings.length > 0 ? fix : undefined,
  };

  return checkResult;
};

/** 사이트 안 주소를 dist 안 파일 경로로 바꿉니다. 사이트 밖 주소면 `undefined` */
const toDistFile = (pathname: string) => {
  const clean = pathname.replace(/^\/+/, "");

  if (clean === "" || clean.endsWith("/")) return `${clean}index.html`;

  return clean;
};

const decodePath = (text: string) => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

const findIds = (html: string) => new Set([...html.matchAll(/\sid="([^"]*)"/g)].map((match) => decodeEntities(match[1] ?? "")));

interface CheckDistParams {
  slug: string;
  meta: PostMeta;
  dist: DistFiles;
}

const postUrl = (slug: string) => new URL(`/posts/${slug}/`, SITE.url).href;

const isInFeeds = ({ slug, dist }: { slug: string; dist: DistFiles }) => {
  const url = postUrl(slug);
  const sitemapFiles = [...(dist.readText("sitemap-index.xml") ?? "").matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    toDistFile(new URL(match[1] ?? "", SITE.url).pathname),
  );

  return {
    rss: (dist.readText("rss.xml") ?? "").includes(`<link>${url}</link>`),
    sitemap: sitemapFiles.some((file) => (dist.readText(file) ?? "").includes(`<loc>${url}</loc>`)),
    llms: (dist.readText("llms.txt") ?? "").includes(`(${url})`),
    hasRss: dist.readText("rss.xml") !== undefined,
    hasSitemap: sitemapFiles.length > 0,
    hasLlms: dist.readText("llms.txt") !== undefined,
  };
};

/** 초안이 배포 빌드에서 빠졌는지 봅니다 */
const checkDraftExcluded = ({ slug, dist }: Omit<CheckDistParams, "meta">) => {
  const feeds = isInFeeds({ slug, dist });
  const linkPattern = new RegExp(`href="(?:${SITE.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})?/posts/${slug}/?[#"]`);
  const linkingPages = dist
    .listFiles()
    .filter((file) => file.endsWith(".html") && !file.startsWith(`posts/${slug}/`))
    .filter((file) => linkPattern.test(dist.readText(file) ?? ""));
  const findings: Finding[] = [
    ...(dist.readText(`posts/${slug}/index.html`) !== undefined ? [{ message: `posts/${slug}/index.html이 있습니다` }] : []),
    ...(dist.readBytes(`posts/${slug}/og.png`) !== undefined ? [{ message: `posts/${slug}/og.png가 있습니다` }] : []),
    ...(feeds.rss ? [{ message: "RSS에 들어 있습니다" }] : []),
    ...(feeds.sitemap ? [{ message: "사이트맵에 들어 있습니다" }] : []),
    ...(feeds.llms ? [{ message: "llms.txt에 들어 있습니다" }] : []),
    ...linkingPages.map((file) => ({ message: `${file}이 이 초안으로 링크합니다` })),
  ];

  const skipped = [
    ["dist-page", "글 페이지"],
    ["dist-meta", "title · description · canonical"],
    ["dist-og", "og · twitter 메타"],
    ["dist-og-image", "공유 미리보기 그림"],
    ["dist-blogposting", "BlogPosting"],
    ["dist-breadcrumb", "BreadcrumbList"],
    ["dist-h1", "페이지의 h1"],
    ["dist-links", "페이지 안 링크"],
    ["dist-feeds", "RSS · 사이트맵 · llms.txt"],
    ["dist-js", "페이지 JS (gzip)"],
  ].map(([id = "", label = ""]) => {
    const skip: CheckResult = {
      id,
      label,
      status: "skip",
      summary: "초안이라 배포 빌드에 글이 없습니다. draft 줄을 지운 뒤 빌드해 다시 봅니다",
      findings: [],
      basis: DIST.basis,
    };

    return skip;
  });

  return [
    ...skipped,
    result({
      id: "dist-draft-excluded",
      label: "배포 빌드에서 초안 빠짐",
      findings,
      passSummary: "글 페이지, 공유 그림, RSS, 사이트맵, llms.txt, 다른 페이지의 링크 어디에도 없습니다",
      basis: "docs/content-guide.md 1장 `draft`, 12장",
      fix: "`getPosts`를 거치지 않고 글을 읽는 곳이 있는지 봅니다. 다른 페이지의 링크는 그 페이지의 관련 글 설정(`relatedPostSlugs`)이나 본문 링크를 봅니다.",
    }),
  ];
};

/** 게시할 글의 빌드 결과를 검사합니다. 초안이면 배포 빌드에서 빠졌는지만 봅니다 */
const checkDist = ({ slug, meta, dist }: CheckDistParams) => {
  if (meta.draft) return checkDraftExcluded({ slug, dist });

  const pagePath = `posts/${slug}/index.html`;
  const html = dist.readText(pagePath);
  const url = postUrl(slug);

  if (html === undefined) {
    return [
      result({
        id: "dist-page",
        label: "글 페이지",
        findings: [{ message: `dist/${pagePath}가 없습니다` }],
        passSummary: "",
        basis: DIST.basis,
        fix: "`pnpm build`를 다시 돌리고, 앞머리에 `draft: true`가 남아 있지 않은지 봅니다.",
      }),
    ];
  }

  const metas = readMetaTags(html);
  const title = decodeEntities(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? "");
  const canonical = readAttributes(/<link\b[^>]*rel="canonical"[^>]*>/i.exec(html)?.[0] ?? "").href;
  const ogImageUrl = `${url}og.png`;
  const expect = ({ name, actual, expected }: { name: string; actual: string | undefined; expected: string }) =>
    actual === expected ? [] : [{ message: `${name}: 「${actual ?? "(없음)"}」, 기대 「${expected}」` }];
  const expectPresent = ({ name, actual }: { name: string; actual: string | undefined }) =>
    actual?.trim() ? [] : [{ message: `${name}가 없습니다` }];

  const results: CheckResult[] = [
    result({
      id: "dist-page",
      label: "글 페이지",
      findings: [],
      passSummary: `dist/${pagePath}`,
      basis: DIST.basis,
    }),
    result({
      id: "dist-meta",
      label: "title · description · canonical",
      findings: [
        ...expect({ name: "<title>", actual: title, expected: `${meta.title ?? ""}${DIST.titleSeparator}${SITE.title}` }),
        ...expect({ name: "meta description", actual: metas.get("description"), expected: meta.description ?? "" }),
        ...expect({ name: "canonical", actual: canonical, expected: url }),
      ],
      passSummary: "앞머리와 같습니다",
      basis: `${DIST.basis}, docs/content-guide.md 2.1`,
      fix: "`createPageMeta`와 글 페이지(`pages/posts/[slug]`)를 봅니다.",
    }),
    result({
      id: "dist-og",
      label: "og · twitter 메타",
      findings: [
        ...expect({ name: "og:title", actual: metas.get("og:title"), expected: meta.title ?? "" }),
        ...expect({ name: "og:description", actual: metas.get("og:description"), expected: meta.description ?? "" }),
        ...expect({ name: "og:url", actual: metas.get("og:url"), expected: url }),
        ...expect({ name: "og:type", actual: metas.get("og:type"), expected: "article" }),
        ...expect({ name: "og:image", actual: metas.get("og:image"), expected: ogImageUrl }),
        ...expectPresent({ name: "og:image:alt", actual: metas.get("og:image:alt") }),
        ...expect({ name: "twitter:card", actual: metas.get("twitter:card"), expected: "summary_large_image" }),
        ...expect({ name: "twitter:title", actual: metas.get("twitter:title"), expected: meta.title ?? "" }),
        ...expect({ name: "twitter:description", actual: metas.get("twitter:description"), expected: meta.description ?? "" }),
        ...expect({ name: "twitter:image", actual: metas.get("twitter:image"), expected: ogImageUrl }),
      ],
      passSummary: "제목, 요약, 주소, 그림이 맞습니다",
      basis: `${DIST.basis}, ${DIST.ogImageBasis}`,
      fix: "`createPageMeta`, `getOgImage`, `Document`를 봅니다.",
    }),
  ];

  const ogImage = dist.readBytes(`posts/${slug}/og.png`);
  const pngSize = ogImage ? readPngSize(ogImage) : undefined;

  results.push(
    result({
      id: "dist-og-image",
      label: "공유 미리보기 그림",
      findings: [
        ...(ogImage ? [] : [{ message: `dist/posts/${slug}/og.png가 없습니다` }]),
        ...(ogImage && !pngSize ? [{ message: "PNG가 아닙니다" }] : []),
        ...(pngSize && (pngSize.width !== DIST.ogImage.width || pngSize.height !== DIST.ogImage.height)
          ? [{ message: `${pngSize.width}×${pngSize.height} (기대 ${DIST.ogImage.width}×${DIST.ogImage.height})` }]
          : []),
        ...(ogImage && ogImage.byteLength > DIST.ogImage.maxBytes ? [{ message: `${toKb(ogImage.byteLength)} (상한 ${toKb(DIST.ogImage.maxBytes)})` }] : []),
      ],
      passSummary: `${DIST.ogImage.width}×${DIST.ogImage.height}, ${ogImage ? toKb(ogImage.byteLength) : ""}`,
      basis: DIST.ogImageBasis,
      fix: "글 폴더의 `og.png`를 1200×630, 300KB 이하로 다시 만듭니다.",
    }),
  );

  const jsonLds = readJsonLds(html);
  const blogPosting = jsonLds.find((item) => item["@type"] === "BlogPosting");
  const breadcrumb = jsonLds.find((item) => item["@type"] === "BreadcrumbList");
  const toIso = (value: string | undefined) => (value ? new Date(value).toISOString() : undefined);
  const expectedPublished = toIso(meta.publishedAt) ?? "";
  const author = blogPosting?.author as { name?: string } | undefined;

  results.push(
    result({
      id: "dist-blogposting",
      label: "BlogPosting",
      findings: blogPosting
        ? [
            ...expect({ name: "headline", actual: blogPosting.headline as string | undefined, expected: meta.title ?? "" }),
            ...expect({ name: "description", actual: blogPosting.description as string | undefined, expected: meta.description ?? "" }),
            ...expect({ name: "url", actual: blogPosting.url as string | undefined, expected: url }),
            ...expect({ name: "datePublished", actual: blogPosting.datePublished as string | undefined, expected: expectedPublished }),
            ...expect({
              name: "dateModified",
              actual: blogPosting.dateModified as string | undefined,
              expected: toIso(meta.updatedAt) ?? expectedPublished,
            }),
            ...expectPresent({ name: "author.name", actual: author?.name }),
            ...expect({ name: "image", actual: blogPosting.image as string | undefined, expected: ogImageUrl }),
          ]
        : [{ message: "BlogPosting JSON-LD가 없습니다" }],
      passSummary: "작성자, 발행일, 수정일, 그림이 맞습니다",
      basis: `${DIST.basis}, .claude/rules/seo-guide.md`,
      fix: "`createBlogPostingJsonLd`를 봅니다.",
    }),
  );

  const crumbs = (breadcrumb?.itemListElement as { item?: string }[] | undefined) ?? [];

  results.push(
    result({
      id: "dist-breadcrumb",
      label: "BreadcrumbList",
      findings: breadcrumb
        ? [
            ...expect({ name: "첫 항목", actual: crumbs[0]?.item, expected: new URL("/", SITE.url).href }),
            ...expect({ name: "끝 항목", actual: crumbs.at(-1)?.item, expected: url }),
          ]
        : [{ message: "BreadcrumbList JSON-LD가 없습니다" }],
      passSummary: `${crumbs.length}단계 (사이트 → 글)`,
      basis: `${DIST.basis}, .claude/rules/seo-guide.md`,
      fix: "`createBreadcrumbListJsonLd`와 글 페이지를 봅니다.",
    }),
  );

  const h1Count = (html.match(/<h1\b/gi) ?? []).length;

  results.push(
    result({
      id: "dist-h1",
      label: "페이지의 h1",
      findings: h1Count === 1 ? [] : [{ message: `h1이 ${h1Count}개입니다` }],
      passSummary: "1개",
      basis: "docs/content-guide.md 3장",
      fix: "본문의 `#` 제목이나 h1을 그리는 부품을 봅니다.",
    }),
  );

  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? "";
  const ownIds = findIds(html);
  const brokenLinks = [...main.matchAll(/<a\b[^>]*\shref="([^"]*)"/gi)].flatMap((match) => {
    const href = decodeEntities(match[1] ?? "");
    const target = href.startsWith(SITE.url) ? href.slice(SITE.url.length) || "/" : href;

    if (!target.startsWith("/") && !target.startsWith("#")) return [];
    if (target.startsWith("//")) return [];

    const [pathname = "", hash] = target.split("#");
    const file = pathname === "" ? pagePath : toDistFile(pathname);
    const targetHtml = pathname === "" ? html : dist.readText(file);
    const exists = targetHtml !== undefined || dist.readBytes(file) !== undefined;

    if (!exists) return [{ message: `${href}: dist/${file}가 없습니다` }];

    if (hash && targetHtml !== undefined) {
      const ids = pathname === "" ? ownIds : findIds(targetHtml);

      if (!ids.has(decodePath(hash))) return [{ message: `${href}: #${decodePath(hash)} 자리가 없습니다` }];
    }

    return [];
  });

  results.push(
    result({
      id: "dist-links",
      label: "페이지 안 링크",
      findings: [...new Map(brokenLinks.map((finding) => [finding.message, finding])).values()],
      passSummary: "사이트 안 링크와 제목 자리가 모두 있습니다",
      basis: "docs/content-guide.md 10.5",
      fix: "본문 링크, 목차, 이전 · 다음 글, 이어진 프로젝트 링크의 주소를 봅니다.",
    }),
  );

  const feeds = isInFeeds({ slug, dist });

  results.push(
    result({
      id: "dist-feeds",
      label: "RSS · 사이트맵 · llms.txt",
      findings: [
        ...(feeds.rss ? [] : [{ message: feeds.hasRss ? "RSS(rss.xml)에 없습니다" : "rss.xml이 없습니다" }]),
        ...(feeds.sitemap ? [] : [{ message: feeds.hasSitemap ? "사이트맵에 없습니다" : "sitemap-index.xml이 없습니다" }]),
        ...(feeds.llms ? [] : [{ message: feeds.hasLlms ? "llms.txt에 없습니다" : "llms.txt가 없습니다" }]),
      ],
      passSummary: "셋 모두에 들어 있습니다",
      basis: DIST.basis,
      fix: "`pages/rss.xml.ts`, `@astrojs/sitemap` 설정, `createLlmsTxt`를 봅니다.",
    }),
  );

  const pageJs = measurePageJs({ html, readBytes: dist.readBytes });
  const hasDemo = pageJs.islands.length > 0;
  const budget = hasDemo ? DIST.js.withDemoBytes : DIST.js.withoutDemoBytes;
  const jsFindings: Finding[] = [
    ...(pageJs.totalGzipBytes > budget
      ? [{ message: `합계 ${toKb(pageJs.totalGzipBytes)} (${hasDemo ? "데모 있는 글" : "데모 없는 글"} 예산 ${toKb(budget)})` }]
      : []),
    ...pageJs.islands
      .filter((island) => island.ownGzipBytes > DIST.js.demoOwnBytes)
      .map((island) => ({ message: `데모 ${island.name} 자체 코드 ${toKb(island.ownGzipBytes)} (예산 ${toKb(DIST.js.demoOwnBytes)})` })),
    ...pageJs.missingFiles.map((file) => ({ message: `dist/${file}를 읽지 못했습니다` })),
  ];
  const islandSummary = pageJs.islands.map((island) => `${island.name} ${toKb(island.ownGzipBytes)}`).join(", ");
  const lazySummary = pageJs.lazyFiles.length > 0 ? `, 나중에 받는 JS ${toKb(pageJs.lazyFiles.reduce((sum, file) => sum + file.gzipBytes, 0))}` : "";

  results.push(
    result({
      id: "dist-js",
      label: "페이지 JS (gzip)",
      findings: jsFindings,
      passSummary: `${toKb(pageJs.totalGzipBytes)} / 예산 ${toKb(budget)}${hasDemo ? ` (데모 ${islandSummary})` : " (데모 없음)"}${lazySummary}`,
      basis: DIST.jsBasis,
      fix: "데모를 가볍게 하거나 정지 그림으로 바꿉니다(design-system 10장).",
    }),
  );

  return results;
};

export default checkDist;
