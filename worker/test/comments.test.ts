import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";

import { COMMENT_COLUMNS } from "../src/constants/notion";
import {
  BLOG_ORIGIN,
  callWorker,
  createFakeRateLimiter,
  createNotionPage,
  createTestEnv,
  fakeServices,
  getComments,
  nextPostPath,
  postComment,
  validCommentBody,
  WORKER_ORIGIN,
} from "./helpers";

const TOP_ID = "11111111-1111-4111-8111-111111111111";
const REPLY_ID = "22222222-2222-4222-8222-222222222222";
const HIDDEN_ID = "33333333-3333-4333-8333-333333333333";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("댓글 목록 GET /comments", () => {
  it("최상위 댓글과 답글 한 단계를 묶고, 이스타의 답글에 글쓴이 표시를 담는다", async () => {
    const postPath = nextPostPath();
    const services = fakeServices({
      notionPages: [
        createNotionPage({ id: TOP_ID, postPath, content: "첫 댓글", createdAt: "2026-11-21T01:00:00.000Z" }),
        createNotionPage({
          id: REPLY_ID,
          postPath,
          content: "답글 고맙습니다",
          nickname: "",
          parentId: TOP_ID,
          isAuthorReply: true,
          createdAt: "2026-11-21T02:00:00.000Z",
        }),
      ],
    });

    const response = await callWorker(getComments(postPath));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(BLOG_ORIGIN);
    expect(body).toEqual({
      moderation: "immediate",
      comments: [
        {
          id: TOP_ID,
          nickname: "방문자",
          content: "첫 댓글",
          createdAt: "2026-11-21T01:00:00.000Z",
          isAuthor: false,
          replies: [
            {
              id: REPLY_ID,
              nickname: "이스타",
              content: "답글 고맙습니다",
              createdAt: "2026-11-21T02:00:00.000Z",
              isAuthor: true,
            },
          ],
        },
      ],
    });

    const query = JSON.parse(services.notionQueries()[0]?.body ?? "{}");

    expect(services.notionQueries()[0]?.headers.get("Notion-Version")).toBe("2026-03-11");
    expect(query.filter.and).toEqual([
      { property: COMMENT_COLUMNS.postPath, rich_text: { equals: postPath } },
      { property: COMMENT_COLUMNS.isHidden, checkbox: { equals: false } },
    ]);
  });

  it("「숨김」이 체크된 줄과 그 답글은 노션이 돌려줘도 빼고 보인다", async () => {
    const postPath = nextPostPath();

    fakeServices({
      notionPages: [
        createNotionPage({ id: TOP_ID, postPath, content: "보이는 댓글" }),
        createNotionPage({ id: HIDDEN_ID, postPath, content: "숨긴 댓글", isHidden: true }),
        createNotionPage({ id: REPLY_ID, postPath, content: "숨긴 댓글의 답글", parentId: HIDDEN_ID }),
      ],
    });

    const body = (await (await callWorker(getComments(postPath))).json()) as { comments: { id: string }[] };

    expect(body.comments.map((comment) => comment.id)).toEqual([TOP_ID]);
  });

  it("「승인 뒤 보임」 방식이면 승인된 댓글과 이스타의 답글만 보이고, 노션 질의에도 승인 조건을 넣는다", async () => {
    const postPath = nextPostPath();
    const services = fakeServices({
      notionPages: [
        createNotionPage({ id: TOP_ID, postPath, content: "승인된 댓글", isApproved: true }),
        createNotionPage({ id: HIDDEN_ID, postPath, content: "승인 전 댓글" }),
        createNotionPage({ id: REPLY_ID, postPath, content: "이스타 답글", parentId: TOP_ID, isAuthorReply: true }),
      ],
    });

    const response = await callWorker(getComments(postPath), createTestEnv({ COMMENT_MODERATION: "approval" }));
    const body = (await response.json()) as { moderation: string; comments: { id: string; replies: { id: string }[] }[] };

    expect(body.moderation).toBe("approval");
    expect(body.comments.map((comment) => comment.id)).toEqual([TOP_ID]);
    expect(body.comments[0]?.replies.map((reply) => reply.id)).toEqual([REPLY_ID]);

    const query = JSON.parse(services.notionQueries()[0]?.body ?? "{}");

    expect(query.filter.and[2]).toEqual({
      or: [
        { property: COMMENT_COLUMNS.isApproved, checkbox: { equals: true } },
        { property: COMMENT_COLUMNS.isAuthorReply, checkbox: { equals: true } },
      ],
    });
  });

  it("글 주소 꼴이 아니면 노션을 부르지 않고 400을 준다", async () => {
    const services = fakeServices();
    const response = await callWorker(getComments("/about/"));

    expect(response.status).toBe(400);
    expect(services.requests).toHaveLength(0);
  });

  it("노션 토큰이나 표 id가 없으면 503을 준다", async () => {
    fakeServices();
    const response = await callWorker(getComments(nextPostPath()), createTestEnv({ NOTION_DATA_SOURCE_ID: "" }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "not_configured" });
  });
});

