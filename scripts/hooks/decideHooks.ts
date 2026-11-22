// Claude Code 훅(.claude/settings.json의 PostToolUse Write|Edit)이 글을 돌려보낼지 정하는 순수 함수입니다.
// 훅 실행 파일(scripts/hooks/blockUnreviewedPost.ts, blockPrivateInfo.ts)은 입력을 읽고 이 함수의 답을 내보내기만 합니다.
// 훅의 출력 꼴: 돌려보낼 때만 `{"decision":"block","reason":"…"}`을 내고, 아니면 아무것도 내지 않습니다.
import findPrivateInfo, { PRIVATE_INFO_LABELS } from "../checkPost/findPrivateInfo.ts";
import findReviewMarkers from "../checkPost/findReviewMarkers.ts";
import parseFrontmatter, { toPostMeta } from "../checkPost/parseFrontmatter.ts";

export interface HookInput {
  toolName?: string;
  filePath?: string;
  /** Edit가 새로 넣은 글 */
  newString?: string;
}

/** 훅이 받는 JSON(stdin)에서 도구 이름, 파일 경로, 새로 넣은 글을 꺼냅니다. JSON이 아니면 빈 값입니다 */
export const parseHookInput = (raw: string) => {
  try {
    const json = JSON.parse(raw) as {
      tool_name?: string;
      tool_input?: { file_path?: string; new_string?: string };
      tool_response?: { filePath?: string };
    };
    const input: HookInput = {
      toolName: json.tool_name,
      filePath: json.tool_input?.file_path ?? json.tool_response?.filePath,
      newString: json.tool_input?.new_string,
    };

    return input;
  } catch {
    const input: HookInput = {};

    return input;
  }
};

interface DecideUnreviewedPostParams {
  filePath: string;
  /** 쓰고 난 뒤의 파일 전체 */
  source: string;
}

/**
 * 게시 막기: 앞머리에 `draft: true`가 없는 글(.mdx)에 〔이스타 확인〕 표시가 남아 있으면 돌려보낼 까닭을 돌려줍니다.
 * 초안 표시를 지우는 Edit도 파일 전체를 보고 판단합니다(표시는 지운 줄이 아닌 다른 줄에 있으므로).
 */
export const decideUnreviewedPost = ({ filePath, source }: DecideUnreviewedPostParams) => {
  if (!filePath.endsWith(".mdx")) return undefined;

  const frontmatter = parseFrontmatter(source);

  if (toPostMeta(frontmatter.data).draft) return undefined;

  const markers = findReviewMarkers({ source, fromLine: frontmatter.bodyStartLine });

  if (markers.length === 0) return undefined;

  return [
    `게시 막기: ${filePath}는 앞머리에 \`draft: true\`가 없는데 〔이스타 확인〕 표시가 ${markers.length}개 남아 있습니다.`,
    ...markers.map((marker) => `- ${marker.line}줄: ${marker.text}`),
    "",
    "이스타가 확인하기 전에는 게시할 수 없습니다(docs/content-guide.md 12장). 앞머리에 `draft: true`를 되돌리거나, 이스타에게 물어 받은 답으로 표시를 바꾸세요.",
    "표시 자리의 생각이나 배운 점을 모델이 지어 채우지 않습니다.",
  ].join("\n");
};

/** 개인 정보 검사를 하는 폴더: 글과 데모 코드(docs/content-guide.md 11장) */
const PRIVATE_INFO_DIRS = ["/src/content/", "/src/modules/features/demo/"];

/** 글자로 읽지 않는 파일 */
const BINARY_FILE = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|mp4|webm|pdf)$/i;

interface DecidePrivateInfoParams {
  filePath: string;
  toolName?: string;
  /** 쓰고 난 뒤의 파일 전체 */
  source: string;
  newString?: string;
  /** 공개해도 되는 이메일(`SITE.author.email`) */
  allowedEmails: readonly string[];
}

/**
 * 개인 정보 검사: 글과 데모 폴더의 파일에 로컬 경로, 이메일, 토큰 꼴, 사설 IP, 전화번호가 있으면 돌려보낼 까닭을 돌려줍니다.
 * Write는 파일 전체를, Edit는 새로 넣은 글만 봅니다. 고치지 않은 줄 때문에 매번 막히지 않게 하려는 것이고,
 * 원래 있던 값은 게시 전 점검(`node scripts/checkPost.ts`)이 파일 전체에서 잡습니다.
 */
export const decidePrivateInfo = ({ filePath, toolName, source, newString, allowedEmails }: DecidePrivateInfoParams) => {
  const normalized = filePath.split("\\").join("/");

  if (!PRIVATE_INFO_DIRS.some((dir) => normalized.includes(dir)) || BINARY_FILE.test(normalized)) return undefined;

  const isEdit = toolName === "Edit" && newString !== undefined;
  const text = isEdit ? newString : source;
  const offset = isEdit ? source.indexOf(newString) : 0;
  const firstLine = offset > 0 ? source.slice(0, offset).split("\n").length : 1;
  const matches = findPrivateInfo({ text, allowedEmails, firstLine });

  if (matches.length === 0) return undefined;

  return [
    `개인 정보 검사: ${filePath}에 공개 저장소에 올리면 안 되는 값이 ${matches.length}곳 있습니다.`,
    ...matches.map((match) => `- ${match.line}줄: ${PRIVATE_INFO_LABELS[match.kind]} ${match.masked}`),
    "",
    "docs/content-guide.md 11장: 토큰, 비밀번호, 키, 개인 이메일, 전화번호, 로컬 경로는 글, 코드 칸, 데모 어디에도 넣지 않습니다. 그 값을 지우거나 새로 만든 예시 값으로 바꾸세요.",
    "키나 토큰이었다면 지우는 것만으로는 부족하니, 이스타에게 알려 새로 발급하게 하세요. 값은 답에 다시 적지 않습니다.",
  ].join("\n");
};
