import type { ReadPolicy } from "../blogWork/resolveWorkDir.ts";
import { isInsideDir } from "../blogWork/resolveWorkDir.ts";
import type { SourceItem, SourceLink } from "./types.ts";

export const COLLAPSED_NAMES = new Set(["node_modules", ".git", "dist", "build", "builds", "storybook-static", ".astro", ".wrangler"]);
export const TEXT_EXTENSIONS = new Set([".md", ".mdx", ".txt", ".html", ".json", ".jsonl", ".log", ".mjs", ".js", ".jsx", ".ts", ".tsx", ".py", ".svg", ".css"]);
const DENIED_SEGMENTS = /^(?:100-daily|daily|meetings?|snapshots|회의(?:록|글)?|대화(?:기록)?|인터뷰[-_ ]?원문|interview[-_ ]?(?:raw|originals?))$/i;
/** 이름으로만 판단합니다. 내용이나 환경 변수 값은 읽지 않습니다. */
export const isUnopenable = (file: string, extra: readonly string[] = []) => {
  const parts = file.split(/[\\/]/);
  return parts.some((part) => /(?:^\.env(?:\.|$)|\.env$|\.pem$|\.key$|\.p12$|^id_(?:rsa|ed25519)|credentials|secrets?|(?:login|playwright|storage|auth)[-_]?state|\.session\.json$|^(?:prod[-_]?profile|posthog[-_]?config|analytics[-_]?config|browser[-_]?profile)$)/i.test(part) || extra.some((pattern) => {
    const expression = pattern.replace(/\/$/, "").split("*").map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
    return new RegExp(`^${expression}$`, "i").test(part);
  }));
};
export const policyFor = (file: string, policies: readonly ReadPolicy[]) => {
  const rules = policies.filter((rule) => isInsideDir({ dir: file, parent: rule.path })).sort((a, b) => b.path.length - a.path.length);
  if (file.split(/[\\/]/).some((part) => DENIED_SEGMENTS.test(part)) || rules.some((rule) => rule.read === "읽지 않음")) return { path: file, read: "읽지 않음" } as ReadPolicy;
  return rules[0] ?? { path: file, read: "읽음" } as ReadPolicy;
};
export const classifySource = (file: string, rootKind = "작업 폴더") => {
  const value = file.toLowerCase();
  if (rootKind === "개인 노트") return "개인 노트";
  if (rootKind === "작업 메모" || /agent.*(?:brief|prompt)|(?:^|\/)memory\//.test(value)) return "에이전트 지시문과 작업 메모";
  if (rootKind === "이미 쓴 글" || /\/src\/content\/posts\//.test(value)) return "이미 쓴 블로그 글";
  if (value.endsWith(".html")) return "해설 아티팩트";
  if (/notion|노션/.test(value)) return "노션 원고";
  if (/\/pr\/.*\.(svg|png|jpe?g|webp)$/.test(value)) return "PR 그림과 도식";
  if (/\/pr\/|pr-body|pull-request/.test(value)) return "PR";
  if (/\/adr\/|decision|결정/.test(value)) return "ADR과 결정 문서";
  if (/team-report|report\.md$|\.(pdf|key|pptx)$/.test(value)) return "팀 보고와 발표 자료";
  if (/results?\/|measure|summari[sz]e|\.jsonl$|\.log$/.test(value)) return "측정 기록";
  if (/\.(png|jpe?g|webp|mp4|mov)$/.test(value)) return "화면 캡처와 영상";
  if (/\.(tsx?|jsx?|mjs|py|css|astro)$/.test(value)) return "코드";
  return "기타";
};
export const defaultUse = (kind: string, read: string, hasNames: boolean) => {
  if (read === "읽지 않음") return "쓰면 안 됨";
  if (read === "단서만" || ["개인 노트", "에이전트 지시문과 작업 메모"].includes(kind)) return "단서만";
  if (hasNames) return "이스타 확인";
  if (["해설 아티팩트", "노션 원고", "팀 보고와 발표 자료", "PR 그림과 도식"].includes(kind)) return "다시 써서 씀";
  if (["이미 쓴 블로그 글", "바깥 자료"].includes(kind)) return "써도 됨";
  return "이스타 확인";
};
const decode = (value: string) => value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) => { const n = code.startsWith("x") ? parseInt(code.slice(1), 16) : Number(code); return n <= 0x10ffff ? String.fromCodePoint(n) : ""; });
export const readTitle = (text: string, extension: string) => decode(extension === ".html" ? text.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "" : text.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "");
export const linkType = (url: string, image = false) => /https:\/\/claude\.ai\/artifact\//i.test(url) ? "artifact" : /https:\/\/(?:www\.)?notion\.(?:so|site)\//i.test(url) ? "notion" : /github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(url) ? "pr" : /github\.com\/[^/]+\/[^/]+\/issues\/\d+/.test(url) ? "issue" : image || /user-attachments|\.(png|svg|jpe?g|webp)(?:[?#]|$)/i.test(url) ? "image" : /^https?:/.test(url) ? "other" : "file";
export const extractLinks = (text: string, foundIn = "") => {
  const links: SourceLink[] = [];
  const add = (url: string, label: string, image = false) => {
    const clean = decode(url).replace(/[.,;]+$/, "");
    if (/^(?:#|data:|javascript:|mailto:)/i.test(clean)) return;
    const existing = links.find((link) => link.url === clean);
    if (existing) { if (!existing.text && label) existing.text = decode(label); return; }
    links.push({ type: linkType(clean, image), url: clean, text: decode(label.replace(/<[^>]+>/g, "").trim()), foundIn });
  };
  for (const match of text.matchAll(/(!?)\[([^\]]*)\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/g)) add(match[3], match[2], !!match[1]);
  for (const match of text.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) add(match[1], match[2]);
  for (const match of text.matchAll(/(?:src|href)=["']([^"']+)["']/gi)) add(match[1], "", /src=/.test(match[0]));
  for (const match of text.matchAll(/https?:\/\/[^\s<>"'`)\]]+/g)) add(match[0], "");
  return links;
};
const normalized = (text: string) => text.normalize("NFKC").toLowerCase().replace(/[\p{P}\p{S}\s]/gu, "");
export const matchArtifacts = (links: readonly SourceLink[], items: readonly SourceItem[]) => {
  const html = items.filter((item) => item.kind === "해설 아티팩트" && !item.removed && !item.unopenable && item.read === "읽음");
  const artifactPairs = [...new Set(links.filter((link) => link.type === "artifact").map((link) => link.url))].map((url) => {
    const labels = links.filter((link) => link.url === url && link.text).map((link) => link.text);
    const candidates = html.filter((item) => item.title && labels.some((label) => normalized(item.title) === normalized(label)));
    return { url, text: labels[0] ?? "", localId: candidates.length === 1 ? candidates[0].id : null, state: candidates.length === 1 ? "짝" : candidates.length ? "여럿" : "짝 없음", candidates: candidates.map((item) => item.id) };
  });
  return { artifactPairs, unpairedLocalArtifacts: html.filter((item) => !artifactPairs.some((pair) => pair.localId === item.id)).map((item) => item.id) };
};
export const assignIds = (current: SourceItem[], previous: SourceItem[], prefix = "S") => {
  let next = Math.max(0, ...previous.map((item) => Number(item.id.slice(1)))) + 1;
  const seen = new Set(current.map((item) => item.path));
  return [...current.map((item) => ({ ...item, id: previous.find((old) => old.path === item.path)?.id ?? `${prefix}${String(next++).padStart(3, "0")}` })), ...previous.filter((item) => !seen.has(item.path)).map((item) => ({ ...item, removed: true }))];
};