describe("댓글 쓰기 POST /comments", () => {
  it("정상 쓰기: Turnstile을 확인하고 노션에 쓴 뒤, 응답에는 id와 상태만 준다", async () => {
    const postPath = nextPostPath();
    const services = fakeServices();
    const logSpy = vi.spyOn(console, "log");
    const warnSpy = vi.spyOn(console, "warn");
    const body = validCommentBody(postPath);

    const response = await callWorker(postComment(body));
    const responseText = await response.text();

    expect(response.status).toBe(201);
    expect(JSON.parse(responseText)).toEqual({ id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", status: "published" });
    expect(responseText).not.toContain(body.content);
    expect(responseText).not.toContain(body.turnstileToken);

    const turnstile = JSON.parse(services.turnstileCalls()[0]?.body ?? "{}");

    expect(turnstile).toMatchObject({ secret: "test-turnstile-secret", response: body.turnstileToken });
    expect(turnstile.remoteip).toBeUndefined();

    const created = JSON.parse(services.notionCreates()[0]?.body ?? "{}");

    expect(created.parent).toEqual({ type: "data_source_id", data_source_id: "0f0e0d0c-0b0a-4908-8706-050403020100" });
    expect(created.properties).toEqual({
      [COMMENT_COLUMNS.content]: { title: [{ type: "text", text: { content: body.content } }] },
      [COMMENT_COLUMNS.nickname]: { rich_text: [{ type: "text", text: { content: body.nickname } }] },
      [COMMENT_COLUMNS.postPath]: { rich_text: [{ type: "text", text: { content: postPath } }] },
      [COMMENT_COLUMNS.parent]: { relation: [] },
      [COMMENT_COLUMNS.isAuthorReply]: { checkbox: false },
      [COMMENT_COLUMNS.isHidden]: { checkbox: false },
      [COMMENT_COLUMNS.isApproved]: { checkbox: false },
    });

    const logged = JSON.stringify([...logSpy.mock.calls, ...warnSpy.mock.calls]);

    expect(logged).not.toContain(body.content);
    expect(logged).not.toContain(body.turnstileToken);
  });

  it("「승인 뒤 보임」 방식이면 상태를 pending으로 알린다", async () => {
    fakeServices();
    const response = await callWorker(
      postComment(validCommentBody(nextPostPath())),
      createTestEnv({ COMMENT_MODERATION: "approval" }),
    );

    expect(await response.json()).toMatchObject({ status: "pending" });
  });

  it("숨은 입력 칸이 채워지면 스팸으로 보고, Turnstile도 노션도 부르지 않는다", async () => {
    const services = fakeServices();
    const response = await callWorker(postComment(validCommentBody(nextPostPath(), { homepage: "https://spam.example" })));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "spam_suspected" });
    expect(services.requests).toHaveLength(0);
  });

  it("같은 곳에서 빈도를 넘기면 429와 Retry-After를 주고 노션에 쓰지 않는다", async () => {
    const services = fakeServices();
    const testEnv = createTestEnv({ COMMENT_RATE_LIMITER: createFakeRateLimiter(1) });
    const postPath = nextPostPath();

    const first = await callWorker(postComment(validCommentBody(postPath)), testEnv);
    const second = await callWorker(postComment(validCommentBody(postPath)), testEnv);

    expect(first.status).toBe(201);
    expect(second.status).toBe(429);
    expect(second.headers.get("Retry-After")).toBe("60");
    expect(await second.json()).toEqual({ error: "too_many_requests" });
    expect(services.notionCreates()).toHaveLength(1);
  });

  it("빈도 제한 키에는 IP 원문이 아니라 해시를 넘긴다", async () => {
    fakeServices();
    const limiter = createFakeRateLimiter();
    const request = postComment(validCommentBody(nextPostPath()));

    request.headers.set("CF-Connecting-IP", "203.0.113.7");
    await callWorker(request, createTestEnv({ COMMENT_RATE_LIMITER: limiter }));

    const key = (limiter.limit.mock.calls[0] as unknown as [{ key: string }])[0].key;

    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain("203.0.113.7");
  });

  it("실제 빈도 제한 바인딩(1분에 3번)도 네 번째 쓰기를 막는다", async () => {
    fakeServices();
    const realEnv = createTestEnv({ COMMENT_RATE_LIMITER: env.COMMENT_RATE_LIMITER });
    const postPath = nextPostPath();
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const request = postComment(validCommentBody(postPath));

      request.headers.set("CF-Connecting-IP", "198.51.100.20");
      statuses.push((await callWorker(request, realEnv)).status);
    }

    expect(statuses).toEqual([201, 201, 201, 429]);
  });

  it("닉네임 · 내용이 글자 수를 넘으면 막는다(경계값은 받는다)", async () => {
    fakeServices();
    const postPath = nextPostPath();
    const send = (overrides: Record<string, unknown>) => callWorker(postComment(validCommentBody(postPath, overrides)));

    expect(await (await send({ nickname: "가".repeat(21) })).json()).toEqual({ error: "nickname_too_long" });
    expect(await (await send({ content: "가".repeat(1001) })).json()).toEqual({ error: "content_too_long" });
    expect((await send({ nickname: "가".repeat(20), content: "가".repeat(1000) })).status).toBe(201);
    expect(await (await send({ content: "   \n  " })).json()).toEqual({ error: "content_required" });
    expect(await (await send({ nickname: " " })).json()).toEqual({ error: "nickname_required" });
  });

  it.each(["이스타", "이 스 타", "ㅇㅣㅅㅡㅌㅏ", "글쓴이", "글 쓴 이", "진짜이스타", "EaStAr"])(
    "막힌 닉네임 「%s」은 400을 주고 노션에 쓰지 않는다",
    async (nickname) => {
      const services = fakeServices();
      const response = await callWorker(postComment(validCommentBody(nextPostPath(), { nickname })));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "nickname_blocked" });
      expect(services.notionCreates()).toHaveLength(0);
    },
  );

  it("Turnstile 확인에 실패하면 403을 주고 노션에 쓰지 않는다", async () => {
    const services = fakeServices({ isTurnstileSuccess: false });
    const response = await callWorker(postComment(validCommentBody(nextPostPath())));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "turnstile_failed" });
    expect(services.notionCreates()).toHaveLength(0);
  });

  it("Turnstile 결과의 hostname이 블로그가 아니면 막는다", async () => {
    fakeServices({ turnstileHostname: "evil.example" });
    const response = await callWorker(postComment(validCommentBody(nextPostPath())));

    expect(response.status).toBe(403);
  });

  it("노션에 쓰지 못하면 502를 주고, 로그에 내용을 남기지 않는다", async () => {
    fakeServices({ notionStatus: 500 });
    const warnSpy = vi.spyOn(console, "warn");
    const body = validCommentBody(nextPostPath());
    const response = await callWorker(postComment(body));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "storage_failed" });
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(body.content);
  });
});

