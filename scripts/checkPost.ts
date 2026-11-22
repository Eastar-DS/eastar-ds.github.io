/**
 * 게시 전 점검: 글이 정본 `docs/content-guide.md`(10장 게시 전 확인 목록과 그 항목이 가리키는 장)를 지키는지 기계로 셀 수 있는 것만 검사합니다.
 * 이 머리 주석이 쓰는 법과 출력 칸의 정본입니다. prepublish-check 스킬(`.claude/skills/prepublish-check`)과 배포 워크플로가 부릅니다.
 * 기준 값과 근거는 `scripts/checkPost/constants.ts`, 검사는 `scripts/checkPost/`의 순수 함수에 있습니다.
 * 바깥 패키지를 쓰지 않아 Node 24로 바로 돌고, writing-style 검사만 bash로 `.claude/skills/writing-style/check.sh`를 부릅니다.
 *
 * 쓰는 법
 * - `node scripts/checkPost.ts <slug>`: 글 하나(`src/content/posts/{slug}/index.mdx`)의 원문을 검사합니다. 초안도 검사합니다.
 * - `node scripts/checkPost.ts <경로>`: `index.mdx` 파일이나 그 폴더를 받습니다. 저장소 밖 사본(평가 사본)도 됩니다.
 *   폴더 이름을 slug로 보고, 저장소에 같은 slug의 글이 있으면 그 글 대신 사본을 넣어 링크와 시리즈를 봅니다.
 * - `node scripts/checkPost.ts --all`: 초안이 아닌 글을 모두 검사합니다. 초안은 `--dist`가 있을 때 배포 빌드에서 빠졌는지만 봅니다.
 * - `node scripts/checkPost.ts --include-drafts`: 초안까지 모든 글을 검사합니다(`--all --include-drafts`와 같음).
 * - `--dist [폴더]`: 빌드 결과도 검사합니다. 폴더를 주지 않으면 저장소의 `dist`입니다. 먼저 `pnpm build`를 돌립니다.
 *   초안은 글 페이지 항목을 건너뜀(skip)으로 내고, 글이 dist, RSS, 사이트맵, llms.txt, 다른 페이지의 링크에 새지 않았는지만 봅니다.
 * - `--json`: 결과를 JSON으로 냅니다. 통과한 항목까지 모두 들어갑니다.
 * - `--verbose`: 사람이 읽는 표에 통과한 항목도 한 줄씩 보입니다.
 *
 * 끝 코드: 실패가 없으면 0(경고와 건너뜀만 있어도 0), 실패가 하나라도 있으면 1, 입력이 잘못되면 2(없는 글, 없는 dist, 모르는 옵션).
 *
 * `--json` 출력의 칸
 * - `version`: 1
 * - `summary`: `{ posts, fail, warn, skip, pass }` 모든 글을 더한 항목 수
 * - `posts[]`: 글마다
 *   - `slug`, `file`(저장소 안 경로, 저장소 밖 사본이면 절대 경로), `title`, `draft`, `summary`(그 글의 항목 수)
 *   - `results[]`: 검사마다 `id`(검사 이름), `label`(항목 이름), `section`(content-guide의 절: 10장이면 `10.1`, 아니면 `5장` 꼴),
 *     `status`(`pass` 통과, `fail` 실패, `warn` 경고, `skip` 건너뜀), `summary`(한 줄 결과), `findings[]`(`line` 글 파일의 줄 번호, `message` 찾은 값),
 *     `basis`(기준의 근거 파일 · 절), `fix`(고칠 방법, 통과면 없음)
 *   - `material`: 판단 항목의 재료. `firstParagraph`(첫 문단의 줄과 글), `headings[]`(제목, id, 묻는 꼴인지, 첫 문장),
 *     `links[]`(`kind`: `internal` · `external` · `anchor`), `images[]`(alt, Figure 안인지), `figures[]`(설명), `reviewMarkers[]`(〔이스타 확인〕 표시의 줄)
 *
 * 실패와 경고를 가르는 기준은 `scripts/checkPost/constants.ts`의 머리 주석에 있습니다.
 * GitHub Actions에서 돌면(`GITHUB_ACTIONS=true`) 실패한 곳마다 `::error` 알림 줄을 더 찍어 커밋 화면의 글 줄에 붙입니다.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { SITE } from "../src/shared/constants/site/index.ts";
import checkDist, { type DistFiles } from "./checkPost/checkDist.ts";
import checkSource, { toWritingStyleResult } from "./checkPost/checkSource.ts";
import collectMaterial from "./checkPost/collectMaterial.ts";
import { CHECK_SECTIONS } from "./checkPost/constants.ts";
import { formatGithubAnnotations, formatJson, formatText, type PostReport } from "./checkPost/formatReport.ts";
import readSourcePost, { type SourcePost } from "./checkPost/readSourcePost.ts";
import type { CheckResult } from "./checkPost/types.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const POSTS_DIR = path.join(ROOT, "src/content/posts");
const WRITING_STYLE_CHECK = path.join(ROOT, ".claude/skills/writing-style/check.sh");
const USAGE = "쓰는 법: node scripts/checkPost.ts <slug | index.mdx 경로>... [--dist [폴더]] [--json] [--verbose]\n       node scripts/checkPost.ts --all [--include-drafts] [--dist [폴더]] [--json]";

/** 입력이 잘못되었을 때(끝 코드 2) 던지는 오류 */
const inputError = (message: string) => Object.assign(new Error(message), { isInputError: true });

