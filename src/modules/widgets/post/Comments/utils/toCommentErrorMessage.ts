import { CONTENT_MAX_LENGTH, NICKNAME_MAX_LENGTH } from "@/modules/widgets/post/Comments/constants/commentLimits";
import type { CommentField } from "@/modules/widgets/post/Comments/types/comment";

interface CommentErrorMessage {
  message: string;
  /** 오류를 표시하고 포커스를 옮길 입력 칸. 없으면 null */
  field: CommentField | null;
}

const RETRY_LATER = "댓글을 저장하지 못했습니다. 잠시 뒤 다시 남겨 주세요.";
const RELOAD = "댓글을 남기지 못했습니다. 페이지를 새로 고친 뒤 다시 남겨 주세요.";

const MESSAGES: Record<string, CommentErrorMessage> = {
  nickname_required: { message: "닉네임을 적어 주세요.", field: "nickname" },
  nickname_too_long: { message: `닉네임은 ${NICKNAME_MAX_LENGTH}자까지 쓸 수 있습니다.`, field: "nickname" },
  nickname_blocked: { message: "이 닉네임은 쓸 수 없습니다. 다른 닉네임을 적어 주세요.", field: "nickname" },
  content_required: { message: "댓글 내용을 적어 주세요.", field: "content" },
  content_too_long: { message: `댓글은 ${CONTENT_MAX_LENGTH}자까지 쓸 수 있습니다.`, field: "content" },
  too_many_requests: { message: "댓글을 너무 자주 남겼습니다. 1분 뒤에 다시 남겨 주세요.", field: null },
  turnstile_failed: { message: "스팸 확인을 통과하지 못했습니다. 잠시 뒤 다시 남겨 주세요.", field: null },
  invalid_parent: {
    message: "답글을 달 댓글을 찾지 못했습니다. 페이지를 새로 고친 뒤 다시 남겨 주세요.",
    field: null,
  },
  invalid_request: { message: RELOAD, field: null },
  spam_suspected: { message: RELOAD, field: null },
  forbidden_origin: { message: RELOAD, field: null },
};

/**
 * Worker의 오류 값(worker/src/types/comment.ts의 CommentErrorCode)을 화면에 보일 안내로 바꿉니다.
 * 모르는 값(저장 실패, 네트워크 오류 등)은 「잠시 뒤 다시」 안내로 둡니다.
 */
const toCommentErrorMessage = (code: string | undefined): CommentErrorMessage =>
  MESSAGES[code ?? ""] ?? { message: RETRY_LATER, field: null };

export default toCommentErrorMessage;
