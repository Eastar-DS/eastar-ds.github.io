/**
 * PostToolUse(Write|Edit) 훅: 글(`src/content/`)과 데모(`src/modules/features/demo/`)에 로컬 경로, 이메일, 토큰 꼴, 사설 IP, 전화번호가 있으면
 * decision:"block"으로 돌려보냅니다(docs/content-guide.md 11장). 공개해도 되는 사이트 연락처(`SITE.author.email`)는 넘깁니다.
 * `.claude/settings.json`이 부릅니다. 판단은 `./decideHooks.ts`의 `decidePrivateInfo`가 하고, 이 파일은 입력과 출력만 맡습니다.
 * 훅이 고장 나도 글쓰기를 막지 않도록, 입력을 읽지 못하면 아무것도 내지 않고 0으로 끝납니다.
 */
import { existsSync, readFileSync } from "node:fs";

import { SITE } from "../../src/shared/constants/site/index.ts";
import { decidePrivateInfo, parseHookInput } from "./decideHooks.ts";

const { filePath, toolName, newString } = parseHookInput(readFileSync(0, "utf8"));

if (filePath && existsSync(filePath)) {
  const reason = decidePrivateInfo({
    filePath,
    toolName,
    source: readFileSync(filePath, "utf8"),
    newString,
    allowedEmails: [SITE.author.email],
  });

  if (reason) console.log(JSON.stringify({ decision: "block", reason }));
}
