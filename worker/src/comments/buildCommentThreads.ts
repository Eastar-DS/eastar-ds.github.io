import { AUTHOR_DISPLAY_NAME } from "../constants/comments";
import type { CommentRecord, CommentView, ModerationMode, ReplyView } from "../types/comment";

interface IsVisibleCommentParams {
  record: CommentRecord;
  moderation: ModerationMode;
}

/**
 * 블로그에 보일 댓글인지 봅니다. 「숨김」이면 늘 빼고, 「승인 뒤 보임」 방식이면 「승인」된 것만 보입니다.
 * 이스타의 답글(「글쓴이 답글」)은 승인을 따로 체크하지 않아도 보입니다.
 */
export const isVisibleComment = ({ record, moderation }: IsVisibleCommentParams) => {
  if (record.isHidden) return false;
  if (moderation === "immediate") return true;

  return record.isApproved || record.isAuthorReply;
};

const toReplyView = (record: CommentRecord): ReplyView => ({
  id: record.id,
  nickname: record.nickname || (record.isAuthorReply ? AUTHOR_DISPLAY_NAME : "익명"),
  content: record.content,
  createdAt: record.createdAt,
  isAuthor: record.isAuthorReply,
});

const byCreatedAt = (a: { createdAt: string }, b: { createdAt: string }) => a.createdAt.localeCompare(b.createdAt);

/**
 * 노션에서 읽은 줄을 최상위 댓글과 그 답글(한 단계)로 묶습니다. 둘 다 쓴 시각 순서입니다.
 * - 보이지 않는 댓글(숨김 · 승인 전)은 빼고, 부모가 보이지 않는 답글도 뺍니다.
 * - 이스타가 노션에서 답글의 답글을 부모로 고른 경우에는 그 답글의 최상위 댓글 아래에 둡니다(늘 한 단계).
 * - 내용이 빈 줄(노션에서 막 만든 줄)은 뺍니다.
 */
const buildCommentThreads = ({ records, moderation }: { records: CommentRecord[]; moderation: ModerationMode }) => {
  const visibleRecords = records.filter(
    (record) => record.content.trim().length > 0 && isVisibleComment({ record, moderation }),
  );
  const recordsById = new Map(visibleRecords.map((record) => [record.id, record]));
  const findRootId = (record: CommentRecord) => {
    if (record.parentId === null) return record.id;

    const parent = recordsById.get(record.parentId);

    if (!parent) return null;
    if (parent.parentId === null) return parent.id;

    // 부모가 답글이면 그 부모(최상위 댓글)가 보일 때만 둡니다
    const grandparent = recordsById.get(parent.parentId);

    return grandparent && grandparent.parentId === null ? grandparent.id : null;
  };

  const threads = new Map<string, CommentView>();

  visibleRecords
    .filter((record) => record.parentId === null)
    .sort(byCreatedAt)
    .forEach((record) => threads.set(record.id, { ...toReplyView(record), replies: [] }));

  visibleRecords
    .filter((record) => record.parentId !== null)
    .sort(byCreatedAt)
    .forEach((record) => {
      const rootId = findRootId(record);
      const thread = rootId ? threads.get(rootId) : undefined;

      thread?.replies.push(toReplyView(record));
    });

  return [...threads.values()];
};

export default buildCommentThreads;
