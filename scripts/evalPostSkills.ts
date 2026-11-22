/** 가짜 자료의 결정적 검사 평가. 모델의 스킬 선택/판단 채점과 구분합니다. 결과는 저장소 밖에 씁니다. */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { makePostFixtures } from "./makePostFixtures.ts";
import { checkSources } from "./gatherPostSources/sourcesDocument.ts";
import type { SourceScan } from "./gatherPostSources/types.ts";
import { checkOutline } from "./planPost/check.ts";
import { checkInterview } from "./interviewForPost/check.ts";
import { saveAnswers } from "./interviewForPost/save.ts";
import { workContext, REPO_ROOT, runCli } from "./postWork/io.ts";
export const validateEvalFiles = () => {
  const errors: string[] = [];
  for (const name of ["gather-post-sources", "interview-for-post", "plan-post", "write-post"]) {
    const root = path.join(REPO_ROOT, ".claude/skills", name);
    const evals = JSON.parse(readFileSync(path.join(root, "evals/evals.json"), "utf8"));
    const triggers = JSON.parse(readFileSync(path.join(root, "evals/trigger-evals.json"), "utf8"));
    if (evals.skill_name !== name || !Array.isArray(evals.evals) || !evals.evals.length || !evals.evals.every((item: { id?: number; prompt?: string; expected_output?: string; expectations?: unknown[]; files?: unknown[] }) => typeof item.id === "number" && typeof item.prompt === "string" && typeof item.expected_output === "string" && Array.isArray(item.expectations) && Array.isArray(item.files))) errors.push(`${name}: evals 형식 오류`);
    if (!Array.isArray(triggers) || !triggers.some((item) => item.should_trigger) || !triggers.some((item) => !item.should_trigger) || !triggers.every((item) => typeof item.query === "string" && typeof item.should_trigger === "boolean")) errors.push(`${name}: trigger-evals 형식 오류`);
  }
  return errors;
};
runCli(() => {
  const fixtures = makePostFixtures(path.join(workContext("_evals", true).dir, `f2-eval-${Date.now()}`));
  const before = process.env.BLOG_WORK_CONFIG;
  const beforeDir = process.env.BLOG_WORK_DIR;
  process.env.BLOG_WORK_CONFIG = fixtures.configFile;
  delete process.env.BLOG_WORK_DIR;
  try {
    const results: { name: string; passed: boolean; details?: string[] }[] = [];
    const dir = fixtures.scenarios.gather;
    const scan: SourceScan = JSON.parse(readFileSync(path.join(dir, "sources.scan.json"), "utf8"));
    const sources = readFileSync(path.join(dir, "sources.md"), "utf8");
    const check = checkSources({ text: sources, scan, dir, names: ["모과"] });
    results.push({ name: "자료 목록 검사", passed: !check.length, details: check });
    results.push({ name: "HTML 9개와 링크 7개 중 짝 6개, 짝 없음 1개", passed: scan.items.filter((item) => item.kind === "해설 아티팩트").length === 9 && scan.artifactPairs.length === 7 && scan.artifactPairs.filter((pair) => pair.state === "짝").length === 6 && scan.artifactPairs.filter((pair) => pair.state === "짝 없음").length === 1 });
    results.push({ name: "비밀값 이름만, 개인 문장 제외, 빌드 폴더 묶음", passed: scan.items.filter((item) => item.unopenable).length === 2 && !JSON.stringify(scan).includes("synthetic-marker") && !sources.includes("모과") && scan.folders.some((folder) => folder.fileCount === 250) });
    for (const [name, scenario] of Object.entries(fixtures.scenarios).filter(([name]) => name !== "gather")) {
      const source = readFileSync(path.join(scenario, "sources.md"), "utf8");
      const outline = readFileSync(path.join(scenario, "outline.md"), "utf8");
      const interview = readFileSync(path.join(scenario, "interview.md"), "utf8");
      const errors = checkOutline({ text: outline, sources: source });
      results.push({ name: `${name} 개요 통과`, passed: !errors.length, details: errors });
      results.push({ name: `${name} 개요 실패 검출`, passed: checkOutline({ text: outline.replaceAll("| 1,500 |", "| 9,999 |"), sources: source }).some((error) => error.includes("합계")) });
      if (name === "single") {
        const questions = checkInterview({ text: interview, sources: source, outline, dir: scenario, names: ["모과"] });
        results.push({ name: "질문 형식 통과", passed: !questions.length, details: questions });
        saveAnswers({ work: "single-eval", from: "answers-raw-1.txt" });
        const saved = readFileSync(path.join(scenario, "interview.md"), "utf8");
        const answerErrors = checkInterview({ text: saved, sources: source, outline, dir: scenario, names: ["모과"] });
        results.push({ name: "답 원문 대조 통과", passed: !answerErrors.length, details: answerErrors });
        results.push({ name: "답 원문 변조 검출", passed: checkInterview({ text: saved.replace("직접 계산을 통해", "계산해서"), sources: source, outline, dir: scenario, names: ["모과"] }).some((error) => error.includes("원문과 다릅니다")) });
      }
    }
    const formats = validateEvalFiles();
    results.push({ name: "evals와 trigger-evals 형식", passed: !formats.length, details: formats });
    const report = { evaluatedAt: new Date().toISOString(), scope: "스크립트 평가. 스킬 사용/미사용 비교와 trigger-evals 실제 채점은 나중에 돌림", results };
    writeFileSync(path.join(fixtures.base, "evaluation.json"), `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ ...report, report: path.join(fixtures.base, "evaluation.json") }, null, 2));
    if (results.some((result) => !result.passed)) process.exitCode = 1;
  } finally {
    if (before === undefined) delete process.env.BLOG_WORK_CONFIG; else process.env.BLOG_WORK_CONFIG = before;
    if (beforeDir === undefined) delete process.env.BLOG_WORK_DIR; else process.env.BLOG_WORK_DIR = beforeDir;
  }
});
