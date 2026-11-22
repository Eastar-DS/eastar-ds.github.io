// 훅 실행 파일을 가짜 훅 입력(JSON)으로 실제로 돌려 봅니다. .claude/settings.json이 부르는 것과 같은 명령입니다.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

const HOOKS_DIR = import.meta.dirname;
const root = mkdtempSync(path.join(tmpdir(), "blog-hooks-"));
const postFile = path.join(root, "src/content/posts/sample-post-title/index.mdx");

mkdirSync(path.dirname(postFile), { recursive: true });

afterAll(() => rmSync(root, { recursive: true, force: true }));

const runHook = ({ hook, input }: { hook: string; input: unknown }) =>
  execFileSync("node", [path.join(HOOKS_DIR, hook)], { input: JSON.stringify(input), encoding: "utf8" });

const writeInput = (filePath: string) => ({ hook_event_name: "PostToolUse", tool_name: "Write", tool_input: { file_path: filePath, content: "" } });

describe("blockUnreviewedPost.ts", () => {
  it("draft 줄을 지운 글에 〔이스타 확인〕 표시가 있으면 block JSON을 낸다", () => {
    writeFileSync(postFile, "---\ntitle: 글\n---\n\n〔이스타 확인: 배운 점〕\n");

    const output = JSON.parse(runHook({ hook: "blockUnreviewedPost.ts", input: writeInput(postFile) })) as { decision: string; reason: string };

    expect(output.decision).toBe("block");
    expect(output.reason).toContain("- 5줄: 〔이스타 확인: 배운 점〕");
  });

  it("초안이면 아무것도 내지 않는다", () => {
    writeFileSync(postFile, "---\ntitle: 글\ndraft: true\n---\n\n〔이스타 확인: 배운 점〕\n");

    expect(runHook({ hook: "blockUnreviewedPost.ts", input: writeInput(postFile) })).toBe("");
  });

  it("입력이 JSON이 아니거나 파일이 없어도 0으로 끝난다", () => {
    expect(runHook({ hook: "blockUnreviewedPost.ts", input: "x" })).toBe("");
    expect(runHook({ hook: "blockUnreviewedPost.ts", input: writeInput(path.join(root, "없음.mdx")) })).toBe("");
  });
});

describe("blockPrivateInfo.ts", () => {
  it("글에 토큰 꼴이 있으면 값을 가린 block JSON을 낸다", () => {
    const token = `ntn_${"x".repeat(40)}`;

    writeFileSync(postFile, `---\ntitle: 글\ndraft: true\n---\n\n\`\`\`bash\nexport NOTION_TOKEN=${token}\n\`\`\`\n`);

    const raw = runHook({ hook: "blockPrivateInfo.ts", input: writeInput(postFile) });
    const output = JSON.parse(raw) as { decision: string; reason: string };

    expect(output.decision).toBe("block");
    expect(output.reason).toContain("- 7줄: 토큰 꼴 ntn_…(44자)");
    expect(raw).not.toContain(token);
  });

  it("Edit는 새로 넣은 글만 본다", () => {
    writeFileSync(postFile, "---\ntitle: 글\n---\n\n옛 줄 /Users/someone/a\n\n새 문장입니다.\n");

    const input = { tool_name: "Edit", tool_input: { file_path: postFile, old_string: "", new_string: "새 문장입니다." } };

    expect(runHook({ hook: "blockPrivateInfo.ts", input })).toBe("");
  });
});
