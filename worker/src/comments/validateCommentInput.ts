import {
  CONTENT_MAX_LENGTH,
  NICKNAME_MAX_LENGTH,
  NOTION_ID_PATTERN,
  POST_PATH_PATTERN,
  TURNSTILE_TOKEN_MAX_LENGTH,
} from "../constants/comments";
import type { CommentErrorCode, NewComment } from "../types/comment";
import isBlockedNickname from "./isBlockedNickname";

type ValidationResult = { isValid: true; comment: NewComment } | { isValid: false; error: CommentErrorCode };

// 줄바꿈(\n)과 탭을 뺀 제어 문자, 그리고 보이지 않는 방향 바꿈 글자
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g;

/** 글자 수는 유니코드 글자(코드 포인트) 단위로 셉니다. 블로그 입력 칸의 maxlength(UTF-16 단위)보다 늘 작거나 같습니다 */
export const countCharacters = (text: string) => [...text].length;

const asString = (value: unknown) => (typeof value === "string" ? value : "");

export const normalizeNickname = (value: string) =>
  value.normalize("NFC").replace(CONTROL_CHARACTERS, "").replace(/\s+/g, " ").trim();

export const normalizeContent = (value: string) =>
  value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARACTERS, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * 댓글 쓰기 요청의 본문을 검사하고 저장할 값으로 다듬습니다. 숨은 입력 칸(homepage)이 채워졌으면 스팸으로 봅니다.
 * 빈도 제한 · Turnstile · 부모 댓글 확인은 여기서 하지 않습니다(바깥 호출이 필요해서 routes/comments가 함).
 */
const validateCommentInput = (body: unknown): ValidationResult => {
  if (typeof body !== "object" || body === null) return { isValid: false, error: "invalid_request" };

  const input = body as Record<string, unknown>;

  if (asString(input.homepage).length > 0) return { isValid: false, error: "spam_suspected" };

  const postPath = asString(input.postPath);
  const nickname = normalizeNickname(asString(input.nickname));
  const content = normalizeContent(asString(input.content));
  const turnstileToken = asString(input.turnstileToken);
  const parentId = input.parentId === undefined || input.parentId === null ? null : asString(input.parentId);

  if (!POST_PATH_PATTERN.test(postPath)) return { isValid: false, error: "invalid_request" };
  if (parentId !== null && !NOTION_ID_PATTERN.test(parentId)) return { isValid: false, error: "invalid_parent" };
  if (nickname.length === 0) return { isValid: false, error: "nickname_required" };
  if (countCharacters(nickname) > NICKNAME_MAX_LENGTH) return { isValid: false, error: "nickname_too_long" };
  if (content.length === 0) return { isValid: false, error: "content_required" };
  if (countCharacters(content) > CONTENT_MAX_LENGTH) return { isValid: false, error: "content_too_long" };
  if (isBlockedNickname(nickname)) return { isValid: false, error: "nickname_blocked" };
  if (turnstileToken.length === 0 || turnstileToken.length > TURNSTILE_TOKEN_MAX_LENGTH) {
    return { isValid: false, error: "turnstile_failed" };
  }

  return { isValid: true, comment: { postPath, nickname, content, parentId, turnstileToken } };
};

export default validateCommentInput;
