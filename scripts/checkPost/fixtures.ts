// 시험용 글입니다. 실제 글(src/content/posts)이 바뀌어도 시험이 깨지지 않게, 가상화 1편의 앞머리와 구조를 줄여 옮겼습니다.
import readSourcePost from "./readSourcePost.ts";

export const SERIES_FIRST_SOURCE = `---
title: "라이브러리 없이 목록 가상화하기: 966ms를 46ms로"
description: "문서 1,939개를 모두 그리던 React 목록이 왜 느렸는지와, 행 위치와 그릴 범위를 계산해 화면 근처의 행만 그리게 바꾼 방법을 다룹니다."
publishedAt: 2026-11-21
category: React
series:
  name: 라이브러리 없이 목록 가상화
  order: 1
projects: [knot]
draft: true
---

import VirtualListDemo from "@/modules/features/demo/VirtualListDemo";

목록이 보이기까지 966ms가 걸렸고, 화면 근처의 행만 그리도록 바꾸니 46ms로 줄었습니다. 계산은 [2편](/posts/virtual-list-row-range/)에 있습니다.

## 「주제별」 목록은 왜 느렸을까

화면에 보이지 않는 행까지 한꺼번에 만들었기 때문에 느렸습니다.

<Figure caption="그림 1. 「주제별」 목록의 DOM 구조입니다.">
  <FolderListDomDiagram />
</Figure>

## 목록 가상화는 어떻게 그리는 행을 줄일까

목록 가상화(list virtualization)는 화면에 보이는 행만 DOM에 그리는 방법을 말합니다. [MDN 문서](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility)도 함께 봅니다.

<VirtualListDemo client:visible />

## 얼마나 빨라졌나

같은 조건에서 966ms가 46ms로 95% 줄었습니다. 계산 방법은 [2편의 행 높이 절](/posts/virtual-list-row-range/#행-높이는-그리기-전에-어떻게-알까)에 있습니다.

<Figure caption="표 1. 시간을 쓴 곳" captionSide="top">

| 시간을 쓴 곳 | 개선 전 | 개선 후 |
| --- | ---: | ---: |
| JavaScript | 676ms | 164ms |

</Figure>

\`\`\`ts title="getRowOffsets.ts" {2}
const offsets = [0];
offsets.push(64);
\`\`\`

## 정리

- 966ms를 46ms로 줄였습니다.
- 그리는 행 수가 비용을 정했습니다.
- 폴더 틀은 지키고 카드 안의 행만 가상화했습니다.

〔이스타 확인: 가상화 작업에서 배운 점이나 다음에 다르게 해 볼 점을 덧붙일지〕
`;

export const SERIES_SECOND_SOURCE = `---
title: "목록 가상화의 계산: 행 위치, 그릴 범위, 카드 높이"
description: "행 높이를 그리기 전에 계산하고, 넓힌 화면 구간에 걸친 행만 고르고, 카드 높이로 빈 높이를 채우는 방법을 숫자 예로 따라갑니다."
publishedAt: 2026-11-21
category: React
series:
  name: 라이브러리 없이 목록 가상화
  order: 2
draft: true
---

목록 가상화의 계산을 다룹니다. 앞선 이야기는 [1편](/posts/virtualized-document-list/)에 있습니다.

## 행 높이는 그리기 전에 어떻게 알까

요약이 있는지만 보면 행 높이가 정해집니다.

## 화면 구간은 어떻게 잴까

카드 맨 위를 0으로 둡니다.

## 정리

- 하나
- 둘
- 셋
`;

interface MakePostParams {
  slug: string;
  source: string;
}

export const makePost = ({ slug, source }: MakePostParams) =>
  readSourcePost({ slug, file: `src/content/posts/${slug}/index.mdx`, source });

/** 앞머리의 `draft: true` 줄을 지웁니다(게시하려고 초안 표시를 뗀 경우) */
export const withoutDraft = (source: string) => source.replace(/^draft: true\n/m, "");
