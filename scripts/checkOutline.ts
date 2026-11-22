/** 결과 파일 또는 --work 이름, --stdin --work 이름. 통과 0, 검사 실패 1, 실행 실패 2. */
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { checkOutline } from "./planPost/check.ts";
import { checkerInput, finishCheck, readLocalFile, REPO_ROOT, runCli } from "./postWork/io.ts";
runCli(() => {
  const { context, text } = checkerInput("outline.md");
  finishCheck(checkOutline({ text, sources: readLocalFile(context.dir, "sources.md"), interview: existsSync(path.join(context.dir, "interview.md")) ? readLocalFile(context.dir, "interview.md") : "", names: context.hiddenNames, existingSlugs: readdirSync(path.join(REPO_ROOT, "src/content/posts"), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name) }), context.hiddenNames);
});
