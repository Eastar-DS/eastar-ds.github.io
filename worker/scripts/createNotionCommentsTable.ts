/**
 * 노션에 블로그 댓글 표를 만듭니다. 이스타가 처음 한 번만 돌립니다(docs/deploy-phase2.md 5단계).
 *
 * 쓰는 법 (worker 폴더에서)
 *   pnpm notion:create-table
 * 노션 토큰을 묻는 줄이 나오면 붙여 넣고 Enter를 누릅니다. 입력한 글자는 화면에 보이지 않고, 파일 · 명령 기록에도 남지 않습니다.
 * (환경 변수 NOTION_TOKEN이 있으면 묻지 않고 그 값을 씁니다)
 *
 * 하는 일
 * 1. 부모 페이지 아래에 「블로그 댓글」 표(데이터베이스)를 만듭니다. 칸은 src/constants/notion.ts의 COMMENT_COLUMNS입니다.
 * 2. 「부모 댓글」 칸(같은 표를 가리키는 관계)을 더합니다. 표의 데이터 소스 id가 만든 뒤에야 생겨서 두 번째 요청으로 더합니다.
 * 3. Worker 설정(wrangler.jsonc의 NOTION_DATA_SOURCE_ID)에 넣을 데이터 소스 id를 알려 줍니다.
 *
 * 다시 돌리면 표가 하나 더 생깁니다. 잘못 만들었으면 노션에서 지우고 다시 돌립니다.
 */
import { COMMENT_COLUMNS, NOTION_API_BASE, NOTION_VERSION } from "../src/constants/notion.ts";

/** 댓글 표를 둘 노션 페이지. 세컨드 브레인이 읽는 knot 페이지 밖입니다 (docs/plan.md 「댓글」) */
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID || "41f0627daae580229183f2ea9025bde8";
const TABLE_TITLE = "블로그 댓글";
const API_BASE = process.env.NOTION_API_BASE || NOTION_API_BASE;

/** 입력을 화면에 보이지 않게 받습니다(붙여 넣기 가능). Ctrl+C로 그만둡니다 */
const readHidden = (prompt: string) =>
  new Promise<string>((resolve, reject) => {
    const { stdin, stdout } = process;

    if (!stdin.isTTY) {
      reject(new Error("터미널에서 직접 돌려 주세요. 토큰을 묻는 줄이 나와야 합니다."));
      return;
    }

    let value = "";
    const cleanUp = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", handleData);
      stdout.write("\n");
    };
    const handleData = (chunk: string) => {
      for (const character of chunk) {
        if (character === "\r" || character === "\n") {
          cleanUp();
          resolve(value.trim());
          return;
        }
        if (character === "\u0003") {
          cleanUp();
          reject(new Error("그만두었습니다."));
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += character;
      }
    };

    stdout.write(prompt);
    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", handleData);
  });

interface NotionErrorBody {
  code?: string;
  message?: string;
}

const notion = async <T>({ token, method, path, body }: { token: string; method: string; path: string; body?: unknown }) => {
  const response = await fetch(`${API_BASE}/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & NotionErrorBody;

  if (!response.ok) {
    throw new Error(`노션 요청 실패 (${method} ${path}): ${response.status} ${data.code ?? ""} ${data.message ?? ""}`.trim());
  }

  return data;
};

interface DatabaseResponse {
  id: string;
  url?: string;
  data_sources?: { id: string; name?: string }[];
}

const main = async () => {
  const token = process.env.NOTION_TOKEN || (await readHidden("노션 토큰을 붙여 넣고 Enter (화면에 보이지 않습니다): "));

  if (!token) throw new Error("토큰이 비어 있습니다.");

  console.log(`1/3 「${TABLE_TITLE}」 표를 만듭니다 (노션 API ${NOTION_VERSION})`);

  const database = await notion<DatabaseResponse>({
    token,
    method: "POST",
    path: "/databases",
    body: {
      parent: { type: "page_id", page_id: PARENT_PAGE_ID },
      title: [{ type: "text", text: { content: TABLE_TITLE } }],
      icon: { type: "emoji", emoji: "💬" },
      is_inline: false,
      initial_data_source: {
        properties: {
          [COMMENT_COLUMNS.content]: { title: {} },
          [COMMENT_COLUMNS.nickname]: { rich_text: {} },
          [COMMENT_COLUMNS.postPath]: { rich_text: {} },
          [COMMENT_COLUMNS.isAuthorReply]: { checkbox: {} },
          [COMMENT_COLUMNS.isHidden]: { checkbox: {} },
          [COMMENT_COLUMNS.isApproved]: { checkbox: {} },
          [COMMENT_COLUMNS.createdAt]: { created_time: {} },
        },
      },
    },
  });

  const dataSourceId =
    database.data_sources?.[0]?.id ??
    (await notion<DatabaseResponse>({ token, method: "GET", path: `/databases/${database.id}` })).data_sources?.[0]?.id;

  if (!dataSourceId) throw new Error(`표는 만들었지만 데이터 소스 id를 찾지 못했습니다. 표 id: ${database.id}`);

  console.log("2/3 「부모 댓글」 칸(같은 표를 가리키는 관계)을 더합니다");

  await notion({
    token,
    method: "PATCH",
    path: `/data_sources/${dataSourceId}`,
    body: {
      properties: {
        [COMMENT_COLUMNS.parent]: {
          relation: { data_source_id: dataSourceId, type: "single_property", single_property: {} },
        },
      },
    },
  });

  console.log("3/3 끝났습니다.\n");
  console.log(`표 주소: ${database.url ?? `https://www.notion.so/${database.id.replaceAll("-", "")}`}`);
  console.log(`데이터 소스 id: ${dataSourceId}\n`);
  console.log("다음 할 일: worker/wrangler.jsonc의 \"NOTION_DATA_SOURCE_ID\"에 위 데이터 소스 id를 넣습니다.");
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "알 수 없는 오류");
  process.exit(1);
});
