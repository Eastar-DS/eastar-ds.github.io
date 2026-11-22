/** 파일 경로 또는 --work 이름, --stdin --work 이름. 오류마다 줄번호를 출력하고 1, 실행 오류는 2, 통과는 0입니다. */
import { checkSources } from "./gatherPostSources/sourcesDocument.ts";
import type { SourceScan } from "./gatherPostSources/types.ts";
import { checkerInput, finishCheck, readLocalFile, runCli } from "./postWork/io.ts";
runCli(() => {
  const { context, text } = checkerInput("sources.md");
  const scan: SourceScan = JSON.parse(readLocalFile(context.dir, "sources.scan.json"));
  finishCheck(checkSources({ text, scan, names: context.hiddenNames, dir: context.dir }), context.hiddenNames);
});
