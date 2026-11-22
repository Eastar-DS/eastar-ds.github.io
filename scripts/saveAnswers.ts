/** node scripts/saveAnswers.ts --work 이름 --from 답.txt [--dry-run]. 원문 내용은 출력하지 않습니다. */
import { parseArgs } from "node:util";
import { saveAnswers } from "./interviewForPost/save.ts";
import { runCli } from "./postWork/io.ts";
runCli(() => {
  const { values } = parseArgs({ options: { work: { type: "string" }, from: { type: "string" }, "dry-run": { type: "boolean" } } });
  if (!values.from) throw new Error("--from이 필요합니다");
  console.log(JSON.stringify(saveAnswers({ work: values.work ?? "", from: values.from, dryRun: values["dry-run"] }), null, 2));
});
