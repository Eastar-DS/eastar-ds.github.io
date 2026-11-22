// 빌드된 글 페이지가 받는 JavaScript의 크기(gzip)를 재는 순수 함수입니다(docs/design-system.md 10장 「속도 예산」).
// 페이지의 인라인 스크립트, `<script src>`, `modulepreload`, 데모 섬(astro-island)의 컴포넌트와 렌더러를 출발점으로 정적 import를 따라가 더합니다.
// 동적 import(`import("…")`)는 필요할 때 받는 파일이라 합계에 넣지 않고 따로 셉니다(예: 댓글 칸이 다가올 때 받는 댓글 코드).
import { gzipSync } from "node:zlib";

export interface PageJsFile {
  /** dist 안 경로. 인라인 스크립트는 `(인라인 n)` */
  path: string;
  gzipBytes: number;
}

export interface IslandJs {
  /** 데모 이름(섬의 `opts.name`) */
  name: string;
  /** 렌더러(React 런타임)가 함께 부르는 파일을 뺀 이 데모만의 코드 */
  ownGzipBytes: number;
}

export interface PageJs {
  totalGzipBytes: number;
  files: PageJsFile[];
  islands: IslandJs[];
  /** 동적 import로 나중에 받는 파일 */
  lazyFiles: PageJsFile[];
  /** 읽지 못한 파일 */
  missingFiles: string[];
}

const STATIC_IMPORT = /(?:\bimport|\bexport)\s*(?:[^'"`;()]*?\bfrom\s*)?["']([^"']+\.m?js)["']/g;
const DYNAMIC_IMPORT = /\bimport\(\s*["']([^"']+\.m?js)["']\s*\)/g;

const decodeEntities = (text: string) =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const readAttribute = ({ tag, name }: { tag: string; name: string }) => {
  const value = new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];

  return value === undefined ? undefined : decodeEntities(value);
};

/** `/_astro/x.js`나 `./x.js`를 dist 안 경로(`_astro/x.js`)로 바꿉니다 */
const resolvePath = ({ specifier, from }: { specifier: string; from: string }) => {
  if (/^[a-z]+:\/\//i.test(specifier)) return undefined;

  const base = specifier.startsWith("/") ? [] : from.split("/").slice(0, -1);
  const parts = [...base, ...specifier.split("/")].reduce<string[]>((acc, part) => {
    if (part === "" || part === ".") return acc;
    if (part === "..") return acc.slice(0, -1);

    return [...acc, part];
  }, []);

  return parts.join("/");
};

const gzipSize = (bytes: Uint8Array) => gzipSync(bytes).byteLength;

interface MeasurePageJsParams {
  html: string;
  /** dist 안 경로의 파일을 읽습니다. 없으면 `undefined` */
  readBytes: (path: string) => Uint8Array | undefined;
}

/** 글 페이지의 JavaScript 크기를 잽니다 */
const measurePageJs = ({ html, readBytes }: MeasurePageJsParams) => {
  const missingFiles = new Set<string>();
  const sources = new Map<string, string>();

  const readSource = (path: string) => {
    if (!sources.has(path)) {
      const bytes = readBytes(path);

      if (!bytes) missingFiles.add(path);
      sources.set(path, bytes ? new TextDecoder().decode(bytes) : "");
    }

    return sources.get(path) ?? "";
  };

  const collect = ({ entries, from }: { entries: string[]; from: string }) => {
    const reached = new Set<string>();
    const lazy = new Set<string>();
    const queue = entries.flatMap((entry) => resolvePath({ specifier: entry, from }) ?? []);

    while (queue.length > 0) {
      const path = queue.shift() ?? "";

      if (reached.has(path)) continue;

      reached.add(path);
      const source = readSource(path);

      [...source.matchAll(STATIC_IMPORT)].forEach((match) => {
        const next = resolvePath({ specifier: match[1] ?? "", from: path });

        if (next) queue.push(next);
      });
      [...source.matchAll(DYNAMIC_IMPORT)].forEach((match) => {
        const next = resolvePath({ specifier: match[1] ?? "", from: path });

        if (next) lazy.add(next);
      });
    }

    return { reached, lazy };
  };

  const inlineFiles: PageJsFile[] = [];
  const entries: string[] = [];
  const inlineImports: string[] = [];

  [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].forEach((match) => {
    const attrs = match[1] ?? "";
    const type = readAttribute({ tag: attrs, name: "type" });
    const src = readAttribute({ tag: attrs, name: "src" });

    if (type !== undefined && type !== "module" && type !== "text/javascript") return;

    if (src) {
      entries.push(src);
      return;
    }

    const body = match[2] ?? "";

    if (body.trim() === "") return;

    inlineFiles.push({ path: `(인라인 ${inlineFiles.length + 1})`, gzipBytes: gzipSize(new TextEncoder().encode(body)) });
    [...body.matchAll(STATIC_IMPORT)].forEach((importMatch) => inlineImports.push(importMatch[1] ?? ""));
  });

  [...html.matchAll(/<link\b[^>]*>/gi)].forEach(([tag]) => {
    const href = readAttribute({ tag, name: "href" });

    if (readAttribute({ tag, name: "rel" }) === "modulepreload" && href) entries.push(href);
  });

  const islandTags = [...html.matchAll(/<astro-island\b[^>]*>/gi)].map(([tag]) => tag);
  const islandEntries = islandTags.flatMap((tag) =>
    ["component-url", "renderer-url"].flatMap((name) => readAttribute({ tag, name }) ?? []),
  );
  const page = collect({ entries: [...entries, ...inlineImports, ...islandEntries], from: "index.html" });
  const fileList = [...page.reached].map((path) => ({ path, gzipBytes: gzipSize(readBytes(path) ?? new Uint8Array()) }));
  const sizeOf = (path: string) => fileList.find((file) => file.path === path)?.gzipBytes ?? 0;

  const islands = islandTags.map((tag) => {
    const component = readAttribute({ tag, name: "component-url" });
    const renderer = readAttribute({ tag, name: "renderer-url" });
    const opts = readAttribute({ tag, name: "opts" });
    let name = component ?? "데모";

    try {
      name = (JSON.parse(opts ?? "{}") as { name?: string }).name ?? name;
    } catch {
      // opts를 읽지 못하면 컴포넌트 주소를 이름으로 씁니다
    }

    const own = component ? collect({ entries: [component], from: "index.html" }).reached : new Set<string>();
    const shared = renderer ? collect({ entries: [renderer], from: "index.html" }).reached : new Set<string>();
    const island: IslandJs = {
      name,
      ownGzipBytes: [...own].filter((path) => !shared.has(path)).reduce((sum, path) => sum + sizeOf(path), 0),
    };

    return island;
  });

  const files = [...inlineFiles, ...fileList];
  const pageJs: PageJs = {
    totalGzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0),
    files,
    islands,
    lazyFiles: [...page.lazy]
      .filter((path) => !page.reached.has(path))
      .map((path) => ({ path, gzipBytes: gzipSize(readBytes(path) ?? new Uint8Array()) })),
    missingFiles: [...missingFiles],
  };

  return pageJs;
};

export default measurePageJs;
