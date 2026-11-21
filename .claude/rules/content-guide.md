---
paths:
  - "src/content/**"
  - "src/content.config.ts"
  - "src/shared/content/**"
description: 글(MDX)과 콘텐츠 코드의 규칙 요약. 글쓰기 · 게시 정책의 정본은 docs/content-guide.md. 글을 쓰거나 콘텐츠를 읽는 코드를 고치기 전 필독.
---

# 콘텐츠 규칙 (요약)

**글쓰기와 게시 정책의 정본은 `docs/content-guide.md`입니다.** 제목 · 요약 길이, 글 구조(답을 먼저), 한글 표기, 코드 칸, 그림 · 공유 이미지, 아티팩트를 데모로 다시 만드는 규칙, 분류 목록, 게시 전 확인 목록은 모두 그 문서를 따릅니다. 이 파일은 코드 쪽에서 지킬 것만 적습니다.

## 글 원본과 스키마

- 글 하나는 `src/content/posts/{slug}/index.mdx`. 그림은 같은 폴더에 둡니다. 폴더 이름이 글 주소(`/posts/{slug}/`)입니다.
- 앞머리(frontmatter) 스키마의 원본은 `src/content.config.ts`입니다. 칸을 더하거나 바꾸면 `docs/content-guide.md` 1장의 표와 맞는지 확인하고, 다르면 보고합니다.
- id는 glob loader의 `generateId`가 폴더 이름으로 만듭니다(`slug/index.mdx` → `slug`).

## 글에서 쓰는 부품

`PostBody`가 MDX `components`로 넘겨 주므로 import 없이 씁니다.

| 쓰는 법 | 그려지는 것 |
| --- | --- |
| `## 제목`, `### 제목` | 앵커 링크가 붙은 제목 (`AnchorHeading`) |
| ```` ```ts title="파일.ts" ```` | 파일 이름과 복사 단추가 있는 코드 칸 (`CodeBlock`). 20줄 넘으면 줄 번호가 저절로 붙음 |
| ```` ```ts title="파일.ts" {3,5-6} ```` | 적은 줄을 강조 줄로 (한 칸에 세 줄 이하) |
| GFM 표 | 좁은 화면에서 가로로 밀리는 표 (`ContentTable`) |
| `<Callout>`, `<Callout kind="warn">`, `<Callout kind="note">` | 핵심 · 주의 · 참고 강조 칸 |
| `<Figure caption="그림 1. …">` + 그림 | 그림과 설명 |
| `<Figure caption="표 1. …" captionSide="top">` + 표 | 위에 설명이 붙은 표 |

- 마크다운을 JSX 부품 안에 넣을 때는 앞뒤에 빈 줄을 둡니다.
- 데모는 `src/modules/features/demo/{데모 이름}/index.tsx`로 만들고, 글에서 import해 `client:visible`로 씁니다.
- **코드 칸 · 본문 속 코드에 새 한글을 쓰면 `pnpm fonts:code`를 돌립니다.** 코드 속 한글은 글에 쓰인 글자만 남긴 D2Coding 부분 글꼴(`src/shared/styles/fonts/blog-code-hangul.woff2`)이 그립니다. `pnpm check`가 빠진 글자를 찾아 알려 줍니다.

## shared/content 함수

| 함수 | 하는 일 |
| --- | --- |
| `getPosts` | 모든 글을 최신순으로. 화면용 `Post` 모양으로 바꿈 |
| `getPost(slug)` | 글 하나. 없으면 빌드를 멈춤 |
| `renderPost(slug)` | 본문 컴포넌트(`Content`)와 제목 목록(`headings`) |
| `getSeriesList` | 시리즈별 글 수와 첫 편 |
| `getAdjacentPosts(slug)` | 이전 글 · 다음 글 (같은 시리즈면 시리즈 순서, 아니면 발행일 순서) |
| `calculateReadingMinutes` · `groupPostsByYear` · `toSeriesList` · `findAdjacentPosts` | 위 함수들이 쓰는 순수 계산. 단위 테스트함 |
| `codeTitleTransformer` · `codeLineNumbersTransformer` | 코드 칸 메타의 `title`을 `<pre data-title>`로 옮기고, 20줄 넘는 코드에 `data-line-numbers`를 붙이는 Shiki transformer. `astro.config.ts`에서 씀 |
| `codeThemes` | VS Code Light+ / Dark+에서 대비가 모자란 색만 고친 Shiki 테마 두 벌(`blog-light-plus` · `blog-dark-plus`). 테스트가 모든 글자색의 대비를 확인함 |
| `collectCodeHangul` | 글의 코드에 쓰인 한글을 모음. `scripts/buildCodeFont.ts`가 부분 글꼴을 만들 때 씀 |

- 컴포넌트는 `astro:content`를 직접 import하지 않고 이 함수들을 부릅니다.
- 날짜는 `Date`로 넘기고, 문자열로 바꾸는 일은 `shared/utils/formatDate`(한국 시간 고정)가 합니다.
- 마크다운 처리기는 Astro 7 기본인 Sätteri입니다. 화면 모양을 바꾸는 일은 플러그인보다 `PostBody`의 MDX `components` 바꿔 끼우기로 먼저 해결합니다.
