// 지금 배포된 페이지 목록과 새 빌드의 페이지 목록을 견줘 IndexNow로 알릴 주소를 고르고, 보낼 요청을 만드는 순수 함수들입니다.
import { MAX_URLS_PER_REQUEST } from "./constants.ts";
import type { PageManifest } from "./pageManifest.ts";

interface SelectChangedPathsParams {
  /** 지금 배포된 목록. 아직 한 번도 배포하지 않았으면 `null` */
  previous: PageManifest | null;
  current: PageManifest;
}

/**
 * 알릴 페이지 주소를 고릅니다.
 * - 새로 생긴 페이지와 글이 바뀐 페이지
 * - 없어진 페이지(IndexNow는 지운 주소도 알리라고 함. 검색 엔진이 와서 404를 보고 색인에서 뺌)
 * - 지금 배포된 목록이 없으면(처음 켠 배포) 모든 페이지
 */
export const selectChangedPaths = ({ previous, current }: SelectChangedPathsParams) => {
  if (previous === null) return Object.keys(current).sort();

  const changed = Object.keys(current).filter((pagePath) => current[pagePath] !== previous[pagePath]);
  const removed = Object.keys(previous).filter((pagePath) => !(pagePath in current));

  return [...changed, ...removed].sort();
};

interface CreateIndexNowBodyParams {
  paths: string[];
  /** 사이트 주소. 예: `https://eastar-ds.github.io` */
  siteUrl: string;
  key: string;
}

/** IndexNow에 POST로 보낼 JSON 본문을 만듭니다(IndexNow 문서 「Submitting set of URLs」). 키 파일은 사이트 맨 위에 둡니다 */
export const createIndexNowBody = ({ paths, siteUrl, key }: CreateIndexNowBodyParams) => ({
  host: new URL(siteUrl).host,
  key,
  keyLocation: new URL(`/${key}.txt`, siteUrl).href,
  urlList: paths.slice(0, MAX_URLS_PER_REQUEST).map((pagePath) => new URL(pagePath, siteUrl).href),
});

interface ParsePreviousManifestParams {
  /** 지금 배포된 목록을 받은 응답 코드 */
  status: number;
  body: string;
}

/** 지금 배포된 목록을 받은 결과를 나눕니다. 404는 처음 배포, 200이 아니거나 모양이 다르면 알 수 없음입니다 */
export const parsePreviousManifest = ({ status, body }: ParsePreviousManifestParams) => {
  if (status === 404) return { kind: "first" } as const;
  if (status !== 200) return { kind: "unknown", reason: `응답 코드 ${status}` } as const;

  try {
    const parsed: unknown = JSON.parse(body);
    const pages = (parsed as { pages?: unknown }).pages;

    if (typeof pages !== "object" || pages === null) {
      return { kind: "unknown", reason: "pages 칸이 없습니다" } as const;
    }

    return { kind: "found", manifest: pages as PageManifest } as const;
  } catch {
    return { kind: "unknown", reason: "JSON이 아닙니다" } as const;
  }
};
