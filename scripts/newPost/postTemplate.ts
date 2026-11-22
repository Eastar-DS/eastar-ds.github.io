// `node scripts/newPost.ts`가 바로 불러오므로 `@/` 별칭과 바깥 패키지를 쓰지 않습니다

/**
 * 글 이름(slug) 꼴: 영어 소문자로 시작하는 낱말 3~5개를 하이픈으로 잇습니다(docs/content-guide.md 2.3).
 * 낱말 안의 숫자(`http2`)는 되지만, 날짜나 순번처럼 숫자만인 낱말(`2026`, `1`)은 받지 않습니다.
 */
const SLUG_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z][a-z0-9]*){2,4}$/;

/** 글 이름이 꼴에 맞지 않으면 까닭을, 맞으면 `undefined`를 돌려줍니다 */
export const findSlugProblem = (slug: string) => {
  if (slug === "") return "글 이름(slug)을 적어 주세요. 예: pnpm new-post browser-rendering-steps";
  if (/[A-Z]/.test(slug)) return "글 이름에는 영어 소문자만 씁니다.";
  if (/[^a-z0-9-]/.test(slug)) return "글 이름에는 영어 소문자, 숫자, 하이픈(-)만 씁니다. 한글과 빈칸은 쓰지 않습니다.";
  if (/(^|-)\d+(?=-|$)/.test(slug)) return "날짜나 순번처럼 숫자만인 낱말은 넣지 않습니다.";
  if (!SLUG_PATTERN.test(slug)) return "글 이름은 하이픈으로 이은 영어 낱말 3~5개입니다. 예: virtualized-document-list";

  return undefined;
};

/** 한국 날짜(YYYY-MM-DD). 글의 쓴 날은 한국 시간으로 적습니다(docs/content-guide.md 9장) */
export const toKoreanDate = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

/**
 * 새 글의 원본(index.mdx) 틀을 만듭니다. 앞머리는 docs/content-guide.md 1장의 순서이고, 이스타가 확인하기 전이라 `draft: true`입니다.
 * 빈 값으로 두면 글 모음 스키마가 빌드를 멈추므로 쓴 날과 분류는 채워 두고, 제목과 요약은 빈 글로 둡니다.
 * 본문은 답을 먼저 쓰는 첫 문단 자리와 끝의 「정리」 절 자리만 둡니다(3장).
 */
export const createPostSource = ({ publishedAt }: { publishedAt: string }) => `---
title: "" # 25~32자, 핵심 낱말을 앞 20자 안에 (2.1)
description: "" # 60~80자, 무엇을 알게 되는지 한두 문장 (2.2)
publishedAt: ${publishedAt}
# updatedAt: ${publishedAt} # 내용을 고쳤을 때만 (9장)
category: 도구 # 브라우저, CSS, JavaScript, React, 접근성, 도구 가운데 하나 (8.1)
# series: # 시리즈 글일 때만 (8.2)
#   name: 시리즈 이름
#   order: 1
# projects: [knot] # 이어진 프로젝트가 있을 때만
draft: true # 이스타가 확인하기 전까지 둡니다 (12장)
---

글 전체의 결론을 첫 문단 2~3문장에 씁니다.

## 정리

- 글의 핵심을 3~5개 적습니다.
`;
