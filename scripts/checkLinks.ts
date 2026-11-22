/**
 * 글(초안 포함)의 바깥 링크가 아직 열리는지 봅니다. 주 1회 GitHub Actions(.github/workflows/check-links.yml)가 돌리고, 손으로도 돌릴 수 있습니다.
 *
 * 쓰는 법: `node scripts/checkLinks.ts` (또는 `pnpm check:links`)
 * - 주소마다 HEAD로 묻고, 2xx · 3xx가 아니면 GET으로 한 번 더 묻습니다(HEAD를 받지 않는 서버가 있어서).
 * - 결과는 「깨짐 · 확인 못 함 · 통과」 표로 냅니다. GitHub Actions에서는 같은 표를 작업 요약(GITHUB_STEP_SUMMARY)에 씁니다.
 * - 끝 코드: 깨진 링크(404, 410, 없는 도메인)가 있으면 1, 아니면 0. 봇 막기(403)나 시간 초과는 「확인 못 함」으로 적고 0으로 끝냅니다.
 *
 * 배포와 따로 도는 검사라 실패해도 배포를 막지 않습니다. 바깥 패키지를 쓰지 않아 `pnpm install` 없이 Node 24로 돕니다.
 * 요청 머리의 User-Agent에는 블로그 이름이나 개인 정보를 넣지 않습니다.
 */
import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import classifyLinkResult, { type LinkVerdict } from "./checkLinks/classifyLinkResult.ts";
import collectExternalLinks from "./checkLinks/collectExternalLinks.ts";
import readSourcePost from "./checkPost/readSourcePost.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const POSTS_DIR = path.join(ROOT, "src/content/posts");
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 4;
const USER_AGENT = "Mozilla/5.0 (compatible; link-check/1.0)";

const request = async ({ url, method }: { url: string; method: "HEAD" | "GET" }) => {
  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    await response.body?.cancel();

    return { status: response.status };
  } catch (error) {
    const cause = error instanceof Error && error.cause instanceof Error ? ` ${error.cause.message}` : "";

    return { error: `${error instanceof Error ? error.message : String(error)}${cause}` };
  }
};

const checkUrl = async (url: string) => {
  const head = await request({ url, method: "HEAD" });

  if (classifyLinkResult(head) === "ok") return { ...head, verdict: "ok" as LinkVerdict };

  const get = await request({ url, method: "GET" });

  return { ...get, verdict: classifyLinkResult(get) };
};

const posts = readdirSync(POSTS_DIR)
  .filter((slug) => existsSync(path.join(POSTS_DIR, slug, "index.mdx")))
  .map((slug) => {
    const file = path.join(POSTS_DIR, slug, "index.mdx");

    return readSourcePost({ slug, file, source: readFileSync(file, "utf8") });
  });
const links = collectExternalLinks(posts);
const results: (Awaited<ReturnType<typeof checkUrl>> & { url: string; places: string[] })[] = [];

for (let index = 0; index < links.length; index += CONCURRENCY) {
  const batch = links.slice(index, index + CONCURRENCY);

  results.push(...(await Promise.all(batch.map(async (link) => ({ ...link, ...(await checkUrl(link.url)) })))));
}

const LABELS: Record<LinkVerdict, string> = { broken: "깨짐", unknown: "확인 못 함", ok: "통과" };
const ORDER: LinkVerdict[] = ["broken", "unknown", "ok"];
const rows = [...results]
  .sort((a, b) => ORDER.indexOf(a.verdict) - ORDER.indexOf(b.verdict))
  .map((result) => `| ${LABELS[result.verdict]} | ${result.status ?? (result.error ?? "").replace(/\|/g, "/")} | ${result.url} | ${result.places.join(", ")} |`);
const count = (verdict: LinkVerdict) => results.filter((result) => result.verdict === verdict).length;
const report = [
  "## 바깥 링크 검사",
  "",
  `글 ${posts.length}편(초안 포함)의 바깥 링크 ${links.length}개: 깨짐 ${count("broken")}, 확인 못 함 ${count("unknown")}, 통과 ${count("ok")}`,
  "",
  "| 결과 | 응답 | 주소 | 나오는 곳(글:줄) |",
  "| --- | --- | --- | --- |",
  ...rows,
  "",
].join("\n");

console.log(report);

if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);

process.exitCode = count("broken") > 0 ? 1 : 0;
