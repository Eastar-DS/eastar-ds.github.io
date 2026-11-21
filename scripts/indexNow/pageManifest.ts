// 빌드 결과(dist)의 HTML에서 페이지마다 「검색 엔진이 읽는 글」의 해시를 만드는 순수 함수들입니다.
// 다음 배포 때 지금 배포된 해시 목록과 견줘, 글이 실제로 바뀐 페이지만 IndexNow로 알립니다.
import { createHash } from "node:crypto";

/** 페이지 주소별 글 해시 */
export type PageManifest = Record<string, string>;

interface DistPage {
  /** dist 안의 상대 경로. 예: `posts/글-이름/index.html` */
  file: string;
  html: string;
}

/**
 * dist의 HTML 파일 경로를 페이지 주소로 바꿉니다. 주소 끝에 / 가 붙는 `index.html`만 페이지로 보고(`trailingSlash: "always"`),
 * `404.html`처럼 주소가 없는 파일은 `undefined`입니다.
 */
export const toPagePath = (file: string) => {
  const normalized = file.split("\\").join("/");

  if (normalized === "index.html") return "/";
  if (!normalized.endsWith("/index.html")) return undefined;

  return `/${normalized.slice(0, -"index.html".length)}`;
};

const NOINDEX = /<meta\s+name="robots"\s+content="[^"]*noindex/i;

/**
 * 페이지에서 검색 엔진이 읽는 글만 꺼냅니다: `<title>`, meta description, `<main>`의 글.
 * 머리말과 꼬리말, 태그의 속성(클래스, 빌드 파일 이름), 스크립트와 스타일은 빼서, 화면 모양만 바뀐 빌드는 같은 글로 봅니다.
 * 검색에 내보내지 않는 페이지(noindex)는 `undefined`입니다.
 */
export const extractPageText = (html: string) => {
  if (NOINDEX.test(html)) return undefined;

  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] ?? "";
  const main = (html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  return [title, description, main].map((text) => text.replace(/\s+/g, " ").trim()).join("\n");
};

const hashText = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 16);

/** dist의 HTML 페이지들로 주소별 글 해시 목록을 만듭니다. 404와 noindex 페이지는 빠집니다 */
export const createPageManifest = (pages: DistPage[]) =>
  Object.fromEntries(
    pages.flatMap(({ file, html }) => {
      const pagePath = toPagePath(file);
      const text = pagePath === undefined ? undefined : extractPageText(html);

      return pagePath === undefined || text === undefined ? [] : [[pagePath, hashText(text)]];
    }),
  ) as PageManifest;
