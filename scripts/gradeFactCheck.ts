/** 판정의 낱말만으로 통과시키지 않고 verify와 사본·원본 해시를 함께 봅니다. 판정의 뜻은 사람이 따로 평가합니다. */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sha256Text } from "./factCheck/extractClaims.ts";
import type { ClaimsFile } from "./factCheck/extractClaims.ts";
import { parseReport, readClaimIds } from "./factCheck/verifyReport.ts";
import { assertOutsideRepo, REPO_ROOT, runCli } from "./postWork/io.ts";
import { recordsNumberConflict } from "./skillEvalChecks.ts";
runCli(() => {
  const [scenario, reportArg] = process.argv.slice(2); const id = Number(scenario);
  if (!reportArg || !/^\d$/.test(scenario) || id > 5) throw new Error("시나리오 0~5와 대조표 경로가 필요합니다");
  const reportFile = assertOutsideRepo(path.resolve(reportArg)); const dir = path.dirname(reportFile);
  const metadata = JSON.parse(readFileSync(path.join(dir, "fixture.json"), "utf8"));
  const file = path.join(dir, "index.mdx"); const text = readFileSync(reportFile, "utf8");
  const results = [{ name: "시나리오 번호", passed: metadata.id === id }, { name: "사본 원문 유지", passed: sha256Text(readFileSync(file, "utf8")) === metadata.fixtureSha256 }, { name: "저장소 원문 유지", passed: sha256Text(readFileSync(path.join(REPO_ROOT, metadata.original), "utf8")) === metadata.originalSha256 }];
  try { execFileSync(process.execPath, [path.join(REPO_ROOT, "scripts/factCheck.ts"), "verify", file, "--report", reportFile], { stdio: ["ignore", "pipe", "pipe"] }); results.push({ name: "verify", passed: true }); }
  catch { results.push({ name: "verify", passed: false }); }
  const parsed = parseReport(text); const rows = parsed.sections["대조표"]?.table?.rows ?? [];
  const claims: ClaimsFile = JSON.parse(readFileSync(path.join(dir, "claims.json"), "utf8"));
  const pattern = [null, /996ms/, /(?:38|12)MB/, /getRowOffset(?:\.ts)?$/, /React 18/, /-nope/][id];
  const targetIds = claims.claims.filter((claim) => pattern?.test(claim.text)).map((claim) => claim.id);
  const targets = rows.filter((row) => readClaimIds(row.cells["번호"] ?? "").some((key) => targetIds.includes(key)));
  if (id) results.push({ name: "바꾼 주장 모두 대조표에 있음", passed: targetIds.length > 0 && targetIds.every((key) => targets.some((row) => readClaimIds(row.cells["번호"]).includes(key))) });
  const all = (check: (cells: Record<string, string>) => boolean) => targets.length > 0 && targets.every((row) => check(row.cells));
  if (id === 1) {
    const details = parsed.sections["다름과 일부 맞음"]?.details ?? [];
    const evidence = [...targets.map((row) => Object.values(row.cells).join(" ")), ...details.filter((detail) => detail.ids.some((key) => targetIds.includes(key))).flatMap((detail) => detail.body.map((line) => line.text))].join("\n");
    results.push({ name: "996ms는 다름, 966 근거와 글의 다른 위치 기록", passed: all((row) => row["판정"] === "다름") && recordsNumberConflict({ evidence, postText: readFileSync(file, "utf8"), correctValue: "966", changedLines: claims.claims.filter((claim) => targetIds.includes(claim.id)).flatMap((claim) => claim.lines) }) });
  }
  if (id === 2) results.push({ name: "38MB와 12MB는 출처에 없음", passed: all((row) => row["판정"] === "출처에 없음") });
  if (id === 3) results.push({ name: "없는 함수 이름과 실제 이름의 명령 또는 코드 인용 근거", passed: all((row) => ["다름", "출처에 없음"].includes(row["판정"]) && /^(?:명령:|인용:)/.test(row["근거"]) && /getRowOffsets/.test(row["근거"] + row["고칠 말"])) });
  if (id === 4) results.push({ name: "React 버전의 공식 문서 근거", passed: all((row) => ["다름", "일부 맞음"].includes(row["판정"]) && /react\.dev|legacy\.reactjs\.org|github\.com\/facebook\/react/.test(row["출처"]) && /fetched\//.test(row["출처"])) });
  if (id === 5) results.push({ name: "열지 못한 주소는 못 엶", passed: all((row) => row["판정"] === "못 엶") });
  const report = { scenario: id, scope: "형식·변경 보존·의도한 오류 검출 검사. 모든 판정의 타당성은 사람이 별도 확인함", results, passed: results.every((item) => item.passed) };
  writeFileSync(path.join(dir, "grade.json"), JSON.stringify(report, null, 2) + "\n"); console.log(JSON.stringify(report, null, 2)); if (!report.passed) process.exitCode = 1;
});
