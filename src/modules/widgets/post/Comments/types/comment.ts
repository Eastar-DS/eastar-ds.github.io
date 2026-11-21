/**
 * Cloudflare Worker의 댓글 응답 모양입니다. Worker의 타입(worker/src/types/comment.ts)과 같게 둡니다.
 */

/** 공개 방식. approval이면 「이스타가 확인한 뒤 보입니다」를 알립니다 */
export type ModerationMode = "immediate" | "approval";

/** 답글 하나 */
export interface ReplyItem {
  id: string;
  nickname: string;
  content: string;
  /** ISO 8601 시각 */
  createdAt: string;
  /** 이스타가 노션에서 쓴 답글이면 true. 「글쓴이」 표시를 합니다 */
  isAuthor: boolean;
}

/** 최상위 댓글 하나와 그 답글(한 단계) */
export interface CommentItem extends ReplyItem {
  replies: ReplyItem[];
}

/** GET /comments 응답 */
export interface CommentListResponse {
  comments: CommentItem[];
  moderation: ModerationMode;
}

/** POST /comments 응답 (201) */
export interface CommentCreateResponse {
  id: string;
  status: "published" | "pending";
}

/** 입력 칸 가운데 오류를 표시할 칸 */
export type CommentField = "nickname" | "content";
