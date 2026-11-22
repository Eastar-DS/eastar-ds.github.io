/** 자료 훑기: node scripts/findSources.ts --work <이름> --topic <낱말> [--repo 이름 --pr 번호 --issue 번호] */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { scanSources } from "./gatherPostSources/scan.ts";
import { renderSources } from "./gatherPostSources/sourcesDocument.ts";
import { physicalPath, runCli } from "./postWork/io.ts";
import { readBlogWork } from "./blogWork/readBlogWork.ts";
runCli(() => {
  const { values } = parseArgs({ options: { work: { type: "string" }, topic: { type: "string", multiple: true }, root: { type: "string", multiple: true }, "topic-dir": { type: "string", multiple: true }, repo: { type: "string", multiple: true }, pr: { type: "string", multiple: true }, issue: { type: "string", multiple: true }, branch: { type: "string" }, since: { type: "string" }, "artifact-candidate": { type: "string", multiple: true } } });
  const config = readBlogWork();
  if (!config.ok || !config.configFile) {
    console.error("1: 로컬 설정 파일이 없거나 읽을 수 없습니다. .claude/skills/gather-post-sources/references/config.md를 보고 만들어 주세요");
    process.exitCode = 2;
    return;
  }
  const { context, scan } = scanSources({ work: values.work ?? "", topics: values.topic ?? [], roots: values.root, topicDirs: values["topic-dir"], repos: values.repo, prs: values.pr, issues: values.issue, branch: values.branch, since: values.since, artifactCandidates: values["artifact-candidate"] });
  for (const filename of ["sources.scan.json", "sources.md"]) if (physicalPath(path.join(context.dir, filename)) !== path.join(context.dir, filename)) throw new Error("결과 파일은 심볼릭 링크일 수 없습니다");
  const file = path.join(context.dir, "sources.md");
  const text = renderSources(scan, context.hiddenNames, existsSync(file) ? readFileSync(file, "utf8") : "");
  writeFileSync(path.join(context.dir, "sources.scan.json"), `${JSON.stringify(scan, null, 2)}\n`);
  writeFileSync(file, text);
  console.log(JSON.stringify({ kinds: [...new Set(scan.items.filter((item) => !item.removed).map((item) => item.kind))].map((kind) => ({ kind, count: scan.items.filter((item) => !item.removed && item.kind === kind).length })), roots: scan.roots, collapsedFolders: scan.folders.length, artifactPairs: scan.artifactPairs.map(({ text, state }) => ({ text, state })), missingKinds: scan.missingKinds, warnings: scan.warnings }, null, 2));
});
