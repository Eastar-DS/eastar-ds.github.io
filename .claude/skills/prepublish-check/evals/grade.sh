#!/bin/bash
# prepublish-check 평가의 [스크립트] 기대를 채점한다. 저장소 맨 위에서 돌린다.
#
# 사용법: bash .claude/skills/prepublish-check/evals/grade.sh 평가번호 보고파일 평가사본폴더
#   평가사본폴더: make-fixtures.sh가 만든 폴더({EVALS}). checksums.txt로 「글을 고치지 않음」을 본다.
# 출력: 기대마다 「통과」나 「실패」 한 줄. 실패가 하나라도 있으면 끝 코드 1.
# [사람] 기대는 채점하지 않는다. 이스타가 보고를 읽고 판단한다.
set -euo pipefail

ID="$1"
REPORT="$2"
EVALS="$3"
ROOT="$(git rev-parse --show-toplevel)"

node --input-type=module - "$ID" "$REPORT" "$EVALS" "$ROOT" <<'EOF'
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [id, reportFile, evals, root] = process.argv.slice(2);
const { hasEvaluationScoreOrPublishDecision, recordsMarkerLocations } = await import(pathToFileURL(path.join(root, "scripts/skillEvalChecks.ts")));
const report = readFileSync(reportFile, "utf8");
const results = [];
const check = (name, isPassed) => results.push(`${isPassed ? "통과" : "실패"}  ${name}`);

/** 「### 제목」 아래 표의 데이터 줄(머리 줄과 구분 줄을 뺀 | 줄) */
const section = (title) => {
  const start = report.search(new RegExp(`^### ${title}`, "m"));

  if (start === -1) return [];

  const rest = report.slice(start).split("\n").slice(1);
  const end = rest.findIndex((line) => /^#{2,3} /.test(line));
  const rows = (end === -1 ? rest : rest.slice(0, end)).filter((line) => line.trim().startsWith("|"));

  return rows.slice(2);
};

const sha = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const checksums = Object.fromEntries(
  readFileSync(path.join(evals, "checksums.txt"), "utf8")
    .trim()
    .split("\n")
    .map((line) => line.split(/\s+/))
    .map(([hash, file]) => [file, hash]),
);
const unchanged = (relative) => checksums[relative] === sha(path.join(evals, relative));
const fails = section("실패").join("\n");
const humans = section("사람이 볼 것").join("\n");
const passes = section("통과").join("\n");
const skips = section("돌리지 않음").join("\n");

const countRows = (title) =>
  section(title).reduce((sum, row) => {
    const bundled = /스크립트 항목 (\d+)건/.exec(row);

    return sum + (bundled ? Number(bundled[1]) : 1);
  }, 0);

if (id === "1") {
  check("네 표 제목이 모두 있다", ["실패", "사람이 볼 것", "통과", "돌리지 않음"].every((title) => new RegExp(`^### ${title}`, "m").test(report)));
  check("평가 점수와 게시 판단 문장이 없다", !hasEvaluationScoreOrPublishDecision(report));
  check("사본의 〔이스타 확인〕 표시 위치가 실패나 사람이 볼 것에 있다", recordsMarkerLocations(readFileSync(path.join(evals, "p1-marker/virtualized-document-list/index.mdx"), "utf8"), [...section("실패"), ...section("사람이 볼 것")]));

  const line = /결과: 실패 (\d+)건, 사람이 볼 것 (\d+)건, 통과 (\d+)건, 돌리지 않음 (\d+)건/.exec(report);

  check(
    "결과 줄의 건수가 표의 줄 수와 같다",
    line !== null &&
      Number(line[1]) === (fails.trim() ? countRows("실패") : 0) &&
      Number(line[2]) === countRows("사람이 볼 것") &&
      Number(line[3]) === countRows("통과") &&
      Number(line[4]) === countRows("돌리지 않음"),
  );
  check("사본 글이 바뀌지 않았다", unchanged("p1-marker/virtualized-document-list/index.mdx"));
}

if (id === "2") {
  check("실패 표에 요약 길이 항목이 있다", /(요약|description)[^|]*길이|길이[^|]*(요약|description)/.test(fails));
  check("사본 글이 바뀌지 않았다", unchanged("p2-long-description/virtualized-document-list/index.mdx"));
}

if (id === "3") {
  check(
    "실패 표에 「얼마나 빨라졌나」와 「측정에는 Playwright를 썼습니다」가 함께 든 줄이 있다",
    section("실패").some((row) => row.includes("얼마나 빨라졌나") && row.includes("측정에는 Playwright를 썼습니다")),
  );

  const all = [fails, humans, passes, skips].join("\n");
  const missing = Array.from({ length: 13 }, (_, index) => `J${index + 1}`).filter((item) => !new RegExp(`\\b${item}\\b`).test(all));

  check(`J1~J13이 모두 표에 있다${missing.length ? ` (빠짐: ${missing.join(", ")})` : ""}`, missing.length === 0);
}

if (id === "4") {
  const copy = path.join(evals, "p5-no-lang/virtual-list-row-range/index.mdx");
  const original = readFileSync(path.join(root, "src/content/posts/virtual-list-row-range/index.mdx"), "utf8").split("\n");
  const after = readFileSync(copy, "utf8").split("\n");
  let codeLanguageFailed = true;

  try {
    const json = JSON.parse(execFileSync("node", [path.join(root, "scripts/checkPost.ts"), copy, "--json"], { encoding: "utf8" }));

    codeLanguageFailed = json.posts[0].results.some((result) => result.id === "code-language" && result.status === "fail");
  } catch (error) {
    codeLanguageFailed = JSON.parse(error.stdout).posts[0].results.some((result) => result.id === "code-language" && result.status === "fail");
  }

  const changed = after.flatMap((line, index) => (line === original[index] ? [] : [line]));

  check("사본에 code-language 실패가 없다", !codeLanguageFailed);
  check("바뀐 줄이 코드 칸 울타리 줄뿐이다", after.length === original.length && changed.every((line) => /^\s*```/.test(line)));
  check("「### 고친 것」 표가 한 줄 이상이다", section("고친 것").length >= 1);
}

if (id === "5") {
  check("실패 표에 /posts/no-such-post/ 가 있다", fails.includes("/posts/no-such-post/"));
  check(
    "빌드 결과 항목이 돌리지 않음에 있고 통과에 없다",
    /빌드/.test(skips) && !/(BlogPosting|BreadcrumbList|canonical|og:|RSS|사이트맵|llms|페이지 JS|빌드 결과)/.test(passes),
  );
}

console.log(results.join("\n"));
process.exitCode = results.some((line) => line.startsWith("실패")) ? 1 : 0;
EOF
