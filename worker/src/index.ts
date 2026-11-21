import { Hono } from "hono";

import { RELAY_PATH_PREFIX } from "./constants/relay";
import comments from "./routes/comments";
import relay from "./routes/relay";
import type { Env } from "./types/env";

/**
 * 블로그(https://eastar-ds.github.io)의 Cloudflare Worker입니다.
 * - /comments : 노션 DB 익명 댓글 (routes/comments)
 * - /bridge/* : PostHog 중계 (routes/relay)
 */
const app = new Hono<{ Bindings: Env }>();

app.route("/comments", comments);
app.all(`${RELAY_PATH_PREFIX}/*`, relay);

app.notFound((c) => c.json({ error: "not_found" }, 404));

app.onError((error, c) => {
  // 오류 메시지에 요청 내용이 섞일 수 있어 이름만 남깁니다
  console.error("처리하지 못한 오류", { name: error.name });

  return c.json({ error: "internal_error" }, 500);
});

export default app;
