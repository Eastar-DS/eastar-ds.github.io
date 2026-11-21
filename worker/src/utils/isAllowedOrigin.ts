import { ALLOWED_ORIGINS, LOCAL_ORIGIN_PATTERN } from "../constants/comments";

/** 댓글 경로를 부를 수 있는 출처인지 봅니다. 배포 주소와 로컬 개발 주소만 받습니다 */
const isAllowedOrigin = (origin: string | undefined | null) =>
  Boolean(origin) && (ALLOWED_ORIGINS.includes(origin ?? "") || LOCAL_ORIGIN_PATTERN.test(origin ?? ""));

export default isAllowedOrigin;
