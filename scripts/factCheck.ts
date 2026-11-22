/**
 * 글의 사실 대조(fact-check-post 스킬)를 돕는 명령입니다. 판정은 하지 않고, 주장 후보를 뽑고 대조표의 형식과 인용을 검사합니다.
 *
 * 쓰는 법
 * - `node scripts/factCheck.ts extract <slug 또는 index.mdx 경로> [--out <파일>]`
 *   글에서 주장 후보를 뽑아 작업 폴더의 `claims.json`에 쓰고, 종류마다 뽑은 개수와 파일 경로를 냅니다.
 * - `node scripts/factCheck.ts verify <slug 또는 index.mdx 경로> [--report <파일>] [--claims <파일>]`
 *   작업 폴더의 `fact-check.md`를 검사해 문제마다 `대조표 줄 번호: 문제` 한 줄을 냅니다. 문제가 없으면 아무것도 내지 않습니다.
 *   `--report`만 주면 `claims.json`은 대조표와 같은 폴더에서 찾습니다.
 * - `node scripts/factCheck.ts status <slug 또는 index.mdx 경로>`
 *   대조표 상태 한 줄을 냅니다: `없음`, `낡음: 글이 대조 뒤에 바뀜`, `최신(YYYY-MM-DD): 다름 c, 일부 맞음 b, 출처에 없음 d, 못 엶 e`.
 *
 * 작업 폴더
 * - slug를 주면 글은 `src/content/posts/{slug}/index.mdx`, 작업 폴더는 `node scripts/blogWork.ts dir {slug}`와 같은 곳입니다.
 * - 글 파일 경로를 주면 slug는 글이 든 폴더 이름입니다. 글이 작업 폴더 뿌리 안(평가 사본 `_evals/…`)에 있으면 글이 든 폴더가 작업 폴더입니다.
 * - claims.json과 대조표는 저장소 안에 쓰거나 읽지 않습니다.
 *
 * verify가 보는 것(.claude/skills/fact-check-post/references/verdicts.md 4장과 agents/checker.md의 대조표 형식)
 * - V1 머리의 네 줄(글, 대조한 날, 자료 목록, 주장 n건)
 * - V2 머리의 sha256, claims.json의 sha256, 지금 글의 sha256이 같음
 * - V3 claims.json의 번호가 대조표나 「대조 안 함」 표에 한 번씩 있음
 * - V4 대조표의 판정이 맞음, 일부 맞음, 다름, 출처에 없음, 못 엶 가운데 하나(대조 안 함은 따로 표)
 * - V5 맞음, 일부 맞음, 다름의 출처 칸이 있고 근거가 `인용:`, `계산:`, `명령:`으로 시작함
 * - V6 `인용:`의 「」 글이 출처 칸의 파일(로컬 파일이나 fetched/ 아래 받은 원문)에 있음. 자세한 절의 「글」 줄은 글에 있음
 * - V7 출처에 없음의 찾은 곳, 못 엶의 실패한 까닭, 대조 안 함의 까닭이 비어 있지 않음
 * - V8 다름과 일부 맞음마다 `### 번호` 절과 고칠 말이 있음
 * - V9 머리의 건수가 표의 줄 수와 같음
 * - V10 판정과 근거 칸에 점수나 확신도 꼴의 글자가 없음
 * - 설정의 hiddenNames에 적은 이름이 대조표에 없음(이름은 출력하지 않음)
 * `명령:` 근거는 형식만 보고 다시 돌리지 않습니다(대조표의 글자를 명령으로 돌리지 않기 위해서입니다).
 *
 * 종료 코드
 * - extract: 0, 글을 읽지 못하거나 입력이 잘못되면 2
 * - verify: 문제가 없으면 0, 있으면 1, 입력(대조표, claims.json, 글)을 읽지 못하면 2
 * - status: 늘 0
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

import { readBlogWork } from "./blogWork/readBlogWork.ts";
import { expandHome, isInsideDir, resolvePostWorkDir } from "./blogWork/resolveWorkDir.ts";
import type { ClaimsFile } from "./factCheck/extractClaims.ts";
import { CLAIM_KINDS, createClaimsFile, sha256Text } from "./factCheck/extractClaims.ts";
import { readStatus } from "./factCheck/readStatus.ts";
import { formatProblems, verifyReport } from "./factCheck/verifyReport.ts";

const USAGE = [
  "쓰는 법:",
  "  node scripts/factCheck.ts extract <slug 또는 index.mdx 경로> [--out <파일>]",
  "  node scripts/factCheck.ts verify <slug 또는 index.mdx 경로> [--report <파일>] [--claims <파일>]",
  "  node scripts/factCheck.ts status <slug 또는 index.mdx 경로>",
].join("\n");

/** 소스 파일 하나를 읽을 때의 상한. 받아 둔 웹 원문과 측정 결과는 이보다 작습니다 */
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const fail = (message: string, code: number) => {
  console.error(message);
  process.exitCode = code;
};

const readText = (filePath: string) => {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
};

const parseOptions = (args: string[]) => {
  const options: Record<string, string> = {};
  const positional: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    if (args[index].startsWith("--") && args[index + 1] !== undefined) {
      options[args[index].slice(2)] = args[index + 1];
      index += 1;
    } else {
      positional.push(args[index]);
    }
  }

  return { options, positional };
};

