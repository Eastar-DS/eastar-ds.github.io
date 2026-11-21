/** 댓글 공개 방식. 블로그가 「확인 뒤 보입니다」 안내를 고르는 데도 씁니다 */
export type ModerationMode = "immediate" | "approval";

/** 노션 댓글 표의 한 줄을 Worker가 읽은 모양 */
export interface CommentRecord {
  id: string;
  postPath: string;
  nickname: string;
  content: string;
  parentId: string | null;
  isAuthorReply: boolean;
  isHidden: boolean;
  isApproved: boolean;
  createdAt: string;
}

/** 블로그에 보내는 답글 하나. 숨김 · 승인 같은 관리 값은 보내지 않습니다 */
export interface ReplyView {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
  /** 이스타가 노션에서 쓴 답글이면 true. 블로그가 「글쓴이」 표시를 합니다 */
  isAuthor: boolean;
}

/** 블로그에 보내는 최상위 댓글 하나와 그 답글(한 단계) */
export interface CommentView extends ReplyView {
  replies: ReplyView[];
}

/** 댓글 목록 응답 (GET /comments) */
export interface CommentListResponse {
  comments: CommentView[];
  moderation: ModerationMode;
}

/** 쓰기 요청을 검사하고 다듬은 값 */
export interface NewComment {
  postPath: string;
  nickname: string;
  content: string;
  parentId: string | null;
  turnstileToken: string;
}

/**
 * 오류 응답의 `error` 값. 블로그(src/modules/widgets/post/Comments/utils/toCommentErrorMessage.ts)가 이 값을 한국어 안내로 바꿉니다.
 * 응답에 댓글 본문과 토큰은 넣지 않습니다.
 */
export type CommentErrorCode =
  | "invalid_request"
  | "forbidden_origin"
  | "spam_suspected"
  | "nickname_required"
  | "nickname_too_long"
  | "nickname_blocked"
  | "content_required"
  | "content_too_long"
  | "invalid_parent"
  | "too_many_requests"
  | "turnstile_failed"
  | "not_configured"
  | "storage_failed"
  | "not_found"
  | "internal_error";
