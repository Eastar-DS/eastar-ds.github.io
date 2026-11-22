import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expandHome } from "../blogWork/resolveWorkDir.ts";
import { homedir } from "node:os";
import { hiddenNameCount, redact, workContext } from "../postWork/io.ts";
import { assignIds, classifySource, COLLAPSED_NAMES, defaultUse, extractLinks, isUnopenable, matchArtifacts, policyFor, readTitle, TEXT_EXTENSIONS } from "./material.ts";
import { collectRepo } from "./repository.ts";
import { SOURCE_KINDS } from "./types.ts";
import type { SourceItem, SourceLink, SourceScan } from "./types.ts";
export interface ScanOptions { work: string; topics: string[]; roots?: string[]; topicDirs?: string[]; repos?: string[]; prs?: string[]; issues?: string[]; branch?: string; since?: string }
const MAX_BYTES = 2 * 1024 * 1024;
export const scanSources = (options: ScanOptions) => {
  const context = workContext(options.work, true);
  if (!context.configFile) throw new Error("로컬 설정 파일이 없습니다");
  const warnings: string[] = [];
  if (!context.hiddenNames.length) warnings.push("hiddenNames가 비어 있어 이름 검사를 건너뜁니다");
  const topics = [...new Set([...options.topics, ...options.prs ?? [], ...options.issues ?? []])].filter(Boolean);
  if (!topics.length) throw new Error("주제어가 필요합니다");
  const hits = (text: string) => topics.reduce((count, topic) => count + (text.toLowerCase().includes(topic.toLowerCase()) ? 1 : 0), 0);
  const textCache = new Map<string, string>();
  const denied: string[] = [];
  const folders: SourceItem[] = [];
  const links: SourceLink[] = [];
  const items: SourceItem[] = [];
  const clean = (text: string) => redact(text, context.hiddenNames);
  const absolute = (file: string) => path.resolve(expandHome({ value: file, home: homedir() }));
  const forced = (options.topicDirs ?? []).map(absolute);
  const roots = [...new Set([...context.sourceRoots, ...options.roots ?? [], ...forced].map(absolute))];
  const rootSummaries: SourceScan["roots"] = [];
  const rootKind = (root: string) => policyFor(root, context.readPolicy).kind ?? "작업 폴더";
  const metadata = (file: string, root: string, inTopicDir: boolean): SourceItem | null => {
    const stat = lstatSync(file);
    if (stat.isSymbolicLink()) { warnings.push("심볼릭 링크 하나를 건너뛰었습니다"); return null; }
    const policy = policyFor(file, context.readPolicy);
    if (policy.read === "읽지 않음") { denied.push(file); return null; }
    const unopenable = isUnopenable(file, context.unopenedNames);
    const kind = unopenable ? "비밀값 의심" : classifySource(file, policy.kind ?? rootKind(root));
    const read = unopenable ? "이름만" : policy.read;
    // 개인 노트와 메모는 어느 설정에서도 본문/링크를 결과로 내보내지 않습니다.
    const clueOnly = read === "단서만" || ["개인 노트", "에이전트 지시문과 작업 메모"].includes(kind);
    const isText = TEXT_EXTENSIONS.has(path.extname(file).toLowerCase());
    let text = "";
    if (!unopenable && read !== "이름만" && !stat.isDirectory() && stat.size <= MAX_BYTES && isText) {
      try { text = textCache.get(file) ?? readFileSync(file, "utf8"); textCache.set(file, text); }
      catch { warnings.push("읽지 못한 자료 하나가 있습니다"); }
    }
    const headingLines = clueOnly ? text.split(/\r?\n/).flatMap((line, index) => /^#{1,6} /.test(line) && hits(line) ? [index + 1] : []) : [];
    const count = hiddenNameCount(text, context.hiddenNames);
    const item: SourceItem = { id: "", kind, path: file, root: clean(path.basename(root)), title: unopenable ? "열지 않음" : clueOnly ? "내용을 인용하지 않는 단서" : clean(readTitle(text, path.extname(file))), bytes: stat.size, modifiedAt: stat.mtime.toISOString().slice(0, 10), topicHits: hits(path.basename(file)) + hits(text), inTopicDir, read: clueOnly && !unopenable ? "단서만" : read, defaultUse: unopenable ? "열지 않음" : clueOnly ? "단서만" : policy.defaultUse ?? defaultUse(kind, read, count > 0), hiddenNameCount: count, unopenable, removed: false, ...(clueOnly ? { headingLines } : {}) };
    if (!clueOnly && !unopenable && read === "읽음") links.push(...extractLinks(text, file));
    return item;
  };
  const walk = (directory: string, root: string, list: SourceItem[]) => {
    if (policyFor(directory, context.readPolicy).read === "읽지 않음") return;
    if (lstatSync(directory).isSymbolicLink()) { warnings.push("심볼릭 링크 폴더를 건너뛰었습니다"); return; }
    const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      const policy = policyFor(file, context.readPolicy);
      if (policy.read === "읽지 않음") continue;
      if (isUnopenable(file, context.unopenedNames)) { const item = metadata(file, root, true); if (item) list.push(item); continue; }
      if (entry.isDirectory()) {
        const children = readdirSync(file, { withFileTypes: true });
        if (COLLAPSED_NAMES.has(entry.name) || children.length > 200) {
          const item = metadata(file, root, true);
          if (item) { item.title = "내용을 읽지 않은 폴더 묶음"; item.fileCount = children.length; folders.push(item); list.push(item); }
        } else walk(file, root, list);
      } else {
        if (options.since && rootKind(root) === "내려받은 파일" && lstatSync(file).mtime < new Date(options.since)) continue;
        const item = metadata(file, root, true); if (item) list.push(item);
      }
    }
  };
  for (const root of roots) {
    const policy = policyFor(root, context.readPolicy);
    const summary = { name: clean(policy.name ?? path.basename(root)), kind: rootKind(root), read: policy.read, exists: existsSync(root), itemCount: 0 };
    rootSummaries.push(summary);
    if (!summary.exists) { warnings.push(`뿌리 ${summary.name}이 없습니다`); continue; }
    if (policy.read === "읽지 않음" || Object.values(context.repos).includes(root)) continue;
    if (lstatSync(root).isSymbolicLink()) { warnings.push(`뿌리 ${summary.name}은 심볼릭 링크라 건너뜁니다`); continue; }
    if (!lstatSync(root).isDirectory()) { const item = metadata(root, root, true); if (item) items.push(item); continue; }
    const entries = readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const file = path.join(root, entry.name);
      if (entry.isSymbolicLink() || policyFor(file, context.readPolicy).read === "읽지 않음") continue;
      const group: SourceItem[] = [];
      const beforeLinks = links.length;
      const beforeFolders = folders.length;
      if (entry.isDirectory() && !isUnopenable(file, context.unopenedNames)) {
        if (COLLAPSED_NAMES.has(entry.name)) {
          const item = metadata(file, root, false); if (item) { item.fileCount = readdirSync(file).length; group.push(item); folders.push(item); }
        } else walk(file, root, group);
      } else { const item = metadata(file, root, false); if (item) group.push(item); }
      const force = forced.some((dir) => root === dir || file === dir || file.startsWith(`${dir}${path.sep}`));
      const wholeGroup = summary.kind === "작업 폴더" && entry.isDirectory() && !isUnopenable(file, context.unopenedNames);
      const selected = force || hits(file) > 0 || group.some((item) => item.topicHits > 0);
      const chosen = group.filter((item) => item.unopenable || selected && (wholeGroup || force || item.topicHits > 0));
      items.push(...chosen);
      const chosenPaths = new Set(chosen.map((item) => item.path));
      links.splice(beforeLinks, links.length - beforeLinks, ...links.slice(beforeLinks).filter((link) => chosenPaths.has(link.foundIn)));
      folders.splice(beforeFolders, folders.length - beforeFolders, ...folders.slice(beforeFolders).filter((folder) => chosenPaths.has(folder.path)));
      summary.itemCount += chosen.length;
    }
  }
  const repos: SourceScan["repos"] = [];
  for (const name of options.repos ?? []) {
    const repo = context.repos[name];
    if (!repo) { warnings.push("설정에 없는 저장소 이름이 있습니다"); continue; }
    const result = collectRepo({ name, repo, topics, prs: options.prs ?? [], issues: options.issues ?? [], branch: options.branch, metadata, clean });
    items.push(...result.items); links.push(...result.links); warnings.push(...result.warnings); repos.push(...result.repos);
  }
  const scanFile = path.join(context.dir, "sources.scan.json");
  const previous: SourceScan | null = existsSync(scanFile) && !lstatSync(scanFile).isSymbolicLink() ? JSON.parse(readFileSync(scanFile, "utf8")) : null;
  const unique = [...new Map(items.map((item) => [item.path, item])).values()];
  const folderPaths = new Set(folders.map((item) => item.path));
  const numbered = assignIds(unique.filter((item) => !folderPaths.has(item.path)), previous?.items ?? []);
  const numberedFolders = assignIds(unique.filter((item) => folderPaths.has(item.path)), previous?.folders ?? [], "F");
  const all = [...numbered, ...numberedFolders];
  const uniqueLinks = [...new Map(links.map((link) => [`${link.url}\0${link.foundIn}`, { ...link, text: clean(link.text) }])).values()];
  const pairs = matchArtifacts(uniqueLinks, all);
  const kinds = new Set([...all.filter((item) => !item.removed).map((item) => item.kind), ...uniqueLinks.map((link) => link.type === "artifact" ? "아티팩트 링크" : link.type === "other" ? "바깥 자료" : "")]);
  const scan: SourceScan = { work: options.work, scannedAt: new Date().toISOString(), topics: topics.map(clean), roots: rootSummaries, items: numbered, folders: numberedFolders, links: uniqueLinks, ...pairs, missingKinds: SOURCE_KINDS.filter((kind) => !kinds.has(kind)), warnings, repos };
  return { context, scan };
};