describe("답글은 한 단계까지", () => {
  const threadPages = (postPath: string) => [
    createNotionPage({ id: TOP_ID, postPath, content: "최상위 댓글" }),
    createNotionPage({ id: REPLY_ID, postPath, content: "답글", parentId: TOP_ID }),
    createNotionPage({ id: HIDDEN_ID, postPath, content: "숨긴 최상위", isHidden: true }),
  ];

  it("같은 글의 최상위 댓글에 다는 답글은 부모 댓글 관계로 쓴다", async () => {
    const postPath = nextPostPath();
    const services = fakeServices({ notionPages: threadPages(postPath) });
    const response = await callWorker(
      postComment(validCommentBody(postPath, { parentId: TOP_ID.replaceAll("-", "").toUpperCase() })),
    );

    expect(response.status).toBe(201);

    const created = JSON.parse(services.notionCreates()[0]?.body ?? "{}");

    expect(created.properties[COMMENT_COLUMNS.parent]).toEqual({ relation: [{ id: TOP_ID }] });
  });

  it("답글에 다는 답글(두 단계)은 막는다", async () => {
    const postPath = nextPostPath();
    const services = fakeServices({ notionPages: threadPages(postPath) });
    const response = await callWorker(postComment(validCommentBody(postPath, { parentId: REPLY_ID })));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_parent" });
    expect(services.notionCreates()).toHaveLength(0);
  });

  it("숨긴 댓글이나 다른 글의 댓글을 부모로 고르면 막는다", async () => {
    const postPath = nextPostPath();

    fakeServices({ notionPages: threadPages(postPath) });

    const toHidden = await callWorker(postComment(validCommentBody(postPath, { parentId: HIDDEN_ID })));
    const toUnknown = await callWorker(
      postComment(validCommentBody(postPath, { parentId: "44444444-4444-4444-8444-444444444444" })),
    );
    const notAnId = await callWorker(postComment(validCommentBody(postPath, { parentId: "not-a-notion-id" })));

    expect(toHidden.status).toBe(400);
    expect(toUnknown.status).toBe(400);
    expect(await notAnId.json()).toEqual({ error: "invalid_parent" });
  });
});

