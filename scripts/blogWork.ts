/**
 * 글 작업 폴더(저장소 밖)와 설정의 경로를 알려 줍니다. 글 스킬(fact-check-post 등)이 부릅니다.
 *
 * 쓰는 법
 * - `node scripts/blogWork.ts dir <slug>`: `{작업 폴더 뿌리}/{slug}`를 만들고 절대 경로를 한 줄로 냅니다.
 *   slug는 영어 소문자와 숫자, 하이픈으로 된 글 이름과 `_evals`(평가 사본)만 받습니다.
 * - `node scripts/blogWork.ts repo <이름>`: 설정에 적은 저장소 사본의 절대 경로를 한 줄로 냅니다.
 * - `node scripts/blogWork.ts roots`: 설정의 자료 폴더를 줄마다 하나씩 냅니다.
 * - `node scripts/blogWork.ts config`: 지금 읽는 설정 파일의 절대 경로를 한 줄로 냅니다.
 *
 * 설정 파일은 아래 차례로 찾고 처음 있는 파일 하나만 읽습니다. 칸은 `.claude/blog-work.example.json`에 있습니다.
 * 1. 환경 변수 `BLOG_WORK_CONFIG`가 가리키는 파일
 * 2. 저장소 밖 `~/.blog-work/config.json`(기본)
 * 3. 저장소 안 `.claude/blog-work.local.json`(예전 방식, 올리지 않음)
 * 설정 파일이 없으면 작업 폴더 뿌리만 기본값 `~/.blog-work`으로 쓰고, `repo`와 `roots`는 찾은 곳을 알리고 멈춥니다.
 * 작업 폴더 뿌리는 환경 변수 `BLOG_WORK_DIR`, 설정의 `workDir`, 기본값 순으로 정합니다.
 *
 * 종료 코드
 * - 0: 성공
 * - 1: 설정 파일이 없음, `repo`의 이름이 설정에 없거나 그 경로가 없음
 * - 2: 입력이 잘못됨(쓰는 법, slug 꼴, 설정 파일 모양) 또는 작업 폴더가 저장소 안이라 거절함
 */
import { existsSync } from "node:fs";

import { ensurePostWorkDir, formatMissingConfig, readBlogWork } from "./blogWork/readBlogWork.ts";

const USAGE = "쓰는 법: node scripts/blogWork.ts dir <slug> | repo <이름> | roots | config";

const fail = (message: string, code: number) => {
  console.error(message);
  process.exitCode = code;
};

/** 설정 파일이 있어야 하는 명령에서 설정을 읽습니다. 없으면 알리고 `null` */
const readRequiredConfig = () => {
  const blogWork = readBlogWork();

  if (!blogWork.ok) {
    fail(blogWork.reason, 2);
    return null;
  }
  if (!blogWork.configFile) {
    fail(formatMissingConfig(blogWork.searched), 1);
    return null;
  }

  return blogWork;
};

const [command, arg] = process.argv.slice(2);

if (command === "dir" && arg) {
  const result = ensurePostWorkDir(arg);

  if (result.ok) console.log(result.dir);
  else fail(result.reason, 2);
} else if (command === "repo" && arg) {
  const blogWork = readRequiredConfig();
  const repoPath = blogWork?.repos[arg];

  if (!blogWork) {
    // readRequiredConfig가 알렸음
  } else if (repoPath === undefined) {
    fail(`설정의 repos에 「${arg}」가 없습니다(${blogWork.configFile})`, 1);
  } else if (!existsSync(repoPath)) {
    fail(`설정의 repos.${arg} 경로가 없습니다`, 1);
  } else {
    console.log(repoPath);
  }
} else if (command === "roots") {
  readRequiredConfig()?.sourceRoots.forEach((root) => console.log(root));
} else if (command === "config") {
  const blogWork = readRequiredConfig();

  if (blogWork) console.log(blogWork.configFile);
} else {
  fail(USAGE, 2);
}
