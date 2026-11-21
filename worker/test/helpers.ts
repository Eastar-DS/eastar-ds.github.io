import { createExecutionContext, env, waitOnExecutionContext } from "cloudflare:test";
import { vi } from "vitest";

import { COMMENT_COLUMNS } from "../src/constants/notion";
import app from "../src/index";
import type { Env } from "../src/types/env";

export const BLOG_ORIGIN = "https://eastar-ds.github.io";
export const WORKER_ORIGIN = "https://eastar-blog.example.workers.dev";

/** 시험마다 다른 글 주소를 써서 Worker 메모리의 댓글 저장분이 섞이지 않게 합니다 */
let postSequence = 0;
export const nextPostPath = () => {
  postSequence += 1;
  return `/posts/test-post-${postSequence}/`;
};

interface CommentPageParams {
  id: string;
  postPath: string;
  content: string;
  nickname?: string;
  parentId?: string | null;
  isAuthorReply?: boolean;
  isHidden?: boolean;
  isApproved?: boolean;
  createdAt?: string;
}

/** 노션 API가 돌려주는 페이지(표의 한 줄) 모양을 만듭니다 */
export const createNotionPage = ({
  id,
  postPath,
  content,
  nickname = "방문자",
  parentId = null,
  isAuthorReply = false,
  isHidden = false,
  isApproved = false,
  createdAt = "2026-11-21T01:00:00.000Z",
}: CommentPageParams) => ({
  object: "page",
  id,
  created_time: createdAt,
  in_trash: false,
  properties: {
    [COMMENT_COLUMNS.content]: { type: "title", title: [{ plain_text: content }] },
    [COMMENT_COLUMNS.nickname]: { type: "rich_text", rich_text: nickname ? [{ plain_text: nickname }] : [] },
    [COMMENT_COLUMNS.postPath]: { type: "rich_text", rich_text: [{ plain_text: postPath }] },
    [COMMENT_COLUMNS.parent]: { type: "relation", relation: parentId ? [{ id: parentId }] : [] },
    [COMMENT_COLUMNS.isAuthorReply]: { type: "checkbox", checkbox: isAuthorReply },
    [COMMENT_COLUMNS.isHidden]: { type: "checkbox", checkbox: isHidden },
    [COMMENT_COLUMNS.isApproved]: { type: "checkbox", checkbox: isApproved },
    [COMMENT_COLUMNS.createdAt]: { type: "created_time", created_time: createdAt },
  },
});

export interface RecordedRequest {
  url: string;
  method: string;
  headers: Headers;
  body: string;
}

interface FakeServicesParams {
  /** 노션 질의가 돌려줄 줄 */
  notionPages?: ReturnType<typeof createNotionPage>[];
  isTurnstileSuccess?: boolean;
  turnstileHostname?: string;
  notionStatus?: number;
}

/**
 * 바깥 호출(노션 · Turnstile · PostHog)을 가짜로 바꾸고, 부른 요청을 모아 둡니다.
 * 시험 끝에 vi.restoreAllMocks()로 되돌립니다.
 */
export const fakeServices = ({
  notionPages = [],
  isTurnstileSuccess = true,
  turnstileHostname = "eastar-ds.github.io",
  notionStatus = 200,
}: FakeServicesParams = {}) => {
  const requests: RecordedRequest[] = [];

  const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const request = new Request(input, init);
    const body = request.method === "GET" || request.method === "HEAD" ? "" : await request.text();

    requests.push({ url: request.url, method: request.method, headers: request.headers, body });

    const url = new URL(request.url);

    if (url.hostname === "challenges.cloudflare.com") {
      return Response.json(
        isTurnstileSuccess
          ? { success: true, hostname: turnstileHostname }
          : { success: false, "error-codes": ["invalid-input-response"] },
      );
    }
    if (url.hostname === "api.notion.com") {
      if (notionStatus !== 200) return Response.json({ code: "internal_server_error" }, { status: notionStatus });
      if (url.pathname.endsWith("/query")) {
        return Response.json({ object: "list", results: notionPages, has_more: false, next_cursor: null });
      }
      if (url.pathname === "/v1/pages") {
        return Response.json({ object: "page", id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" });
      }
    }
    if (url.hostname.endsWith("posthog.com")) {
      return new Response(`posthog:${url.pathname}`, {
        headers: { "Content-Type": "application/javascript", "Cache-Control": "public, max-age=3600" },
      });
    }

    return new Response("not mocked", { status: 599 });
  });

  return {
    fetchSpy,
    requests,
    notionQueries: () => requests.filter((request) => request.url.endsWith("/query")),
    notionCreates: () => requests.filter((request) => request.url.endsWith("/v1/pages")),
    turnstileCalls: () => requests.filter((request) => request.url.includes("challenges.cloudflare.com")),
  };
};

/** 빈도 제한을 가짜로 바꿉니다. 정한 횟수까지만 통과시킵니다 */
export const createFakeRateLimiter = (allowedCount = Number.POSITIVE_INFINITY) => {
  let count = 0;

  return {
    limit: vi.fn(async () => {
      count += 1;
      return { success: count <= allowedCount };
    }),
  } satisfies RateLimit;
};

/** 시험용 env. 빈도 제한은 기본으로 늘 통과하는 가짜를 씁니다 */
export const createTestEnv = (overrides: Partial<Env> = {}): Env => ({
  ...env,
  COMMENT_RATE_LIMITER: createFakeRateLimiter(),
  ...overrides,
});

/** Worker를 한 번 부르고, waitUntil로 미룬 일(저장해 두기)까지 끝날 때를 기다립니다 */
export const callWorker = async (request: Request, testEnv: Env = createTestEnv()) => {
  const context = createExecutionContext();
  const response = await app.fetch(request, testEnv, context);

  await waitOnExecutionContext(context);

  return response;
};

export const getComments = (postPath: string, origin = BLOG_ORIGIN) =>
  new Request(`${WORKER_ORIGIN}/comments?postPath=${encodeURIComponent(postPath)}`, { headers: { Origin: origin } });

export const postComment = (body: Record<string, unknown>, origin: string | null = BLOG_ORIGIN) =>
  new Request(`${WORKER_ORIGIN}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) },
    body: JSON.stringify(body),
  });

export const validCommentBody = (postPath: string, overrides: Record<string, unknown> = {}) => ({
  postPath,
  nickname: "지나가던 개발자",
  content: "레이아웃 단계 설명이 잘 와닿았습니다.\n고맙습니다.",
  turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
  homepage: "",
  ...overrides,
});
