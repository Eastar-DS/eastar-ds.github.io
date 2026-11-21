import type { Post } from "@/shared/types/post";

interface IsPostVisibleParams {
  post: Pick<Post, "draft">;
  /** 개발 서버인지. 시험에서만 넘기고, 보통은 `import.meta.env.DEV`를 씁니다 */
  isDev?: boolean;
}

/** 이 빌드에서 글을 보일지 정합니다. 초안은 개발 서버에서만 보입니다 */
const isPostVisible = ({ post, isDev = import.meta.env.DEV }: IsPostVisibleParams) =>
  isDev || post.draft !== true;

export default isPostVisible;