const isInputError = (error: unknown) => error instanceof Error && "isInputError" in error;

interface Options {
  targets: string[];
  isAll: boolean;
  isIncludingDrafts: boolean;
  distDir?: string;
  isJson: boolean;
  isVerbose: boolean;
}

const parseArgs = (args: string[]) => {
  const options: Options = { targets: [], isAll: false, isIncludingDrafts: false, isJson: false, isVerbose: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? "";

    if (arg === "--all") options.isAll = true;
    else if (arg === "--include-drafts") options.isIncludingDrafts = true;
    else if (arg === "--json") options.isJson = true;
    else if (arg === "--verbose") options.isVerbose = true;
    else if (arg.startsWith("--dist=")) options.distDir = path.resolve(arg.slice("--dist=".length));
    else if (arg === "--dist") {
      // 다음 인자가 있는 폴더면 dist 폴더로 받고, 아니면(글 이름 등) 저장소의 dist를 씁니다
      const next = args[index + 1];
      const isFolder = next !== undefined && !next.startsWith("-") && existsSync(next) && statSync(next).isDirectory();

      options.distDir = isFolder ? path.resolve(next) : path.join(ROOT, "dist");
      if (isFolder) index += 1;
    } else if (arg === "--help" || arg === "-h") throw inputError(USAGE);
    else if (arg.startsWith("-")) throw inputError(`모르는 옵션입니다: ${arg}\n${USAGE}`);
    else options.targets.push(arg);
  }

  if (options.isIncludingDrafts && options.targets.length === 0) options.isAll = true;
  if (!options.isAll && options.targets.length === 0) throw inputError(USAGE);
  if (options.isAll && options.targets.length > 0) throw inputError(`--all과 글 이름을 함께 줄 수 없습니다.\n${USAGE}`);

  return options;
};

const toDisplayPath = (file: string) => {
  const relative = path.relative(ROOT, file);

  return relative.startsWith("..") || path.isAbsolute(relative) ? file : relative.split(path.sep).join("/");
};

const readPostFile = ({ slug, file }: { slug: string; file: string }) =>
  readSourcePost({ slug, file: toDisplayPath(file), source: readFileSync(file, "utf8") });

const readRepoPosts = () =>
  existsSync(POSTS_DIR)
    ? readdirSync(POSTS_DIR)
        .filter((entry) => existsSync(path.join(POSTS_DIR, entry, "index.mdx")))
        .sort()
        .map((slug) => ({ slug, file: path.join(POSTS_DIR, slug, "index.mdx") }))
    : [];

/** 글 이름이나 경로를 글 파일로 바꿉니다 */
const resolveTarget = (target: string) => {
  const looksLikePath = target.includes("/") || target.endsWith(".mdx") || target.startsWith(".");

  if (!looksLikePath) {
    const file = path.join(POSTS_DIR, target, "index.mdx");

    if (!existsSync(file)) throw inputError(`글이 없습니다: src/content/posts/${target}/index.mdx`);

    return { slug: target, file, isCopy: false };
  }

  const resolved = path.resolve(process.cwd(), target);
  const file = existsSync(resolved) && statSync(resolved).isDirectory() ? path.join(resolved, "index.mdx") : resolved;

  if (!existsSync(file)) throw inputError(`글 파일이 없습니다: ${target}`);

  return { slug: path.basename(path.dirname(file)), file, isCopy: !file.startsWith(`${POSTS_DIR}${path.sep}`) };
};

const runWritingStyle = (file: string) => {
  const run = spawnSync("bash", [WRITING_STYLE_CHECK, file], { encoding: "utf8" });

  if (run.error) return toWritingStyleResult({ error: run.error.message });
  // check.sh는 grep의 끝 코드를 그대로 냅니다: 0 찾음, 1 없음, 2 이상 오류
  if (run.status === 1) return toWritingStyleResult({ lines: [] });
  if (run.status === 0) return toWritingStyleResult({ lines: run.stdout.split("\n").filter(Boolean) });

  return toWritingStyleResult({ error: run.stderr.trim() || `check.sh가 ${run.status}로 끝났습니다` });
};

const walk = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);

    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
  });