/** 인자(slug나 글 파일 경로)로 글 파일과 작업 폴더를 정합니다 */
const resolveTarget = (arg: string) => {
  const blogWork = readBlogWork();

  if (!blogWork.ok) return { ok: false, reason: blogWork.reason } as const;

  const { repoRoot, workRoot } = blogWork;
  const isPath = arg.includes("/") || arg.includes(path.sep) || /\.mdx?$/u.test(arg);
  const file = isPath
    ? path.resolve(expandHome({ value: arg, home: homedir() }))
    : path.join(repoRoot, "src", "content", "posts", arg, "index.mdx");
  const slug = isPath ? path.basename(path.dirname(file)) : arg;

  if (isPath && isInsideDir({ dir: file, parent: workRoot })) {
    if (isInsideDir({ dir: workRoot, parent: repoRoot })) {
      return { ok: false, reason: `작업 폴더가 저장소 안에 있습니다(${workRoot}). 저장소 밖 경로를 설정하세요` } as const;
    }

    return { ok: true, blogWork, file, slug, workDir: path.dirname(file) } as const;
  }

  const resolved = resolvePostWorkDir({ workRoot, slug, repoRoot });

  if (!resolved.ok) return { ok: false, reason: resolved.reason } as const;

  return { ok: true, blogWork, file, slug, workDir: resolved.dir } as const;
};

const extract = (args: string[]) => {
  const { options, positional } = parseOptions(args);
  const target = positional[0] ? resolveTarget(positional[0]) : null;

  if (!target) return fail(USAGE, 2);
  if (!target.ok) return fail(target.reason, 2);

  const source = readText(target.file);

  if (source === null) return fail(`글을 읽지 못했습니다: ${target.file}`, 2);

  const out = path.resolve(options.out ?? path.join(target.workDir, "claims.json"));

  if (isInsideDir({ dir: out, parent: target.blogWork.repoRoot })) {
    return fail(`claims.json을 저장소 안에 쓰지 않습니다: ${out}`, 2);
  }

  const claimsFile = createClaimsFile({
    source,
    slug: target.slug,
    file: target.file,
    generatedAt: new Date().toISOString(),
  });

  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(claimsFile, null, 2)}\n`);

  CLAIM_KINDS.forEach((kind) => console.log(`${kind}: ${claimsFile.counts[kind]}`));
  console.log(`모두: ${claimsFile.claims.length}`);
  console.log(`claims.json: ${out}`);
};

const isClaimsFile = (value: unknown): value is ClaimsFile => {
  const candidate = value as Partial<ClaimsFile> | null;

  return (
    typeof candidate === "object" &&
    candidate !== null &&
    typeof candidate.post?.sha256 === "string" &&
    Array.isArray(candidate.claims)
  );
};

const verify = (args: string[]) => {
  const { options, positional } = parseOptions(args);
  const target = positional[0] ? resolveTarget(positional[0]) : null;

  if (!target) return fail(USAGE, 2);
  if (!target.ok) return fail(target.reason, 2);

  const reportPath = path.resolve(options.report ?? path.join(target.workDir, "fact-check.md"));
  const claimsPath = path.resolve(options.claims ?? path.join(path.dirname(reportPath), "claims.json"));
  const reportText = readText(reportPath);
  const claimsText = readText(claimsPath);
  const postText = readText(target.file);

  if (reportText === null) return fail(`대조표를 읽지 못했습니다: ${reportPath}`, 2);
  if (claimsText === null) return fail(`claims.json을 읽지 못했습니다: ${claimsPath}`, 2);
  if (postText === null) return fail(`글을 읽지 못했습니다: ${target.file}`, 2);

  let claimsFile: unknown;

  try {
    claimsFile = JSON.parse(claimsText);
  } catch {
    return fail(`claims.json이 JSON이 아닙니다: ${claimsPath}`, 2);
  }
  if (!isClaimsFile(claimsFile)) return fail(`claims.json의 모양이 다릅니다: ${claimsPath}`, 2);

  const { blogWork } = target;
  const home = homedir();
  const searchDirs = [path.dirname(reportPath), blogWork.repoRoot, ...blogWork.sourceRoots, ...Object.values(blogWork.repos)];
  const isFile = (filePath: string) => existsSync(filePath) && statSync(filePath).isFile();
  const resolveSourcePath = (token: string) => {
    const expanded = expandHome({ value: token, home });

    if (path.isAbsolute(expanded)) return isFile(expanded) ? expanded : null;

    return searchDirs.map((dir) => path.join(dir, expanded)).find(isFile) ?? null;
  };
  const readSourceFile = (filePath: string) => (statSync(filePath).size > MAX_SOURCE_BYTES ? null : readText(filePath));

  const problems = verifyReport({
    reportText,
    claimsFile,
    postText,
    postSha256: sha256Text(postText),
    resolveSourcePath,
    readSourceFile,
    hiddenNames: blogWork.hiddenNames,
  });

  formatProblems(problems).forEach((line) => console.log(line));
  process.exitCode = problems.length > 0 ? 1 : 0;
};

const status = (args: string[]) => {
  const { positional } = parseOptions(args);
  let line = "없음";

  try {
    const target = positional[0] ? resolveTarget(positional[0]) : null;

    if (target?.ok) {
      const postText = readText(target.file);

      line = readStatus({
        reportText: readText(path.join(target.workDir, "fact-check.md")),
        postSha256: postText === null ? null : sha256Text(postText),
      });
    }
  } catch {
    line = "없음";
  }

  console.log(line);
  process.exitCode = 0;
};

const [command, ...rest] = process.argv.slice(2);

if (command === "extract") extract(rest);
else if (command === "verify") verify(rest);
else if (command === "status") status(rest);
else fail(USAGE, 2);
