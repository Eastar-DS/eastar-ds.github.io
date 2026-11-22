// 글 작업 폴더(저장소 밖)와 설정 파일의 경로를 정하는 순수 함수들입니다. 파일을 읽거나 폴더를 만드는 일은 readBlogWork.ts가 합니다.
import path from "node:path";

/** 설정 파일의 모양. 예시는 `.claude/blog-work.example.json` */
export interface BlogWorkConfig {
  /** 글마다 하위 폴더를 만드는 뿌리 폴더. `~`로 시작해도 됨 */
  workDir?: string;
  /** 저장소 사본의 이름과 경로. 예: `{ "knot": "~/code/knot" }` */
  repos: Record<string, string>;
  /** 글 자료를 두는 폴더 목록 */
  sourceRoots: string[];
  /** 글과 결과 파일(대조표, 자료 목록)에 들어가면 안 되는 이름 목록 */
  hiddenNames: string[];
}

/** 설정이 없을 때 쓰는 작업 폴더 뿌리 */
export const DEFAULT_WORK_DIR = "~/.blog-work";

/** 저장소 밖 기본 설정 파일. Paseo가 새 worktree에서 에이전트를 띄워도 같은 파일을 읽게 저장소 밖에 둡니다 */
export const DEFAULT_CONFIG_FILE = "~/.blog-work/config.json";

/** 예전 방식의 저장소 안 설정 파일(저장소 맨 위 기준). `.gitignore`의 `.claude/*.local.json`이 올리지 않게 막습니다 */
export const LEGACY_CONFIG_FILE = path.join(".claude", "blog-work.local.json");

/** 평가 사본을 두는 작업 폴더 이름. 글 이름 규칙의 예외로 받음 */
export const EVALS_SLUG = "_evals";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface ExpandHomeParams {
  value: string;
  home: string;
}

/** `~`와 `~/…`를 홈 폴더로 풉니다. `~user` 꼴은 풀지 않습니다 */
export const expandHome = ({ value, home }: ExpandHomeParams) => {
  if (value === "~") return home;
  if (value.startsWith("~/")) return path.join(home, value.slice(2));

  return value;
};

/** 작업 폴더 이름으로 받을 수 있는지 봅니다. 글 이름 꼴(영어 소문자와 숫자, 하이픈)과 `_evals`만 받습니다 */
export const isValidWorkSlug = (slug: string) => slug === EVALS_SLUG || SLUG_PATTERN.test(slug);

interface ListConfigCandidatesParams {
  /** 환경 변수 `BLOG_WORK_CONFIG` */
  envConfig: string | undefined;
  home: string;
  repoRoot: string;
}

/**
 * 설정 파일을 찾을 차례를 절대 경로로 돌려줍니다.
 * 1. 환경 변수 `BLOG_WORK_CONFIG`가 가리키는 파일(있으면 이 파일만 봅니다)
 * 2. 저장소 밖 `~/.blog-work/config.json`
 * 3. 저장소 안 `.claude/blog-work.local.json`(예전 방식)
 */
export const listConfigCandidates = ({ envConfig, home, repoRoot }: ListConfigCandidatesParams) => {
  if (envConfig !== undefined && envConfig.trim() !== "") {
    return [path.resolve(expandHome({ value: envConfig.trim(), home }))];
  }

  return [path.resolve(expandHome({ value: DEFAULT_CONFIG_FILE, home })), path.join(repoRoot, LEGACY_CONFIG_FILE)];
};

const isStringRecord = (value: unknown): value is Record<string, string> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((item) => typeof item === "string");

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

/**
 * 설정 파일의 글을 읽습니다. 모양이 다르면 `{ ok: false }`와 까닭을 돌려줍니다.
 * 칸이 없으면 빈 값으로 채웁니다(`repos: {}`, `sourceRoots: []`, `hiddenNames: []`).
 */
export const parseBlogWorkConfig = (text: string) => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "JSON이 아닙니다" } as const;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: "맨 위가 객체가 아닙니다" } as const;
  }

  const { workDir, repos = {}, sourceRoots = [], hiddenNames = [] } = parsed as Record<string, unknown>;

  if (workDir !== undefined && typeof workDir !== "string") {
    return { ok: false, reason: "workDir가 문자열이 아닙니다" } as const;
  }
  if (!isStringRecord(repos)) {
    return { ok: false, reason: "repos가 이름과 경로(문자열)의 객체가 아닙니다" } as const;
  }
  if (!isStringArray(sourceRoots)) {
    return { ok: false, reason: "sourceRoots가 문자열 배열이 아닙니다" } as const;
  }
  if (!isStringArray(hiddenNames)) {
    return { ok: false, reason: "hiddenNames가 문자열 배열이 아닙니다" } as const;
  }

  const config: BlogWorkConfig = {
    workDir,
    repos,
    sourceRoots,
    hiddenNames: hiddenNames.map((name) => name.trim()).filter((name) => name !== ""),
  };

  return { ok: true, config } as const;
};

interface ResolveWorkRootParams {
  /** 환경 변수 `BLOG_WORK_DIR` */
  envWorkDir: string | undefined;
  config: BlogWorkConfig | null;
  home: string;
}

/** 작업 폴더 뿌리를 정합니다. 환경 변수 `BLOG_WORK_DIR`, 설정의 `workDir`, 기본값 `~/.blog-work` 순으로 고르고 절대 경로로 돌려줍니다 */
export const resolveWorkRoot = ({ envWorkDir, config, home }: ResolveWorkRootParams) => {
  const chosen = [envWorkDir, config?.workDir].find((value) => value !== undefined && value.trim() !== "");

  return path.resolve(expandHome({ value: (chosen ?? DEFAULT_WORK_DIR).trim(), home }));
};

interface IsInsideDirParams {
  dir: string;
  parent: string;
}

/** `dir`이 `parent`와 같거나 그 아래에 있는지 봅니다. 두 값은 절대 경로입니다 */
export const isInsideDir = ({ dir, parent }: IsInsideDirParams) => {
  const relative = path.relative(path.resolve(parent), path.resolve(dir));

  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
};

interface ResolvePostWorkDirParams {
  workRoot: string;
  slug: string;
  /** 저장소 맨 위 폴더(`git rev-parse --show-toplevel`). 작업 폴더가 그 안이면 거절합니다 */
  repoRoot: string;
}

/**
 * 글 한 편의 작업 폴더(`{작업 폴더 뿌리}/{slug}`)를 정합니다.
 * - 글 이름 꼴이 아니면 `invalid-slug`
 * - 작업 폴더가 저장소 안이면 `inside-repo`. 대조표와 받아 둔 원문이 공개 저장소에 들어가는 일을 막습니다
 */
export const resolvePostWorkDir = ({ workRoot, slug, repoRoot }: ResolvePostWorkDirParams) => {
  if (!isValidWorkSlug(slug)) {
    return { ok: false, kind: "invalid-slug", reason: `글 이름 꼴이 아닙니다: ${slug}` } as const;
  }

  const dir = path.join(workRoot, slug);

  if (isInsideDir({ dir: workRoot, parent: repoRoot }) || isInsideDir({ dir, parent: repoRoot })) {
    return {
      ok: false,
      kind: "inside-repo",
      reason: `작업 폴더가 저장소 안에 있습니다(${workRoot}). 저장소 밖 경로를 설정하세요`,
    } as const;
  }

  return { ok: true, dir } as const;
};
