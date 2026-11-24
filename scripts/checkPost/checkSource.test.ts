import { describe, expect, it } from "vitest";

import checkSource, { countCharacters, toWritingStyleResult } from "./checkSource.ts";
import { makePost, SERIES_FIRST_SOURCE, SERIES_SECOND_SOURCE, withoutDraft } from "./fixtures.ts";
import type { SourcePost } from "./readSourcePost.ts";

const FIRST = "virtualized-document-list";
const SECOND = "virtual-list-row-range";

const check = ({ source, slug = FIRST, others }: { source: string; slug?: string; others?: SourcePost[] }) => {
  const post = makePost({ slug, source });
  const posts = [post, ...(others ?? [makePost({ slug: SECOND, source: SERIES_SECOND_SOURCE })])];

  return checkSource({ post, posts, allowedEmails: ["blog@eastar.dev"] });
};

const find = (results: ReturnType<typeof check>, id: string) => {
  const result = results.find((item) => item.id === id);

  if (!result) throw new Error(`${id} 결과가 없습니다`);

  return result;
};

const fails = (results: ReturnType<typeof check>) => results.filter((result) => result.status === "fail").map((result) => result.id);

/** 2편을 게시한 글로 두어, 1편의 2편 링크가 초안 링크가 되지 않게 합니다 */
const publishedSecond = () => makePost({ slug: SECOND, source: withoutDraft(SERIES_SECOND_SOURCE) });

describe("평가 재료: 가상화 1편 사본", () => {
  it("966ms를 그대로 둔 정상 사본(초안)은 실패가 없다", () => {
    const results = check({ source: SERIES_FIRST_SOURCE });

    expect(fails(results)).toEqual([]);
    expect(find(results, "title-length").summary).toBe("31자 (권장 25~32자, 상한 40자)");
  });

  it("draft 줄을 지우면 〔이스타 확인〕 표시 1개로 실패한다", () => {
    const results = check({ source: withoutDraft(SERIES_FIRST_SOURCE), others: [publishedSecond()] });
    const marker = find(results, "review-marker");

    expect(marker.status).toBe("fail");
    expect(marker.summary).toBe("1개");
    expect(marker.findings).toEqual([{ line: 54, message: "〔이스타 확인: 가상화 작업에서 배운 점이나 다음에 다르게 해 볼 점을 덧붙일지〕" }]);
    expect(fails(results)).toEqual(["review-marker"]);
  });

  it("초안이면 〔이스타 확인〕 표시는 경고다", () => {
    const marker = find(check({ source: SERIES_FIRST_SOURCE }), "review-marker");

    expect(marker.status).toBe("warn");
    expect(marker.summary).toBe("1개 (초안이라 경고, 초안을 풀면 실패)");
  });

  it("요약 120자는 실패, 70자는 통과다", () => {
    const description = (length: number) => "가".repeat(length);
    const withDescription = (length: number) =>
      SERIES_FIRST_SOURCE.replace(/^description: ".*"$/m, `description: "${description(length)}"`);

    expect(find(check({ source: withDescription(120) }), "description-length")).toMatchObject({
      status: "fail",
      summary: "120자 (권장 60~80자, 상한 100자)",
    });
    expect(find(check({ source: withDescription(70) }), "description-length").status).toBe("pass");
    expect(find(check({ source: withDescription(90) }), "description-length").status).toBe("warn");
  });

  it("없는 글로 가는 링크는 실패한다", () => {
    const source = SERIES_FIRST_SOURCE.replace("[2편](/posts/virtual-list-row-range/)", "[2편](/posts/no-such-post/)");
    const links = find(check({ source }), "internal-links");

    expect(links.status).toBe("fail");
    expect(links.findings).toEqual([{ line: 16, message: "/posts/no-such-post/: 없는 글입니다" }]);
  });
});

