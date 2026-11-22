/** 결과 파일 또는 --work 이름, --stdin --work 이름. 통과 0, 검사 실패 1, 실행 실패 2. */
import { checkInterview } from "./interviewForPost/check.ts";
import { checkerInput, finishCheck, readLocalFile, runCli } from "./postWork/io.ts";
runCli(() => {
  const { context, text } = checkerInput("interview.md");
  finishCheck(checkInterview({ text, sources: readLocalFile(context.dir, "sources.md"), outline: readLocalFile(context.dir, "outline.md"), dir: context.dir, names: context.hiddenNames }), context.hiddenNames);
});
