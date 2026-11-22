/**
 * PostToolUse(Write|Edit) 훅: 초안이 아닌 글(.mdx)에 〔이스타 확인〕 표시가 남아 있으면 decision:"block"으로 돌려보냅니다.
 * `.claude/settings.json`이 부릅니다. 판단은 `./decideHooks.ts`의 `decideUnreviewedPost`가 하고, 이 파일은 입력과 출력만 맡습니다.
 * 훅이 고장 나도 글쓰기를 막지 않도록, 입력을 읽지 못하면 아무것도 내지 않고 0으로 끝납니다.
 */
import { existsSync, readFileSync } from "node:fs";

import { decideUnreviewedPost, parseHookInput } from "./decideHooks.ts";

const { filePath } = parseHookInput(readFileSync(0, "utf8"));

if (filePath && existsSync(filePath)) {
  const reason = decideUnreviewedPost({ filePath, source: readFileSync(filePath, "utf8") });

  if (reason) console.log(JSON.stringify({ decision: "block", reason }));
}