describe("링크", () => {
  it("다른 글의 제목 id까지 확인하고, 없는 제목이면 실패한다", () => {
    const good = check({ source: SERIES_FIRST_SOURCE });
    const bad = check({ source: SERIES_FIRST_SOURCE.replace("#행-높이는-그리기-전에-어떻게-알까", "#없는-제목") });

    expect(find(good, "internal-links").status).toBe("pass");
    expect(find(bad, "internal-links").findings[0]?.message).toBe("/posts/virtual-list-row-range/#없는-제목: 그 글에 없는 제목입니다");
  });

  it("이 글 안의 제목 링크도 확인한다", () => {
    const source = `${SERIES_FIRST_SOURCE}\n[위로](#얼마나-빨라졌나) [없는 곳](#없음)\n`;

    expect(find(check({ source }), "internal-links").findings.map((finding) => finding.message)).toEqual(["#없음: 이 글에 없는 제목입니다"]);
  });

  it("초안이 아닌 글이 초안으로 링크하면 실패, 초안끼리는 경고다", () => {
    const published = check({ source: withoutDraft(SERIES_FIRST_SOURCE) });
    const draft = check({ source: SERIES_FIRST_SOURCE });

    expect(find(published, "draft-links").status).toBe("fail");
    expect(find(published, "draft-links").findings).toHaveLength(2);
    expect(find(draft, "draft-links").status).toBe("warn");
  });

  it("주소 끝에 / 가 없으면 경고한다", () => {
    const source = SERIES_FIRST_SOURCE.replace("(/posts/virtual-list-row-range/)", "(/posts/virtual-list-row-range)");

    expect(find(check({ source }), "internal-link-slash").status).toBe("warn");
  });

  it("갈 곳을 말하지 않는 링크 글은 실패한다", () => {
    const source = SERIES_FIRST_SOURCE.replace("[MDN 문서]", "[여기]");

    expect(find(check({ source }), "link-text").findings[0]?.message).toBe(
      "「여기」 → https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility",
    );
  });
});