const createDistFiles = (distDir: string) => {
  const resolve = (relative: string) => path.join(distDir, ...relative.split("/"));
  const isFile = (file: string) => existsSync(file) && statSync(file).isFile();
  let files: string[] | undefined;
  const dist: DistFiles = {
    readText: (relative) => (isFile(resolve(relative)) ? readFileSync(resolve(relative), "utf8") : undefined),
    readBytes: (relative) => (isFile(resolve(relative)) ? new Uint8Array(readFileSync(resolve(relative))) : undefined),
    listFiles: () => {
      files ??= walk(distDir).map((file) => path.relative(distDir, file).split(path.sep).join("/"));
      return files;
    },
  };

  return dist;
};

const withSections = (results: CheckResult[]) => results.map((result) => ({ ...result, section: CHECK_SECTIONS[result.id] ?? "" }));

interface CheckOneParams {
  post: SourcePost;
  posts: SourcePost[];
  file: string;
  dist?: DistFiles;
  isSourceChecked: boolean;
}

const checkOne = ({ post, posts, file, dist, isSourceChecked }: CheckOneParams) => {
  const results = [
    ...(isSourceChecked ? [...checkSource({ post, posts, allowedEmails: [SITE.author.email] }), runWritingStyle(file)] : []),
    ...(dist ? checkDist({ slug: post.slug, meta: post.meta, dist }) : []),
  ];
  const report: PostReport = {
    slug: post.slug,
    file: post.file,
    title: post.meta.title,
    draft: post.meta.draft,
    results: withSections(results),
    material: isSourceChecked ? collectMaterial(post) : undefined,
  };

  return report;
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));

  if (options.distDir && !existsSync(path.join(options.distDir, "index.html"))) {
    throw inputError(`빌드 결과가 없습니다: ${toDisplayPath(options.distDir)}. 먼저 pnpm build를 돌리세요.`);
  }

  const dist = options.distDir ? createDistFiles(options.distDir) : undefined;
  const targets = options.targets.map(resolveTarget);
  const copies = new Map(targets.filter((target) => target.isCopy).map((target) => [target.slug, target]));
  const repoFiles = readRepoPosts().map((entry) => copies.get(entry.slug) ?? entry);
  const extraCopies = [...copies.values()].filter((copy) => !repoFiles.some((entry) => entry.slug === copy.slug));
  const fileBySlug = new Map([...repoFiles, ...extraCopies].map((entry) => [entry.slug, entry.file]));
  const posts = [...fileBySlug].map(([slug, file]) => readPostFile({ slug, file }));
  const postBySlug = new Map(posts.map((post) => [post.slug, post]));

  const reports = options.isAll
    ? posts.flatMap((post) => {
        const isSourceChecked = options.isIncludingDrafts || !post.meta.draft;

        if (!isSourceChecked && !dist) return [];

        const report = checkOne({ post, posts, file: fileBySlug.get(post.slug) ?? "", dist, isSourceChecked });

        // 원문을 보지 않는 초안은 배포 빌드에서 빠졌는지만 남깁니다(글 페이지 항목은 모두 건너뜀이라 줄만 늘어남)
        return [isSourceChecked ? report : { ...report, results: report.results.filter((result) => result.status !== "skip") }];
      })
    : targets.map((target) => {
        const post = postBySlug.get(target.slug);

        if (!post) throw inputError(`글을 읽지 못했습니다: ${target.file}`);

        return checkOne({ post, posts, file: target.file, dist, isSourceChecked: true });
      });

  if (options.isJson) {
    console.log(formatJson(reports));
  } else {
    const skippedDrafts = options.isAll && !options.isIncludingDrafts ? posts.filter((post) => post.meta.draft).map((post) => post.slug) : [];
    const checkedCount = reports.filter((report) => !report.draft || options.isIncludingDrafts || !options.isAll).length;

    if (reports.length > 0) console.log(formatText({ reports, isVerbose: options.isVerbose }));
    if (options.isAll && checkedCount === 0) console.log("\n초안이 아닌 글이 없어 원문 검사를 하지 않았습니다.");
    if (skippedDrafts.length > 0) {
      console.log(
        `\n초안 ${skippedDrafts.length}편(${skippedDrafts.join(", ")})은 원문을 검사하지 않았습니다${dist ? "(배포 빌드에서 빠졌는지만 봄)" : ""}. 초안까지 보려면 --include-drafts를 씁니다.`,
      );
    }

    const failed = reports.filter((report) => report.results.some((result) => result.status === "fail"));

    console.log(failed.length > 0 ? `\n실패가 있는 글 ${failed.length}편: ${failed.map((report) => report.slug).join(", ")}` : "\n실패 없음");

    if (process.env.GITHUB_ACTIONS === "true") formatGithubAnnotations(reports).forEach((line) => console.log(line));
  }

  return reports.some((report) => report.results.some((result) => result.status === "fail")) ? 1 : 0;
};

try {
  process.exitCode = main();
} catch (error) {
  if (isInputError(error)) {
    console.error((error as Error).message);
    process.exitCode = 2;
  } else {
    throw error;
  }
}
