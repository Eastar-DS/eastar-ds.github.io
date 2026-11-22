// 설정 파일과 git에서 작업 폴더 정보를 읽습니다. scripts/blogWork.ts와 scripts/factCheck.ts가 함께 씁니다.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

import { assertWorkOutsideRepo } from "./pathSafety.ts";
import type { BlogWorkConfig } from "./resolveWorkDir.ts";
import {
  expandHome,
  listConfigCandidates,
  parseBlogWorkConfig,
  resolvePostWorkDir,
  resolveWorkRoot,
} from "./resolveWorkDir.ts";

const SCRIPT_REPO = path.resolve(import.meta.dirname, "..", "..");

const getRepoRoot = () => {
  try {
    return execFileSync("git", ["-C", SCRIPT_REPO, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return SCRIPT_REPO;
  }
};

/**
 * 저장소 맨 위 폴더, 작업 폴더 뿌리, 설정을 읽습니다.
 * - 설정 파일은 `listConfigCandidates`의 차례로 찾고 처음 있는 파일 하나만 읽습니다.
 * - 설정 파일이 없으면 `configFile: null`이고 작업 폴더 뿌리는 기본값입니다. 저장소 사본과 자료 폴더가 필요한 명령은 `searched`를 알리고 멈춥니다.
 * - `BLOG_WORK_CONFIG`가 가리키는 파일이 없거나, 찾은 파일의 모양이 다르면 `{ ok: false }`입니다.
 */
export const readBlogWork = () => {
  const home = homedir();
  const repoRoot = getRepoRoot();
  const envConfig = process.env.BLOG_WORK_CONFIG;
  const searched = listConfigCandidates({ envConfig, home, repoRoot });
  const configFile = searched.find((file) => existsSync(file)) ?? null;
  let config: BlogWorkConfig | null = null;

  if (envConfig?.trim() && !configFile) {
    return { ok: false, reason: `BLOG_WORK_CONFIG가 가리키는 설정 파일이 없습니다(${searched[0]})` } as const;
  }

  if (configFile) {
    const parsed = parseBlogWorkConfig(readFileSync(configFile, "utf8"));

    if (!parsed.ok) return { ok: false, reason: `설정 파일을 읽지 못했습니다(${configFile}): ${parsed.reason}` } as const;
    config = parsed.config;
  }

  const workRoot = resolveWorkRoot({ envWorkDir: process.env.BLOG_WORK_DIR, config, home });
  const toAbsolute = (value: string) => path.resolve(expandHome({ value, home }));

  return {
    ok: true,
    repoRoot,
    workRoot,
    configFile,
    searched,
    repos: Object.fromEntries(Object.entries(config?.repos ?? {}).map(([name, value]) => [name, toAbsolute(value)])),
    sourceRoots: (config?.sourceRoots ?? []).map(toAbsolute),
    hiddenNames: config?.hiddenNames ?? [],
    readPolicy: (config?.readPolicy ?? []).map((rule) => ({ ...rule, path: toAbsolute(rule.path) })),
    unopenedNames: config?.unopenedNames ?? [],
  } as const;
};

/** 설정 파일이 없을 때 알릴 문장 */
export const formatMissingConfig = (searched: readonly string[]) => `설정 파일이 없습니다(찾은 곳: ${searched.join(", ")})`;

/** 글 한 편의 작업 폴더를 정하고 없으면 만듭니다. 저장소 안이면 만들지 않고 거절합니다 */
export const ensurePostWorkDir = (slug: string) => {
  const blogWork = readBlogWork();

  if (!blogWork.ok) return { ok: false, kind: "config", reason: blogWork.reason } as const;

  const resolved = resolvePostWorkDir({ workRoot: blogWork.workRoot, slug, repoRoot: blogWork.repoRoot });

  if (!resolved.ok) return resolved;

  try {
    const dir = assertWorkOutsideRepo(resolved.dir, blogWork.repoRoot);
    mkdirSync(dir, { recursive: true });
    return { ok: true, dir } as const;
  } catch {
    return { ok: false, kind: "inside-repo", reason: "작업 폴더의 실제 경로를 확인할 수 없거나 저장소 안에 있습니다" } as const;
  }
};
