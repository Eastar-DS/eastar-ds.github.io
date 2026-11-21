interface CommentDraft {
  nickname: string;
  content: string;
}

/**
 * 보내기 전에 빈 칸만 확인합니다. 글자 수는 입력 칸의 maxlength가 막고, 막힌 닉네임 같은 나머지는 Worker가 봅니다.
 * 돌려주는 값은 Worker 오류 값과 같은 이름이라 toCommentErrorMessage로 안내를 고릅니다. 문제가 없으면 null입니다.
 */
const validateCommentDraft = ({ nickname, content }: CommentDraft) => {
  if (nickname.trim().length === 0) return "nickname_required";
  if (content.trim().length === 0) return "content_required";

  return null;
};

export default validateCommentDraft;
