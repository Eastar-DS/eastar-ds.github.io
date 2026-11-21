import { COMMENT_QUERY_MAX_PAGES } from "../constants/comments";
import { NOTION_API_BASE, NOTION_VERSION } from "../constants/notion";
import type { ModerationMode, NewComment } from "../types/comment";
import type { Env } from "../types/env";
import { toCommentQueryFilter, toCommentRecord, toCreateProperties, type NotionPage } from "./commentProperties";

type NotionResult<T> = { isOk: true; data: T } | { isOk: false; status: number };

interface NotionRequestParams {
  env: Env;
  method: "GET" | "POST" | "PATCH";
  path: string;
  body?: unknown;
}

// 429(빈도 초과)면 한 번만 다시 보냅니다. 기다리는 시간은 Retry-After를 따르되 길어도 2초에서 끊습니다
const MAX_RETRY_WAIT_MS = 2000;

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * 노션 API를 부릅니다. 실패해도 예외를 던지지 않고 상태 코드만 돌려줍니다.
 * 로그에는 상태 코드와 노션 오류 코드만 남기고, 요청 · 응답 본문(댓글 내용)과 토큰은 남기지 않습니다.
 */
const notionRequest = async <T>({ env, method, path, body }: NotionRequestParams): Promise<NotionResult<T>> => {
  const url = `${env.NOTION_API_BASE || NOTION_API_BASE}/v1${path}`;
  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, init);

    if (response.ok) return { isOk: true, data: (await response.json()) as T };
    if (response.status === 429 && attempt === 0) {
      const retryAfterSeconds = Number(response.headers.get("Retry-After") ?? "1");

      await wait(Math.min(Math.max(retryAfterSeconds, 0) * 1000, MAX_RETRY_WAIT_MS));
      continue;
    }

    const errorBody = (await response.json().catch(() => ({}))) as { code?: string };

    console.warn("노션 요청 실패", { method, status: response.status, code: errorBody.code ?? "unknown" });

    return { isOk: false, status: response.status };
  }

  return { isOk: false, status: 429 };
};

interface QueryResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

/** 한 글의 보일 댓글을 노션에서 읽습니다(쓴 시각 순서, 100개씩 최대 5번) */
export const queryComments = async ({
  env,
  postPath,
  moderation,
}: {
  env: Env;
  postPath: string;
  moderation: ModerationMode;
}) => {
  const pages: NotionPage[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < COMMENT_QUERY_MAX_PAGES; page += 1) {
    const result: NotionResult<QueryResponse> = await notionRequest<QueryResponse>({
      env,
      method: "POST",
      path: `/data_sources/${env.NOTION_DATA_SOURCE_ID}/query`,
      body: {
        filter: toCommentQueryFilter({ postPath, moderation }),
        sorts: [{ timestamp: "created_time", direction: "ascending" }],
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      },
    });

    if (!result.isOk) return result;

    pages.push(...result.data.results);
    if (!result.data.has_more || !result.data.next_cursor) break;
    cursor = result.data.next_cursor;
  }

  return { isOk: true as const, data: pages.map(toCommentRecord) };
};

/** 새 댓글을 노션 표의 한 줄로 씁니다. 돌려주는 것은 새 줄의 id뿐입니다 */
export const createComment = async ({ env, comment }: { env: Env; comment: Omit<NewComment, "turnstileToken"> }) => {
  const result = await notionRequest<NotionPage>({
    env,
    method: "POST",
    path: "/pages",
    body: {
      parent: { type: "data_source_id", data_source_id: env.NOTION_DATA_SOURCE_ID },
      properties: toCreateProperties(comment),
    },
  });

  return result.isOk ? { isOk: true as const, data: { id: result.data.id } } : result;
};