describe("제목, 주소, 분류", () => {
  it("제목 41자는 실패, 35자는 경고다", () => {
    const withTitle = (length: number) => SERIES_FIRST_SOURCE.replace(/^title: ".*"$/m, `title: "${"가".repeat(length)}"`);

    expect(find(check({ source: withTitle(41) }), "title-length").status).toBe("fail");
    expect(find(check({ source: withTitle(35) }), "title-length").status).toBe("warn");
  });

  it("글자 수는 공백과 문장 부호를 넣어 한 글자씩 센다", () => {
    expect(countCharacters("목록 가상화: 1편")).toBe(10);
  });

  it("주소에 숫자나 대문자가 있으면 실패, 낱말이 둘이면 경고다", () => {
    expect(find(check({ source: SERIES_FIRST_SOURCE, slug: "list-2026" }), "slug-format").status).toBe("fail");
    expect(find(check({ source: SERIES_FIRST_SOURCE, slug: "Virtual-List" }), "slug-format").status).toBe("fail");
    expect(find(check({ source: SERIES_FIRST_SOURCE, slug: "virtual-list" }), "slug-words").status).toBe("warn");
  });

  it("정한 목록 밖의 분류는 실패한다", () => {
    const result = find(check({ source: SERIES_FIRST_SOURCE.replace("category: React", "category: 성능") }), "category");

    expect(result.status).toBe("fail");
    expect(result.findings[0]?.line).toBe(5);
  });

  it("요약이 제목 앞부분을 그대로 담으면 경고한다", () => {
    const source = SERIES_FIRST_SOURCE.replace(/^description: "/m, 'description: "라이브러리 없이 목록 가상화하기 ');

    expect(find(check({ source }), "description-repeats-title").status).toBe("warn");
  });

  it("수정일이 게시일보다 앞서면 실패한다", () => {
    const source = SERIES_FIRST_SOURCE.replace("publishedAt: 2026-11-21", "publishedAt: 2026-11-21\nupdatedAt: 2026-11-20");

    expect(find(check({ source }), "dates").status).toBe("fail");
  });
});

describe("글 구조", () => {
  it("본문의 # 제목과 #### 제목은 실패한다", () => {
    const source = SERIES_FIRST_SOURCE.replace("## 얼마나 빨라졌나", "# 얼마나 빨라졌나\n\n#### 더 깊이");
    const results = check({ source });

    expect(find(results, "h1").status).toBe("fail");
    expect(find(results, "heading-depth").status).toBe("fail");
  });

  it("「정리」가 끝 절이 아니면 실패하고, 뒤에 「고친 내용」만 있으면 통과한다", () => {
    expect(find(check({ source: `${SERIES_FIRST_SOURCE}\n## 더 읽을 것\n\n문장입니다.\n` }), "summary-section").status).toBe("fail");
    expect(
      find(check({ source: `${SERIES_FIRST_SOURCE}\n## 고친 내용\n\n- 2026년 11월 22일: 표를 더했습니다.\n` }), "summary-section").status,
    ).toBe("pass");
    expect(find(check({ source: SERIES_FIRST_SOURCE.replace("## 정리", "## 마치며") }), "summary-section").status).toBe("fail");
  });

  it("「정리」 목록이 셋보다 적으면 경고한다", () => {
    const source = SERIES_FIRST_SOURCE.replace("- 폴더 틀은 지키고 카드 안의 행만 가상화했습니다.\n", "");

    expect(find(check({ source }), "summary-items").status).toBe("warn");
  });

  it("묻는 꼴 h2가 없으면 경고한다", () => {
    const source = SERIES_FIRST_SOURCE.replace("왜 느렸을까", "느린 까닭").replace("어떻게 그리는 행을 줄일까", "그리는 행 줄이기").replace("얼마나 빨라졌나", "결과");

    expect(find(check({ source }), "question-heading").status).toBe("warn");
  });
});

describe("코드 칸", () => {
  it("언어가 없는 칸은 실패한다", () => {
    const source = SERIES_FIRST_SOURCE.replace('```ts title="getRowOffsets.ts" {2}', "```");

    expect(find(check({ source }), "code-language").findings).toEqual([{ line: 44, message: "언어가 없습니다" }]);
  });

  it("61자 줄, 26줄 칸, 강조 네 줄은 실패한다", () => {
    const longLine = SERIES_FIRST_SOURCE.replace("offsets.push(64);", `offsets.push(${"1".repeat(46)});`);
    const manyLines = SERIES_FIRST_SOURCE.replace("offsets.push(64);", Array.from({ length: 25 }, () => "offsets.push(64);").join("\n"));
    const highlights = SERIES_FIRST_SOURCE.replace("{2}", "{1,2-4}");

    expect(find(check({ source: longLine }), "code-line-length").findings).toEqual([{ line: 46, message: "61자 (상한 60자)" }]);
    expect(find(check({ source: manyLines }), "code-block-lines").status).toBe("fail");
    expect(find(check({ source: highlights }), "code-highlight").findings[0]?.message).toBe("4줄 (상한 3줄)");
  });

  it("셸 명령의 $ 프롬프트는 실패한다", () => {
    const source = `${SERIES_FIRST_SOURCE}\n\`\`\`bash\n$ pnpm build\n\`\`\`\n`;

    expect(find(check({ source }), "code-shell-prompt").findings[0]?.message).toBe("$ pnpm build");
  });
});

describe("한글 표기", () => {
  it("<br>, 이모지, 큰따옴표, 기울임꼴은 실패한다", () => {
    const source = SERIES_FIRST_SOURCE.replace(
      "화면에 보이지 않는 행까지 한꺼번에 만들었기 때문에 느렸습니다.",
      '화면에 보이지 않는 행까지<br />한꺼번에 만들었습니다! 그래서 "느렸습니다" 🚀 *정말*로요.',
    );
    const results = check({ source });

    expect(["br", "emoji", "double-quote", "italic"].map((id) => find(results, id).status)).toEqual(["fail", "fail", "fail", "fail"]);
  });

  it("느낌표는 글 하나에 세 곳까지 통과하고, 넘으면 경고한다", () => {
    const sentence = "화면에 보이지 않는 행까지 한꺼번에 만들었기 때문에 느렸습니다.";
    const withMarks = (count: number) =>
      check({ source: SERIES_FIRST_SOURCE.replace(sentence, `${"정말 느렸습니다! ".repeat(count)}${sentence}`) });

    expect(find(withMarks(3), "exclamation").status).toBe("pass");
    expect(find(withMarks(4), "exclamation").status).toBe("warn");
  });

  it("코드 칸과 인라인 코드, 그림 문법 속의 느낌표와 큰따옴표는 보지 않는다", () => {
    const source = `${SERIES_FIRST_SOURCE}\n\`if (!isOpen) "x"\`를 씁니다.\n\n\`\`\`ts\nif (!a) console.log("b");\n\`\`\`\n`;
    const results = check({ source });

    expect(find(results, "exclamation").status).toBe("pass");
    expect(find(results, "double-quote").status).toBe("pass");
  });

  it("문단 하나에 굵게가 두 번이면 실패한다", () => {
    const source = SERIES_FIRST_SOURCE.replace("한꺼번에 만들었기", "**한꺼번에** **만들었기**");

    expect(find(check({ source }), "bold-per-paragraph").status).toBe("fail");
  });

  it("문단 안에서 손으로 줄을 바꾸면 경고한다", () => {
    const source = SERIES_FIRST_SOURCE.replace("한꺼번에 만들었기 때문에", "한꺼번에\n만들었기 때문에");

    expect(find(check({ source }), "hard-line-break").findings).toEqual([{ line: 21, message: "앞 줄과 같은 문단입니다" }]);
  });

  it("네 자리 넘는 수에 쉼표가 없으면 경고하고, 연도와 쉼표 찍은 수는 넘긴다", () => {
    const source = SERIES_FIRST_SOURCE.replace("95% 줄었습니다.", "95% 줄었고 문서는 1939개였습니다. 2026년에 쟀고 3,000자입니다.");
    const result = find(check({ source }), "number-comma");

    expect(result.status).toBe("warn");
    expect(result.findings).toHaveLength(1);
  });
});

describe("그림", () => {
  it("Figure로 감싸지 않은 그림, alt가 「스크린샷」으로 시작하는 그림, 「그림 n.」이 아닌 설명은 실패한다", () => {
    const source = `${SERIES_FIRST_SOURCE}\n![스크린샷: 성능 패널](./panel.png)\n\n<Figure caption="성능 패널">\n\n![보라색 막대가 이어진다](./bars.png)\n\n</Figure>\n`;
    const results = check({ source });

    expect(find(results, "image-alt").findings[0]?.message).toBe("./panel.png: alt가 「스크린샷」 같은 말로 시작합니다");
    expect(find(results, "figure-caption").findings.map((finding) => finding.message)).toEqual([
      "「성능 패널…」: 「그림 n.」이나 「표 n.」로 시작하지 않습니다",
      './panel.png: `<Figure caption="그림 n. …">`로 감싸지 않았습니다',
    ]);
  });

  it("alt 속성이 없는 img는 실패, 빈 alt는 경고다", () => {
    const source = `${SERIES_FIRST_SOURCE}\n<Figure caption="그림 2. 막대">\n  <img src="./a.png" />\n  <img src="./b.png" alt="" />\n</Figure>\n`;
    const results = check({ source });

    expect(find(results, "image-alt").findings[0]?.message).toBe("./a.png: alt가 없습니다");
    expect(find(results, "image-alt-empty").status).toBe("warn");
  });

  it("번호가 건너뛰거나 표 설명이 아래에 있으면 경고한다", () => {
    const source = SERIES_FIRST_SOURCE.replace("그림 1.", "그림 2.").replace(' captionSide="top"', "");
    const result = find(check({ source }), "figure-numbering");

    expect(result.findings.map((finding) => finding.message)).toEqual(["그림 2. 자리에 그림 1.이 와야 합니다", '표 설명에 captionSide="top"이 없습니다']);
  });
});

describe("시리즈", () => {
  it("번호가 겹치거나 빠지면 실패한다", () => {
    const third = makePost({ slug: "virtual-list-blank-frames", source: SERIES_SECOND_SOURCE.replace("order: 2", "order: 4") });
    const result = find(check({ source: SERIES_FIRST_SOURCE, others: [makePost({ slug: SECOND, source: SERIES_SECOND_SOURCE }), third] }), "series-order");

    expect(result.findings[0]?.message).toBe("번호가 1부터 빈 번호 없이 이어지지 않습니다 (1, 2, 4)");
  });

  it("게시할 글의 앞 번호가 초안이면 실패한다", () => {
    const second = makePost({ slug: SECOND, source: withoutDraft(SERIES_SECOND_SOURCE) });
    const first = makePost({ slug: FIRST, source: SERIES_FIRST_SOURCE });
    const result = checkSource({ post: second, posts: [first, second] }).find((item) => item.id === "series-order");

    expect(result?.findings[0]?.message).toBe("게시된 글의 번호에 빈 번호가 있습니다 (게시 2편)");
  });
});

describe("개인 정보", () => {
  it("로컬 경로와 토큰 꼴은 가려서 실패로 알리고, 사이트 연락처 이메일은 넘긴다", () => {
    const source = `${SERIES_FIRST_SOURCE}\n자료는 /Users/someone/notes 에 있고 연락은 blog@eastar.dev 로 합니다.\n\n\`\`\`bash\nexport NOTION_TOKEN=ntn_${"a".repeat(40)}\n\`\`\`\n`;
    const result = find(check({ source }), "private-info");

    expect(result.findings.map((finding) => finding.message)).toEqual(["로컬 경로 /Users/…", "토큰 꼴 ntn_…(44자)"]);
  });
});

describe("toWritingStyleResult", () => {
  it("check.sh 출력이 있으면 줄마다 실패로 바꾼다", () => {
    expect(toWritingStyleResult({ lines: ["12: 이것이 핵심입니다"] })).toMatchObject({
      status: "fail",
      findings: [{ line: 12, message: "이것이 핵심입니다" }],
    });
    expect(toWritingStyleResult({ lines: [] }).status).toBe("pass");
    expect(toWritingStyleResult({ error: "bash가 없습니다" }).status).toBe("warn");
  });
});


describe("본문 수 범위의 물결표", () => {
  const inspect = (body: string) => find(check({ source: `${SERIES_FIRST_SOURCE}\n${body}\n` }), "multiple-tildes");

  it("수 사이의 물결표는 초안도 실패하며, 찾은 줄마다 한 곳으로 센다", () => {
    const result = inspect("시간은 1~2ms에서 3~4ms로 줄었습니다.\n\n범위는 5~6과 7~8입니다.");
    expect(result.status).toBe("fail");
    expect(result.findings).toHaveLength(2);
    expect(result.findings.map((finding) => finding.line)).toEqual([SERIES_FIRST_SOURCE.split("\n").length + 1, SERIES_FIRST_SOURCE.split("\n").length + 3]);
    expect(result.basis).toBe("docs/content-guide.md 4.1");
  });

  it("줄마다 하나인 물결표 범위도 실패한다", () => {
    expect(inspect("1~2ms입니다.\n3~4ms입니다.").status).toBe("fail");
  });

  it("단위와 날짜, 공백이 있는 범위도 잡고 줄표와 수 범위가 아닌 물결표는 받는다", () => {
    expect(inspect("2초 ~ 1분, 2026.09~2026.11").status).toBe("fail");
    expect(inspect("38–47자, 2026.09–2026.11, 물결~ 표시").status).toBe("pass");
    expect(inspect('<Figure caption="그림 1. 6~8번 행" />').status).toBe("fail");
  });

  it("코드 칸, 물결표 펜스와 인라인 코드는 가린다", () => {
    const body = ["```text", "1~2, 3~4", "```", "", "~~~text", "5~6, 7~8", "~~~", "", "`1~2, 3~4`와 ``5~6 ` 7~8``을 씁니다."].join("\n");
    expect(inspect(body).status).toBe("pass");
  });

  it("이스케이프한 물결표는 세지 않고, 두 백슬래시 뒤의 물결표는 센다", () => {
    expect(inspect(String.raw`1\~2, 3\~4, 5–6`).status).toBe("pass");
    expect(inspect(String.raw`1\\~2, 3~4`).status).toBe("fail");
  });

  it("앞머리와 링크 주소의 물결표는 본문 물결표로 세지 않는다", () => {
    expect(inspect("[공식 문서](https://example.com/~user/~page)").status).toBe("pass");
    const source = SERIES_FIRST_SOURCE.replace('title: "', 'title: "~ ~ ');
    expect(find(check({ source }), "multiple-tildes").status).toBe("pass");
  });
});
