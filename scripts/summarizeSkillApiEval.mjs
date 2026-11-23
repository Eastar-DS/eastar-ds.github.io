/** 원본 로그·자료 경로·개인 기록 없이 공유할 수 있는 평가 수치만 만듭니다. */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { SKILLS, saveJson } from "./skillApiEval.mjs";

const [outArg, targetArg] = process.argv.slice(2);
if (!outArg || !targetArg) throw new Error("사용법: node scripts/summarizeSkillApiEval.mjs <평가 폴더> <요약.json>");
const out = path.resolve(outArg);
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const spend = readJson(path.join(out, "spend.json"));
const runs = spend.runs.filter((r) => r.status === "complete").map((r) => readJson(path.join(out, "runs", r.id, "summary.json")));
const byCategory = Object.fromEntries([...new Set(runs.map((r) => r.category))].map((category) => [category, {
  runs: runs.filter((r) => r.category === category).length,
  cost: runs.filter((r) => r.category === category).reduce((n, r) => n + r.total_cost_usd, 0),
}]));
const triggers = SKILLS.map((skill) => {
  const cases = runs.filter((r) => r.category === "trigger" && r.skill === skill);
  return { skill, total: cases.length, passed: cases.filter((r) => r.passed).length,
    positives: { total: cases.filter((r) => r.should_trigger).length, triggered: cases.filter((r) => r.should_trigger && r.triggered).length },
    negatives: { total: cases.filter((r) => !r.should_trigger).length, correctlySkipped: cases.filter((r) => !r.should_trigger && !r.triggered).length },
    failures: cases.filter((r) => !r.passed).map((r) => ({ id: r.id, query: r.query, should_trigger: r.should_trigger, selected: r.selectedSkills })),
    otherSkills: cases.filter((r) => r.selectedSkills.some((s) => s !== skill)).map((r) => ({ id: r.id, query: r.query, selected: r.selectedSkills })),
    cost: cases.reduce((n, r) => n + r.total_cost_usd, 0),
  };
});
const comparisons = runs.filter((r) => r.category !== "trigger").map((r) => {
  const gradeFile = path.join(out, "runs", r.id, "grade.json");
  return { id: r.id, cost: r.total_cost_usd, durationMs: r.durationMs, result: r.subtype,
    selected: r.selectedSkills, disabledSkillAbsent: r.disabledSkillAbsent,
    ...(existsSync(gradeFile) ? { grade: readJson(gradeFile) } : {}) };
});
const summary = { model: spend.model, total_cost_usd: spend.total_cost_usd, remainingToStop: 55 - spend.total_cost_usd,
  remainingToHardLimit: 60 - spend.total_cost_usd, runs: runs.length, pending: spend.runs.length - runs.length,
  auth: { apiKeySource: [...new Set(runs.map((r) => r.apiKeySource))], models: [...new Set(runs.map((r) => r.actualModel))],
    allMcpEmpty: runs.every((r) => r.mcpServers?.length === 0), allSettled: spend.runs.every((r) => r.status === "complete") },
  usage: Object.fromEntries(["input_tokens", "cache_creation_input_tokens", "cache_read_input_tokens", "output_tokens"].map((key) => [key, runs.reduce((n, r) => n + (r.usage?.[key] ?? 0), 0)])),
  byCategory, triggers, comparisons };
saveJson(path.resolve(targetArg), summary);
console.log(JSON.stringify({ runs: summary.runs, total: summary.total_cost_usd, categories: byCategory }));
