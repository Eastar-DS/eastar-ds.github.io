import { describe, expect, it } from "vitest";

import { decidePrivateInfo, decideUnreviewedPost, parseHookInput } from "./decideHooks.ts";

const POST = "/repo/src/content/posts/virtualized-document-list/index.mdx";
const DRAFT = "---\ntitle: 글\ndraft: true\n---\n\n문장입니다.\n\n〔이스타 확인: 배운 점〕\n";
const PUBLISHED = DRAFT.replace("draft: true\n", "");

describe("parseHookInput", () => {
  it("Write와 Edit 입력에서 도구 이름, 경로, 새 글을 꺼낸다", () => {
    expect(parseHookInput(JSON.stringify({ tool_name: "Edit", tool_input: { file_path: POST, new_string: "새 줄" } }))).toEqual({
      toolName: "Edit",
      filePath: POST,
      newString: "새 줄",
    });
    expect(parseHookInput(JSON.stringify({ tool_name: "Write", tool_response: { filePath: POST } })).filePath).toBe(POST);
    expect(parseHookInput("JSON이 아님")).toEqual({});
  });
});

describe("decideUnreviewedPost", () => {
  it("초안이 아닌 글에 표시가 남았으면 줄 번호와 함께 돌려보낸다", () => {
    const reason = decideUnreviewedPost({ filePath: POST, source: PUBLISHED });

    expect(reason).toContain("〔이스타 확인〕 표시가 1개 남아 있습니다");
    expect(reason).toContain("- 7줄: 〔이스타 확인: 배운 점〕");
  });

  it("초안이거나 표시가 없거나 .mdx가 아니면 넘긴다", () => {
    expect(decideUnreviewedPost({ filePath: POST, source: DRAFT })).toBeUndefined();
    expect(decideUnreviewedPost({ filePath: POST, source: PUBLISHED.replace(/〔.*〕/, "배운 점을 적었습니다.") })).toBeUndefined();
    expect(decideUnreviewedPost({ filePath: "/repo/docs/plan.md", source: PUBLISHED })).toBeUndefined();
  });

  it("draft: false도 초안이 아니다", () => {
    expect(decideUnreviewedPost({ filePath: POST, source: DRAFT.replace("draft: true", "draft: false") })).toBeDefined();
  });
});

describe("decidePrivateInfo", () => {
  const params = { filePath: POST, allowedEmails: ["blog@eastar.dev"] };

  it("글 폴더의 Write는 파일 전체를 보고 가린 값으로 돌려보낸다", () => {
    const reason = decidePrivateInfo({ ...params, toolName: "Write", source: "첫 줄\n로그는 /Users/someone/.knot/log 에 있습니다.\n" });

    expect(reason).toContain("- 2줄: 로컬 경로 /Users/…");
    expect(reason).not.toContain("someone");
  });

  it("Edit는 새로 넣은 글만 보고, 줄 번호는 파일의 줄로 센다", () => {
    const source = "옛 줄 person@gmail.com\n\n새 줄 10.0.0.12\n";

    expect(decidePrivateInfo({ ...params, toolName: "Edit", source, newString: "새 줄 10.0.0.12" })).toContain("- 3줄: 사설 IP 10.0.…");
    expect(decidePrivateInfo({ ...params, toolName: "Edit", source, newString: "\n" })).toBeUndefined();
  });

  it("데모 폴더도 보고, 사이트 연락처 이메일은 넘긴다", () => {
    const demo = "/repo/src/modules/features/demo/VirtualListDemo/index.tsx";

    expect(decidePrivateInfo({ ...params, filePath: demo, toolName: "Write", source: `const key = "ghp_${"a".repeat(36)}";` })).toContain("토큰 꼴 ghp_…(40자)");
    expect(decidePrivateInfo({ ...params, filePath: demo, toolName: "Write", source: "mailto:blog@eastar.dev" })).toBeUndefined();
  });

  it("글과 데모 밖의 파일, 그림 파일은 보지 않는다", () => {
    expect(decidePrivateInfo({ ...params, filePath: "/repo/worker/src/index.ts", toolName: "Write", source: "/Users/a/b" })).toBeUndefined();
    expect(decidePrivateInfo({ ...params, filePath: "/repo/src/content/posts/a/og.png", toolName: "Write", source: "/Users/a/b" })).toBeUndefined();
  });
});
