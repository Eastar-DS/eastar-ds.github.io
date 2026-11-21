/**
 * 노션 API와 댓글 표의 칸 이름입니다. Worker와 표 만들기 스크립트(scripts/createNotionCommentsTable.ts)가 함께 씁니다.
 * 칸 이름과 종류는 세컨드 브레인의 새 댓글 알림도 그대로 읽으므로, 바꾸면 docs/worker.md 「노션 댓글 표」도 함께 고칩니다.
 */

/** 2026-11-21 기준 최신 판. 데이터 소스(data source) 방식이고, archived 대신 in_trash를 씁니다 */
export const NOTION_VERSION = "2026-03-11";

export const NOTION_API_BASE = "https://api.notion.com";

/** 노션 글자 칸 하나(text.content)의 최대 길이 */
export const NOTION_TEXT_CHUNK_LENGTH = 2000;

/** 댓글 표의 칸 이름. 노션 표에서 칸 이름을 바꾸면 Worker가 칸을 못 찾으니 바꾸지 않습니다 */
export const COMMENT_COLUMNS = {
  /** 제목(title). 댓글 본문 */
  content: "내용",
  /** 글(rich_text) */
  nickname: "닉네임",
  /** 글(rich_text). /posts/{slug}/ 꼴의 글 주소 */
  postPath: "글 주소",
  /** 같은 표를 가리키는 관계(relation). 답글이면 최상위 댓글 하나 */
  parent: "부모 댓글",
  /** 체크박스. 이스타가 노션에서 직접 쓴 답글 */
  isAuthorReply: "글쓴이 답글",
  /** 체크박스. 체크하면 블로그에서 내려감 */
  isHidden: "숨김",
  /** 체크박스. 「승인 뒤 보임」 방식에서만 씀 */
  isApproved: "승인",
  /** 만든 시각(created_time). 노션이 채움 */
  createdAt: "작성 시각",
} as const;
