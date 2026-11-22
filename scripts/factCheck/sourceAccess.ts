/** 설정에 허용된 공개 자료만 읽습니다. 단서 자료와 비밀 파일은 내용에 접근하지 않습니다. */
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { physicalPath } from "../blogWork/pathSafety.ts";
import { isInsideDir } from "../blogWork/resolveWorkDir.ts";
import type { ReadPolicy } from "../blogWork/resolveWorkDir.ts";
import { isUnopenable, policyFor } from "../gatherPostSources/material.ts";
export const makeSourceAccess = (config: { roots: string[]; readPolicy: readonly ReadPolicy[]; unopenedNames: readonly string[] }) => {
  const physicalPolicies = config.readPolicy.map((rule) => {
    try { return { ...rule, path: physicalPath(rule.path) }; } catch { return rule; }
  });
  const allowed = (file: string) => {
    try {
      if (isUnopenable(file, config.unopenedNames) || policyFor(file, config.readPolicy).read !== "읽음") return false;
      const real = physicalPath(file);
      if (isUnopenable(real, config.unopenedNames) || policyFor(real, physicalPolicies).read !== "읽음") return false;
      return config.roots.some((root) => isInsideDir({ dir: real, parent: physicalPath(root) }));
    } catch { return false; }
  };
  const read = (file: string) => {
    if (!allowed(file)) return null;
    try {
      const stat = statSync(file);
      if (!stat.isFile() || stat.size > 20 * 1024 * 1024) return null;
      const body = readFileSync(file, "utf8");
      // 일부 HTML 응답은 스트림 구분에 NUL을 포함합니다. HTML 머리가 있는 원문은 인용 대조에 씁니다.
      return body.includes("\0") && !(/\.x?html?$/i.test(file) && /<(?:!doctype html|html)[\s>]/i.test(body)) ? null : body;
    } catch { return null; }
  };
  const resolve = (token: string) => {
    const files = path.isAbsolute(token) ? [token] : config.roots.map((root) => path.resolve(root, token));
    return files.find((file) => allowed(file) && (() => { try { return statSync(file).isFile(); } catch { return false; } })()) ?? null;
  };
  return { allowed, read, resolve };
};
