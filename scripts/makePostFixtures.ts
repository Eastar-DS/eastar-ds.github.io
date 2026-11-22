/** node scripts/makePostFixtures.ts. 저장소 밖 작업 뿌리의 _evals 아래에만 가짜 자료를 만듭니다. */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { scanSources } from "./gatherPostSources/scan.ts";
import { renderSources } from "./gatherPostSources/sourcesDocument.ts";
import { SOURCE_KINDS } from "./gatherPostSources/types.ts";
import type { SourceScan } from "./gatherPostSources/types.ts";
import { writeFixtureMaterials, writeScenario } from "./postWork/fixtures.ts";
import { workContext, runCli } from "./postWork/io.ts";
export const makePostFixtures = (base: string) => {
  const result = writeFixtureMaterials(base);
  const before = process.env.BLOG_WORK_CONFIG;
  const beforeDir = process.env.BLOG_WORK_DIR;
  process.env.BLOG_WORK_CONFIG = result.configFile;
  delete process.env.BLOG_WORK_DIR;
  try {
    const { scan, context } = scanSources({ work: "gather-eval", topics: ["가상화", "문서 목록"], prs: ["1142"], issues: ["1117"] });
    const sources = renderSources(scan, context.hiddenNames);
    writeFileSync(path.join(context.dir, "sources.scan.json"), `${JSON.stringify(scan, null, 2)}\n`);
    writeFileSync(path.join(context.dir, "sources.md"), sources);
    const smallScan = (name: string, titles: string[], length: number): SourceScan => {
      const small: SourceScan = { ...scan, work: name, topics: titles, folders: [], links: [], artifactPairs: [], unpairedLocalArtifacts: [], repos: [], warnings: [] };
      small.items = titles.map((title, index) => {
        const text = `# ${title}\n\n평가용 가짜 원고입니다.\n${"예시 문장입니다. ".repeat(Math.ceil(length / 10))}`;
        const file = result.put(`small/${name}/source-${index + 1}.md`, text);
        return { id: `S00${index + 1}`, kind: "바깥 자료", path: file, root: name, title, bytes: Buffer.byteLength(text), modifiedAt: "2026-11-22", topicHits: 1, inTopicDir: true, read: "읽음", defaultUse: "써도 됨", hiddenNameCount: 0, unopenable: false, removed: false };
      });
      small.roots = [{ name, kind: "작업 폴더", read: "읽음", exists: true, itemCount: small.items.length }];
      small.missingKinds = SOURCE_KINDS.filter((kind) => kind !== "바깥 자료");
      return small;
    };
    const singleScan = smallScan("single-eval", ["CSS :has()로 부모 고르기"], 1500);
    const twoScan = smallScan("two-eval", ["목록 렌더링 지연 측정", "행 범위 계산"], 4500);
    const scenarios = { gather: context.dir, many: writeScenario({ base, name: "many-eval", scan, sources, parts: 3 }), single: writeScenario({ base, name: "single-eval", scan: singleScan, sources: renderSources(singleScan, context.hiddenNames), parts: 1 }), two: writeScenario({ base, name: "two-eval", scan: twoScan, sources: renderSources(twoScan, context.hiddenNames), parts: 2 }) };
    return { base, configFile: result.configFile, scenarios };
  } finally {
    if (before === undefined) delete process.env.BLOG_WORK_CONFIG; else process.env.BLOG_WORK_CONFIG = before;
    if (beforeDir === undefined) delete process.env.BLOG_WORK_DIR; else process.env.BLOG_WORK_DIR = beforeDir;
  }
};
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) runCli(() => console.log(JSON.stringify(makePostFixtures(path.join(workContext("_evals", true).dir, `f2-${Date.now()}`)), null, 2)));
