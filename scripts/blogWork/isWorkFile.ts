/** 훅에서만 씁니다. 작업 폴더의 문서는 공개 글 문체로 고치지 않습니다. 값이나 경로는 출력하지 않습니다. */
import path from "node:path";
import { readBlogWork } from "./readBlogWork.ts";
import { isInsideDir } from "./resolveWorkDir.ts";
const config = readBlogWork();
process.exitCode = config.ok && process.argv[2] && isInsideDir({ dir: path.resolve(process.argv[2]), parent: config.workRoot }) ? 0 : 1;
