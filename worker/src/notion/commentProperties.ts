import { COMMENT_COLUMNS, NOTION_TEXT_CHUNK_LENGTH } from "../constants/notion";
import type { CommentRecord, ModerationMode, NewComment } from "../types/comment";

/** 노션 응답의 글 조각 (title · rich_text 칸의 값) */
interface NotionRichText {
  plain_text?: string;
}

/** 노션 응답의 칸 값. 이 표에서 쓰는 종류만 적습니다 */
interface NotionPropertyValue {
  type?: string;
  title?: NotionRichText[];
  rich_text?: NotionRichText[];
  relation?: { id: string }[];
  checkbox?: boolean;
  created_time?: string;
}

/** 노션 페이지(표의 한 줄) */
export interface NotionPage {
  id: string;
  created_time?: string;
  in_trash?: boolean;
  properties?: Record<string, NotionPropertyValue>;
}

const readText = (value: NotionPropertyValue | undefined) =>
  (value?.title ?? value?.rich_text ?? []).map((part) => part.plain_text ?? "").join("");

/** 노션 페이지 한 줄을 댓글 값으로 읽습니다. 칸이 비었거나 없으면 빈 값으로 봅니다 */
export const toCommentRecord = (page: NotionPage): CommentRecord => {
  const properties = page.properties ?? {};
  const read = (name: string) => properties[name];

  return {
    id: page.id,
    postPath: readText(read(COMMENT_COLUMNS.postPath)).trim(),
    nickname: readText(read(COMMENT_COLUMNS.nickname)).trim(),
    content: readText(read(COMMENT_COLUMNS.content)),
    parentId: read(COMMENT_COLUMNS.parent)?.relation?.[0]?.id ?? null,
    isAuthorReply: read(COMMENT_COLUMNS.isAuthorReply)?.checkbox ?? false,
    isHidden: (read(COMMENT_COLUMNS.isHidden)?.checkbox ?? false) || page.in_trash === true,
    isApproved: read(COMMENT_COLUMNS.isApproved)?.checkbox ?? false,
    createdAt: read(COMMENT_COLUMNS.createdAt)?.created_time ?? page.created_time ?? "",
  };
};

/** 긴 글을 노션 글자 칸 하나의 한도(2000자)로 나눠 rich_text 배열로 만듭니다 */
export const toRichText = (text: string) => {
  const characters = [...text];
  const chunks: string[] = [];

  for (let start = 0; start < characters.length; start += NOTION_TEXT_CHUNK_LENGTH) {
    chunks.push(characters.slice(start, start + NOTION_TEXT_CHUNK_LENGTH).join(""));
  }

  return chunks.map((content) => ({ type: "text", text: { content } }));
};

/** 새 댓글을 노션 페이지 만들기 요청의 properties로 바꿉니다 */
export const toCreateProperties = (comment: Omit<NewComment, "turnstileToken">) => ({
  [COMMENT_COLUMNS.content]: { title: toRichText(comment.content) },
  [COMMENT_COLUMNS.nickname]: { rich_text: toRichText(comment.nickname) },
  [COMMENT_COLUMNS.postPath]: { rich_text: toRichText(comment.postPath) },
  [COMMENT_COLUMNS.parent]: { relation: comment.parentId ? [{ id: comment.parentId }] : [] },
  [COMMENT_COLUMNS.isAuthorReply]: { checkbox: false },
  [COMMENT_COLUMNS.isHidden]: { checkbox: false },
  [COMMENT_COLUMNS.isApproved]: { checkbox: false },
});

/**
 * 한 글의 보일 댓글만 고르는 노션 질의 조건입니다. 「숨김」이 아닌 줄만, 「승인 뒤 보임」이면 「승인」 또는 「글쓴이 답글」인 줄만 받습니다.
 * Worker도 받은 뒤 한 번 더 거릅니다(buildCommentThreads).
 */
export const toCommentQueryFilter = ({ postPath, moderation }: { postPath: string; moderation: ModerationMode }) => ({
  and: [
    { property: COMMENT_COLUMNS.postPath, rich_text: { equals: postPath } },
    { property: COMMENT_COLUMNS.isHidden, checkbox: { equals: false } },
    ...(moderation === "approval"
      ? [
          {
            or: [
              { property: COMMENT_COLUMNS.isApproved, checkbox: { equals: true } },
              { property: COMMENT_COLUMNS.isAuthorReply, checkbox: { equals: true } },
            ],
          },
        ]
      : []),
  ],
});