describe("CORS", () => {
  const preflight = (origin: string) =>
    new Request(`${WORKER_ORIGIN}/comments`, {
      method: "OPTIONS",
      headers: { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
    });

  it.each([BLOG_ORIGIN, "http://localhost:4321", "http://127.0.0.1:4324"])("%s의 사전 요청은 허용한다", async (origin) => {
    const response = await callWorker(preflight(origin));

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
  });

  it.each(["https://evil.example", "https://eastar-ds.github.io.evil.example", "http://localhost.evil.example"])(
    "%s에는 허용 머리를 주지 않는다",
    async (origin) => {
      fakeServices();
      const response = await callWorker(preflight(origin));
      const list = await callWorker(getComments(nextPostPath(), origin));

      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
      expect(list.headers.get("Access-Control-Allow-Origin")).toBeNull();
    },
  );

  it("허용하지 않은 출처나 출처 없는 쓰기는 403으로 막는다", async () => {
    const services = fakeServices();
    const fromEvil = await callWorker(postComment(validCommentBody(nextPostPath()), "https://evil.example"));
    const withoutOrigin = await callWorker(postComment(validCommentBody(nextPostPath()), null));

    expect(fromEvil.status).toBe(403);
    expect(await fromEvil.json()).toEqual({ error: "forbidden_origin" });
    expect(withoutOrigin.status).toBe(403);
    expect(services.requests).toHaveLength(0);
  });
});

describe("댓글 목록 저장과 비우기", () => {
  it("같은 글의 목록은 저장해 두고 노션을 다시 부르지 않다가, 댓글을 쓰면 비우고 다시 읽는다", async () => {
    const postPath = nextPostPath();
    const services = fakeServices({ notionPages: [createNotionPage({ id: TOP_ID, postPath, content: "첫 댓글" })] });

    await callWorker(getComments(postPath));
    await callWorker(getComments(postPath));
    expect(services.notionQueries()).toHaveLength(1);

    await callWorker(postComment(validCommentBody(postPath)));
    await callWorker(getComments(postPath));
    expect(services.notionQueries()).toHaveLength(2);
  });

  it("저장분은 글마다 따로다", async () => {
    const services = fakeServices();

    await callWorker(getComments(nextPostPath()));
    await callWorker(getComments(nextPostPath()));

    expect(services.notionQueries()).toHaveLength(2);
  });
});

describe("그 밖의 경로", () => {
  it("모르는 경로는 404를 준다", async () => {
    const response = await callWorker(new Request(`${WORKER_ORIGIN}/admin`));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
  });
});
