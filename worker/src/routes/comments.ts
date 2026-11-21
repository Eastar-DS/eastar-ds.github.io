import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import buildCommentThreads from "../comments/buildCommentThreads";
import { purgeCommentCache, readCommentCache, toCommentCacheKey, writeCommentCache } from "../comments/commentCache";
import validateCommentInput from "../comments/validateCommentInput";
import { COMMENT_BODY_MAX_BYTES, POST_PATH_PATTERN } from "../constants/comments";
import { createComment, queryComments } from "../notion/notionClient";
import verifyTurnstile from "../turnstile/verifyTurnstile";
import type { CommentErrorCode, CommentListResponse } from "../types/comment";
import type { Env } from "../types/env";
import isAllowedOrigin from "../utils/isAllowedOrigin";
import readConfig from "../utils/readConfig";
import toRateLimitKey from "../utils/toRateLimitKey";

type AppContext = Context<{ Bindings: Env }>;

const jsonError = (c: AppContext, error: CommentErrorCode, status: ContentfulStatusCode, headers?: Record<string, string>) =>
  c.json({ error }, status, headers);

/** 노션 페이지 id를 비교할 때 하이픈과 대소문자를 무시합니다 */
const toComparableId = (id: string) => id.replaceAll("-", "").toLowerCase();

/** 글 하나의 보일 댓글 목록. 저장해 둔 것이 있으면 노션을 부르지 않습니다 */
const loadCommentList = async ({ c, postPath }: { c: AppContext; postPath: string }) => {
  const config = readConfig(c.env);
  const cacheKey = toCommentCacheKey({ requestUrl: c.req.url, postPath, moderation: config.moderation });
  const cached = await readCommentCache({ cacheKey, ttlSeconds: config.cacheTtlSeconds });

  if (cached) return { isOk: true as const, data: cached };

  const result = await queryComments({ env: c.env, postPath, moderation: config.moderation });

  if (!result.isOk) return result;

  const body: CommentListResponse = {
    comments: buildCommentThreads({ records: result.data, moderation: config.moderation }),
    moderation: config.moderation,
  };

  c.executionCtx.waitUntil(writeCommentCache({ cacheKey, body, ttlSeconds: config.cacheTtlSeconds }));

  return { isOk: true as const, data: body };
};

/**
 * 노션 댓글 경로.
 * - GET /comments?postPath=/posts/{slug}/ : 글 하나의 보일 댓글(최상위 + 답글 한 단계)
 * - POST /comments : 댓글 쓰기. 본문은 { postPath, nickname, content, parentId?, turnstileToken, homepage(숨은 칸) }
 */
const comments = new Hono<{ Bindings: Env }>();

comments.use(
  "*",
  cors({
    origin: (origin) => (isAllowedOrigin(origin) ? origin : null),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 86400,
  }),
);

comments.get("/", async (c) => {
  const postPath = c.req.query("postPath") ?? "";

  if (!POST_PATH_PATTERN.test(postPath)) return jsonError(c, "invalid_request", 400);
  if (!readConfig(c.env).isCommentsConfigured) return jsonError(c, "not_configured", 503);

  const result = await loadCommentList({ c, postPath });

  if (!result.isOk) return jsonError(c, "storage_failed", 502);

  return c.json(result.data, 200, { "Cache-Control": "no-store" });
});

comments.post(
  "/",
  bodyLimit({ maxSize: COMMENT_BODY_MAX_BYTES, onError: (c) => c.json({ error: "invalid_request" }, 413) }),
  async (c) => {
    if (!isAllowedOrigin(c.req.header("Origin"))) return jsonError(c, "forbidden_origin", 403);

    const config = readConfig(c.env);

    if (!config.isCommentsConfigured) return jsonError(c, "not_configured", 503);

    const validation = validateCommentInput(await c.req.json().catch(() => null));

    if (!validation.isValid) return jsonError(c, validation.error, 400);

    const { turnstileToken, ...comment } = validation.comment;
    const rateLimitKey = await toRateLimitKey(c.req.header("CF-Connecting-IP") ?? "unknown");
    const isWithinLimit = await c.env.COMMENT_RATE_LIMITER.limit({ key: rateLimitKey })
      .then((outcome) => outcome.success)
      .catch(() => {
        // 빈도 제한 기능이 잠깐 실패하면 막지 않고 받습니다. Turnstile이 남아 있습니다
        console.warn("빈도 제한 확인 실패");
        return true;
      });

    if (!isWithinLimit) return jsonError(c, "too_many_requests", 429, { "Retry-After": "60" });

    const isHuman = await verifyTurnstile({
      token: turnstileToken,
      secretKey: c.env.TURNSTILE_SECRET_KEY,
      expectedHostnames: config.turnstileExpectedHostnames,
    });

    if (!isHuman) return jsonError(c, "turnstile_failed", 403);

    if (comment.parentId) {
      // 답글은 한 단계까지: 부모는 같은 글의 보이는 최상위 댓글이어야 합니다
      const list = await loadCommentList({ c, postPath: comment.postPath });

      if (!list.isOk) return jsonError(c, "storage_failed", 502);

      const parentId = toComparableId(comment.parentId);
      const parent = list.data.comments.find((thread) => toComparableId(thread.id) === parentId);

      if (!parent) return jsonError(c, "invalid_parent", 400);
      comment.parentId = parent.id;
    }

    const created = await createComment({ env: c.env, comment });

    if (!created.isOk) return jsonError(c, "storage_failed", 502);

    await purgeCommentCache(
      toCommentCacheKey({ requestUrl: c.req.url, postPath: comment.postPath, moderation: config.moderation }),
    );

    return c.json({ id: created.data.id, status: config.moderation === "approval" ? "pending" : "published" }, 201);
  },
);

export default comments;
