/**
 * 로컬 개발용 가짜 노션 서버입니다. `wrangler dev`가 진짜 노션 대신 이 서버를 부르게 해서,
 * 노션 계정 없이 블로그 댓글 화면(목록 · 쓰기 · 답글 · 「글쓴이」 표시)을 확인합니다.
 *
 * 쓰는 법 (worker 폴더에서, 터미널 두 개)
 *   pnpm dev:fake-notion     # http://127.0.0.1:8790
 *   pnpm dev                 # .dev.vars의 NOTION_API_BASE가 이 서버를 가리켜야 합니다(.dev.vars.example 참고)
 *
 * 메모리에만 두므로 끄면 사라집니다. 지원하는 것: 데이터 소스 질의(글 주소 · 체크박스 조건, and · or), 페이지 만들기, 페이지 칸 고치기(PATCH),
 * 표 만들기 스크립트 확인용 표 만들기(POST /v1/databases) · 칸 더하기(PATCH /v1/data_sources/:id).
 * 이스타 답글과 숨긴 댓글이 든 시험 글 댓글을 미리 넣어 둡니다.
 */
import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { COMMENT_COLUMNS } from "../src/constants/notion.ts";

const PORT = Number(process.env.FAKE_NOTION_PORT ?? 8790);
const SEED_POST_PATH = "/posts/browser-layout-and-paint/";

interface FakeValue {
  title?: { plain_text: string }[];
  rich_text?: { plain_text: string }[];
  relation?: { id: string }[];
  checkbox?: boolean;
  created_time?: string;
}

interface FakePage {
  object: "page";
  id: string;
  created_time: string;
  in_trash: boolean;
  properties: Record<string, FakeValue>;
}

const pages: FakePage[] = [];

const createPage = (properties: Record<string, FakeValue>, createdTime = new Date().toISOString()): FakePage => {
  const page: FakePage = {
    object: "page",
    id: randomUUID(),
    created_time: createdTime,
    in_trash: false,
    properties: { ...properties, [COMMENT_COLUMNS.createdAt]: { created_time: createdTime } },
  };

  pages.push(page);
  return page;
};

const text = (value: string) => [{ plain_text: value }];

const seed = () => {
  const first = createPage(
    {
      [COMMENT_COLUMNS.content]: { title: text("레이아웃과 페인트 차이가 데모로 보니 바로 이해됐어요.\n다음 글도 기다릴게요!") },
      [COMMENT_COLUMNS.nickname]: { rich_text: text("프론트엔드 초보") },
      [COMMENT_COLUMNS.postPath]: { rich_text: text(SEED_POST_PATH) },
      [COMMENT_COLUMNS.parent]: { relation: [] },
    },
    "2026-11-20T09:12:00.000Z",
  );

  createPage(
    {
      [COMMENT_COLUMNS.content]: { title: text("읽어 주셔서 고맙습니다. 다음 글은 합성 단계를 다룹니다.") },
      [COMMENT_COLUMNS.nickname]: { rich_text: [] },
      [COMMENT_COLUMNS.postPath]: { rich_text: text(SEED_POST_PATH) },
      [COMMENT_COLUMNS.parent]: { relation: [{ id: first.id }] },
      [COMMENT_COLUMNS.isAuthorReply]: { checkbox: true },
    },
    "2026-11-20T11:40:00.000Z",
  );

  createPage(
    {
      [COMMENT_COLUMNS.content]: { title: text("transform 말고 will-change도 같이 다뤄 주시면 좋겠어요. https://developer.mozilla.org/ko/docs/Web/CSS/will-change 참고") },
      [COMMENT_COLUMNS.nickname]: { rich_text: text("CSS 좋아") },
      [COMMENT_COLUMNS.postPath]: { rich_text: text(SEED_POST_PATH) },
      [COMMENT_COLUMNS.parent]: { relation: [] },
    },
    "2026-11-21T01:05:00.000Z",
  );

  createPage(
    {
      [COMMENT_COLUMNS.content]: { title: text("숨긴 광고 댓글") },
      [COMMENT_COLUMNS.nickname]: { rich_text: text("광고") },
      [COMMENT_COLUMNS.postPath]: { rich_text: text(SEED_POST_PATH) },
      [COMMENT_COLUMNS.parent]: { relation: [] },
      [COMMENT_COLUMNS.isHidden]: { checkbox: true },
    },
    "2026-11-21T02:00:00.000Z",
  );
};

