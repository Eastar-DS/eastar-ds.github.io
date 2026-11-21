/**
 * 배포할 때 바뀐 페이지 주소를 IndexNow로 검색 엔진에 알립니다. GitHub Actions 배포 워크플로(.github/workflows/deploy.yml)가 돌립니다.
 *
 * 쓰는 법
 * - `node scripts/indexNow.ts plan`: `pnpm build` 뒤, 배포 전에 돌립니다.
 *   1. dist의 페이지마다 글 해시를 만들어 `dist/indexnow-pages.json`에 씁니다(이 파일도 함께 배포됩니다).
 *   2. 지금 사이트에 배포된 `indexnow-pages.json`을 받아 견주고, 새로 생기거나 글이 바뀌거나 없어진 페이지 주소를 고릅니다.
 *   3. 고른 주소를 GitHub Actions 출력 `urls`(JSON 배열)로 넘깁니다.
 * - `node scripts/indexNow.ts submit`: 배포가 끝난 뒤 돌립니다. 환경 변수 `INDEXNOW_URLS`(JSON 배열)의 주소를 IndexNow에 보냅니다.
 *
 * 둘 다 실패해도 0으로 끝나서 배포를 막지 않고, 응답 코드와 이유를 로그에 남깁니다.
 * 바깥 패키지를 쓰지 않아 `pnpm install` 없이 Node 24로 바로 돌아갑니다.
 */
import { appendFileSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

import { SITE } from "../src/shared/constants/site/index.ts";
import { INDEXNOW_ENDPOINT, INDEXNOW_KEY, PAGE_MANIFEST_FILE } from "./indexNow/constants.ts";
import { createPageManifest } from "./indexNow/pageManifest.ts";
import { createIndexNowBody, parsePreviousManifest, selectChangedPaths } from "./indexNow/selectChangedUrls.ts";

const DIST = path.resolve(import.meta.dirname, "..", "dist");
const FETCH_TIMEOUT_MS = 20_000;

const warn = (message: string) => console.log(`::warning::IndexNow: ${message}`);

const walk = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);

    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
  });

const setOutput = (name: string, value: string) => {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
};

const fetchPreviousManifest = async () => {
  // GitHub Pages 앞의 캐시가 예전 목록을 주지 않게 매번 다른 쿼리를 붙입니다
  const url = `${new URL(PAGE_MANIFEST_FILE, SITE.url).href}?t=${Date.now()}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

    return parsePreviousManifest({ status: response.status, body: await response.text() });
  } catch (error) {
    return { kind: "unknown", reason: error instanceof Error ? error.message : String(error) } as const;
  }
};

const plan = async () => {
  if (!existsSync(DIST)) {
    warn("dist가 없습니다. pnpm build 뒤에 돌리세요.");
    setOutput("urls", "[]");
    return;
  }

  const pages = walk(DIST)
    .filter((file) => file.endsWith(".html"))
    .map((file) => ({ file: path.relative(DIST, file), html: readFileSync(file, "utf8") }));
  const current = createPageManifest(pages);

  writeFileSync(path.join(DIST, PAGE_MANIFEST_FILE), `${JSON.stringify({ version: 1, pages: current }, null, 2)}\n`);
  console.log(`페이지 ${Object.keys(current).length}개의 글 해시를 ${PAGE_MANIFEST_FILE}에 썼습니다.`);

  const previous = await fetchPreviousManifest();

  if (previous.kind === "unknown") {
    warn(`지금 배포된 ${PAGE_MANIFEST_FILE}을 읽지 못해 이번에는 보내지 않습니다(${previous.reason}).`);
    setOutput("urls", "[]");
    return;
  }

  if (previous.kind === "first") {
    console.log(`배포된 ${PAGE_MANIFEST_FILE}이 없어 처음 배포로 보고 모든 페이지를 고릅니다.`);
  }

  const paths = selectChangedPaths({
    previous: previous.kind === "found" ? previous.manifest : null,
    current,
  });
  const urls = paths.map((pagePath) => new URL(pagePath, SITE.url).href);

  console.log(urls.length > 0 ? `알릴 주소 ${urls.length}개:\n${urls.join("\n")}` : "글이 바뀐 페이지가 없습니다.");
  setOutput("urls", JSON.stringify(urls));
};

const readUrlsFromEnv = () => {
  try {
    const parsed: unknown = JSON.parse(process.env.INDEXNOW_URLS ?? "[]");

    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    warn("INDEXNOW_URLS가 JSON 배열이 아닙니다.");
    return [];
  }
};

const submit = async () => {
  const urls = readUrlsFromEnv();

  if (urls.length === 0) {
    console.log("보낼 주소가 없습니다.");
    return;
  }

  const body = createIndexNowBody({
    paths: urls.map((url) => new URL(url).pathname),
    siteUrl: SITE.url,
    key: INDEXNOW_KEY,
  });

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const text = (await response.text()).slice(0, 500);
    const summary = `${INDEXNOW_ENDPOINT} 응답 ${response.status}, 주소 ${body.urlList.length}개${text ? `: ${text}` : ""}`;

    // 200은 접수, 202는 접수했고 키 파일 확인을 기다림(IndexNow 문서 「Response format」)
    if (response.status === 200 || response.status === 202) {
      console.log(summary);
    } else {
      warn(summary);
    }
  } catch (error) {
    warn(`${INDEXNOW_ENDPOINT}에 보내지 못했습니다: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const command = process.argv[2];

try {
  if (command === "plan") {
    await plan();
  } else if (command === "submit") {
    await submit();
  } else {
    console.log("쓰는 법: node scripts/indexNow.ts plan | submit");
  }
} catch (error) {
  warn(error instanceof Error ? (error.stack ?? error.message) : String(error));
  setOutput("urls", "[]");
}
