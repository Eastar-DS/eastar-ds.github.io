import { lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";
import { readBlogWork } from "../blogWork/readBlogWork.ts";
import { isInsideDir, resolvePostWorkDir } from "../blogWork/resolveWorkDir.ts";

export const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
/** 아직 없는 경로도 이미 있는 부모의 실제 경로로 검사해 심볼릭 링크 우회를 막습니다. */
export const physicalPath = (value: string): string => lstatSync(value, { throwIfNoEntry: false }) ? realpathSync(value) : path.join(physicalPath(path.dirname(value)), path.basename(value));
export const assertOutsideRepo = (value: string) => {
  const dir = physicalPath(value);
  if (isInsideDir({ dir, parent: physicalPath(REPO_ROOT) })) throw new Error("작업 자료는 저장소 밖에 둬야 합니다");
  return dir;
};
export const workContext = (work: string, create = false) => {
  const config = readBlogWork();
  if (!config.ok) throw new Error(config.reason);
  const result = resolvePostWorkDir({ workRoot: config.workRoot, slug: work, repoRoot: config.repoRoot });
  if (!result.ok) throw new Error(result.reason);
  const dir = assertOutsideRepo(result.dir);
  if (create) mkdirSync(dir, { recursive: true });
  return { ...config, dir };
};
export const readLocalFile = (dir: string, relative: string) => {
  const file = path.resolve(dir, relative);
  if (!isInsideDir({ dir: physicalPath(file), parent: physicalPath(dir) }) || lstatSync(file).isSymbolicLink()) throw new Error("작업 폴더 밖의 파일이나 심볼릭 링크를 읽을 수 없습니다");
  return readFileSync(file, "utf8");
};
export const redact = (text: string, names: readonly string[]) => names.reduce((value, name) => name ? value.split(name).join("[이름 가림]") : value, text);
export const hiddenNameCount = (text: string, names: readonly string[]) => names.filter((name) => name && text.includes(name)).length;
export const checkerInput = (filename: string) => {
  const { values, positionals } = parseArgs({ options: { work: { type: "string" }, stdin: { type: "boolean" } }, allowPositionals: true });
  if (positionals.length > 1 || (values.stdin && positionals.length)) throw new Error("파일 하나 또는 --stdin을 받습니다");
  const config = readBlogWork();
  if (!config.ok) throw new Error(config.reason);
  const context = values.work ? workContext(values.work) : positionals[0] ? { ...config, dir: assertOutsideRepo(path.dirname(path.resolve(positionals[0]))) } : null;
  if (!context) throw new Error("--work <작업 이름> 또는 결과 파일 경로가 필요합니다");
  return { context, text: values.stdin ? readFileSync(0, "utf8") : readFileSync(positionals[0] ?? path.join(context.dir, filename), "utf8") };
};
/** 금지 표현 줄의 원문을 다시 출력하지 않습니다. 답 원문은 호출 전에 빼야 합니다. */
export const checkStyle = (text: string) => {
  const directory = mkdtempSync(path.join(tmpdir(), "post-style-"));
  const file = path.join(directory, "text.md");
  try {
    writeFileSync(file, text);
    let output = "";
    try { output = execFileSync("bash", [path.join(REPO_ROOT, ".claude/skills/writing-style/check.sh"), file], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
    catch (error) {
      const result = error as { status?: number; stdout?: string; stderr?: string };
      if (result.status !== 1 || result.stderr) return ["1: 문체 검사 스크립트를 실행하지 못했습니다"];
      output = String(result.stdout ?? "");
    }
    return [...new Set(output.trim().split("\n").filter(Boolean).map((line) => `${line.match(/^\d+/)?.[0] ?? 1}: 문체 검사에 걸렸습니다`))];
  } finally { rmSync(directory, { recursive: true, force: true }); }
};
export const finishCheck = (problems: string[], names: readonly string[]) => {
  if (!names.length) console.error("경고: hiddenNames가 비어 있어 이름 검사를 건너뜁니다");
  if (problems.length) { console.log(problems.join("\n")); process.exitCode = 1; }
};
export const runCli = (callback: () => unknown) => {
  try { callback(); } catch { console.error("1: 실행하지 못했습니다. 인자, 설정, 작업 파일의 형식을 확인하세요"); process.exitCode = 2; }
};
