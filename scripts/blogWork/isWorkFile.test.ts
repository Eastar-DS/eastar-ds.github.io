import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { REPO_ROOT } from "../postWork/io.ts";
it("훅은 설정의 작업 폴더를 빼고 이름이 비슷한 바깥 폴더는 검사한다", () => {
  const base = mkdtempSync(path.join(tmpdir(), "post-hook-test-"));
  try {
    const config = path.join(base, "config.json");
    writeFileSync(config, JSON.stringify({ workDir: path.join(base, "work") }));
    const run = (relative: string) => {
      const file = path.join(base, relative);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, "코드 조각을 사용합니다.\n");
      return execFileSync("bash", [path.join(REPO_ROOT, ".claude/skills/writing-style/hook.sh")], { input: JSON.stringify({ tool_name: "Write", tool_input: { file_path: file } }), encoding: "utf8", env: { ...process.env, BLOG_WORK_CONFIG: config, BLOG_WORK_DIR: "" } });
    };
    expect(run("work/example/interview.md")).toBe("");
    expect(JSON.parse(run("work-other/example.md")).decision).toBe("block");
  } finally { rmSync(base, { recursive: true, force: true }); }
});
