import { lstatSync, realpathSync } from "node:fs";
import path from "node:path";
import { isInsideDir } from "./resolveWorkDir.ts";
/** 없는 경로도 부모의 실제 경로로 검사합니다. 대상이 없는 심볼릭 링크는 거절합니다. */
export const physicalPath = (value: string): string => lstatSync(value, { throwIfNoEntry: false }) ? realpathSync(value) : path.join(physicalPath(path.dirname(value)), path.basename(value));
export const assertWorkOutsideRepo = (value: string, repoRoot: string) => {
  const resolved = physicalPath(value);
  if (isInsideDir({ dir: resolved, parent: physicalPath(repoRoot) })) throw new Error("작업 자료는 저장소 밖에 둬야 합니다");
  return resolved;
};