type Filter = {
  and?: Filter[];
  or?: Filter[];
  property?: string;
  rich_text?: { equals: string };
  checkbox?: { equals: boolean };
};

const readText = (value: FakeValue | undefined) =>
  (value?.title ?? value?.rich_text ?? []).map((part) => part.plain_text).join("");

const matches = (page: FakePage, filter: Filter | undefined): boolean => {
  if (!filter) return true;
  if (filter.and) return filter.and.every((child) => matches(page, child));
  if (filter.or) return filter.or.some((child) => matches(page, child));

  const value = page.properties[filter.property ?? ""];

  if (filter.rich_text) return readText(value) === filter.rich_text.equals;
  if (filter.checkbox) return (value?.checkbox ?? false) === filter.checkbox.equals;

  return true;
};

// 요청 본문의 text.content를 응답 꼴의 plain_text로 바꿉니다
const toStoredValue = (value: Record<string, unknown>): FakeValue => {
  const toPlain = (parts: unknown) =>
    (parts as { text?: { content?: string } }[]).map((part) => ({ plain_text: part.text?.content ?? "" }));

  if (Array.isArray(value.title)) return { title: toPlain(value.title) };
  if (Array.isArray(value.rich_text)) return { rich_text: toPlain(value.rich_text) };
  if (Array.isArray(value.relation)) return { relation: value.relation as { id: string }[] };
  if (typeof value.checkbox === "boolean") return { checkbox: value.checkbox };

  return {};
};

const readBody = async (request: IncomingMessage) => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) chunks.push(chunk as Buffer);

  const raw = Buffer.concat(chunks).toString("utf8");

  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
};

const send = (response: ServerResponse, status: number, body: unknown) => {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${PORT}`);

  // 요청 경로만 남기고 본문(댓글 내용)은 남기지 않습니다
  console.log(`${request.method} ${url.pathname}`);

  try {
    if (request.method === "POST" && /^\/v1\/data_sources\/[^/]+\/query$/.test(url.pathname)) {
      const body = await readBody(request);
      const results = pages
        .filter((page) => !page.in_trash && matches(page, body.filter as Filter | undefined))
        .sort((a, b) => a.created_time.localeCompare(b.created_time));

      send(response, 200, { object: "list", results, has_more: false, next_cursor: null });
      return;
    }
    if (request.method === "POST" && url.pathname === "/v1/pages") {
      const body = await readBody(request);
      const properties = Object.fromEntries(
        Object.entries((body.properties ?? {}) as Record<string, Record<string, unknown>>).map(([name, value]) => [
          name,
          toStoredValue(value),
        ]),
      );

      send(response, 200, createPage(properties));
      return;
    }

    if (request.method === "POST" && url.pathname === "/v1/databases") {
      const body = await readBody(request);
      const initial = (body.initial_data_source ?? {}) as { properties?: Record<string, unknown> };

      console.log("표 만들기 칸:", Object.entries(initial.properties ?? {}).map(([name, value]) => `${name}(${Object.keys(value as object)[0]})`).join(", "));
      send(response, 200, { object: "database", id: randomUUID(), url: "https://www.notion.so/fake", data_sources: [{ id: randomUUID(), name: "" }] });
      return;
    }
    if (request.method === "PATCH" && /^\/v1\/data_sources\/[^/]+$/.test(url.pathname)) {
      const body = await readBody(request);

      console.log("칸 더하기:", JSON.stringify(body.properties));
      send(response, 200, { object: "data_source", id: url.pathname.split("/").pop() });
      return;
    }

    const pageMatch = url.pathname.match(/^\/v1\/pages\/([^/]+)$/);
    const page = pages.find((candidate) => candidate.id === pageMatch?.[1]);

    if (request.method === "PATCH" && page) {
      const body = await readBody(request);

      Object.entries((body.properties ?? {}) as Record<string, Record<string, unknown>>).forEach(([name, value]) => {
        page.properties[name] = toStoredValue(value);
      });
      send(response, 200, page);
      return;
    }
    if (request.method === "GET" && page) {
      send(response, 200, page);
      return;
    }

    send(response, 404, { object: "error", code: "object_not_found" });
  } catch {
    send(response, 400, { object: "error", code: "validation_error" });
  }
});

seed();
server.listen(PORT, "127.0.0.1", () => {
  console.log(`가짜 노션 서버: http://127.0.0.1:${PORT} (시험 글 ${SEED_POST_PATH}에 댓글 ${pages.length}개를 넣어 둠)`);
});
