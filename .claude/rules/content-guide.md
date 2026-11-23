---
paths:
  - "src/content/**"
  - "src/content.config.ts"
  - "src/shared/content/**"
description: 글(MDX)과 콘텐츠 코드의 규칙 요약. 글쓰기 · 게시 정책의 정본은 docs/content-guide.md. 글을 쓰거나 콘텐츠를 읽는 코드를 고치기 전 필독.
---

# 콘텐츠 규칙 (요약)

**글쓰기와 게시 정책의 정본은 `docs/content-guide.md`입니다.** 제목 · 요약 길이, 글 구조(답을 먼저), 한글 표기, 코드 칸, 그림 · 공유 이미지, 아티팩트를 데모로 다시 만드는 규칙, 분류 목록, 게시 전 확인 목록은 모두 그 문서를 따릅니다. 이 파일은 코드 쪽에서 지킬 것만 적습니다.

- 글을 쓰거나 고칠 때는 `writing-style` 스킬(`.claude/skills/writing-style/SKILL.md`)을 따르고, `bash .claude/skills/writing-style/check.sh <글 파일>`을 출력 없이 통과시킵니다.
- 게시 전 점검은 `node scripts/checkPost.ts <slug>`(`pnpm check:post`)입니다. 셀 수 있는 항목(앞머리 길이와 분류, 글 구조, 코드 칸, 표기, 그림 alt와 설명, 〔이스타 확인〕 표시, 글 안 링크와 제목 id, 시리즈 번호, 개인 정보, writing-style)과 `--dist`의 빌드 결과(메타, 구조화 데이터, 피드, 페이지 JS)를 봅니다. 기준 값과 근거는 `scripts/checkPost/constants.ts`에 있고, 정본의 값이 바뀌면 그 파일을 함께 고칩니다. 초안이 아닌 글이 실패하면 배포 워크플로가 멈춥니다.
- 〔이스타 확인: …〕은 이스타가 답할 자리 표시입니다. 초안이 아닌 글(.mdx)에 남아 있으면 Write · Edit 뒤 훅(`scripts/hooks/blockUnreviewedPost.ts`)이 돌려보냅니다. 글과 데모 폴더의 개인 정보는 `scripts/hooks/blockPrivateInfo.ts`가 봅니다.

## 글 원본과 스키마

- 글 하나는 `src/content/posts/{slug}/index.mdx`. 그림은 같은 폴더에 둡니다. 폴더 이름이 글 주소(`/posts/{slug}/`)입니다.
- 새 글은 `pnpm new-post <slug>`로 만듭니다(`scripts/newPost.ts`). 글 이름 꼴(정본 2.3: 영어 소문자 낱말 3~5개를 하이픈으로, 숫자만인 낱말 없음)과 이미 있는 글 이름을 검사하고, 앞머리 틀(오늘 한국 날짜, 분류 `도구`, `draft: true`)과 첫 문단 · 「정리」 절 자리를 둡니다. 꼴 판단과 틀은 `scripts/newPost/postTemplate.ts`에 있고 시험합니다
- 공유 미리보기 그림은 빌드가 분류와 제목으로 그려 `/posts/{slug}/og.png`에 둡니다. 직접 만든 그림을 쓰려면 글 폴더에 `og.png`(1200×630 PNG, 300KB 이하)를 둡니다. 크기가 다르면 빌드가 멈춥니다.
- 앞머리(frontmatter) 스키마의 원본은 `src/content.config.ts`입니다. `category`는 정본 8.1의 분류 목록(`shared/constants/post`의 `POST_CATEGORIES`)만 받고, `title`이 40자 · `description`이 100자를 넘으면 빌드가 멈춥니다(정본 2.1 · 2.2의 상한). 권장 범위(25~32자, 60~80자)는 `checkPost`가 경고로 알립니다. 분류를 더할 때는 정본 8.1에 먼저 더하고 `POST_CATEGORIES`를 고칩니다. 칸을 더하거나 바꾸면 `docs/content-guide.md` 1장의 표와 맞는지 확인하고, 다르면 보고합니다.
- id는 glob loader의 `generateId`가 폴더 이름으로 만듭니다(`slug/index.mdx` → `slug`).
- `projects`(선택, 2026-11-21): 이 글과 이어진 프로젝트 id 목록(`projects: [knot]`). `shared/constants/career`의 `CAREER_PROJECT_IDS`(`knot`, `sellerhome`, `bid`)만 받아서 없는 id면 빌드가 멈춥니다. 적으면 글 끝에 「이 글과 이어진 프로젝트」 링크(`features/post/PostProjectLinks`)가 붙습니다. 정본 `docs/content-guide.md` 1장 표의 `projects` 줄과 같습니다.
- 이력서 줄과 포트폴리오 사례는 `relatedPostSlugs`에 글 이름(slug)을 적어 「관련 글」로 잇습니다. 글 이름(폴더 이름)을 바꾸면 그 값도 함께 고칩니다. 없는 글 이름이면 그 페이지의 빌드가 멈춥니다.

- 시리즈 앞머리는 `id`, `name`, `order`를 쓰며 정본 8.2를 따릅니다. `id`는 영문 소문자 낱말을 하이픈으로 잇고, 안내는 본문 첫 문단 대신 `SeriesGuide`가 그립니다.

## 글에서 쓰는 부품

`PostBody`가 MDX `components`로 넘겨 주므로 import 없이 씁니다.

| 쓰는 법 | 그려지는 것 |
| --- | --- |
| `## 제목`, `### 제목` | 앵커 링크가 붙은 제목 (`AnchorHeading`) |
| ```` ```ts title="파일.ts" ```` | 파일 이름과 복사 단추가 있는 코드 칸 (`CodeBlock`). 20줄 넘으면 줄 번호가 저절로 붙음 |
| ```` ```ts title="파일.ts" {3,5-6} ```` | 적은 줄을 강조 줄로 (한 칸에 세 줄 이하) |
| GFM 표 | 좁은 화면에서 가로로 밀리는 표 (`ContentTable`). 실제로 넘칠 때만 키보드로 밀 수 있는 이름 있는 칸이 되고, 이름은 표 설명(`Figure`의 caption)이라 표마다 설명을 붙임 |
| `<Callout>`, `<Callout kind="warn">`, `<Callout kind="note">` | 핵심 · 주의 · 참고 강조 칸 |
| `<Figure caption="그림 1. …">` + 그림 | 그림과 설명 |
| `<Figure caption="표 1. …" captionSide="top">` + 표 | 위에 설명이 붙은 표 |
| `문장[^1]` + `[^1]: 설명` | 본문 끝 「각주」 구획의 번호 목록과 「↩」 돌아가기 링크 (정본 design-system 7.28). 문구는 `astro.config.ts`의 `satteri()` 각주 설정 |

- 마크다운을 JSX 부품 안에 넣을 때는 앞뒤에 빈 줄을 둡니다.
- 데모는 `src/modules/features/demo/{데모 이름}/index.tsx`로 만들고, 글에서 import해 `client:visible`로 씁니다.
- **글꼴은 사이트에 쓰인 글자만 담습니다.** 글을 쓰고 `pnpm build`를 돌리면 새 글자로 글꼴을 다시 만들고 빠진 글자를 검사합니다. 바뀐 `src/shared/styles/fonts/` 파일은 글과 함께 커밋합니다.

## shared/content 함수

| 함수 | 하는 일 |
| --- | --- |
| `getPosts` | 모든 글을 최신순으로. 화면용 `Post` 모양으로 바꿈 |
| `getPost(slug)` | 글 하나. 없으면 빌드를 멈춤 |
| `renderPost(slug)` | 본문 컴포넌트(`Content`)와 제목 목록(`headings`) |
| `getSeriesList` | 공개한 편이 있는 시리즈의 id, 이름, 소개와 전체 편 수 |
| `getSeries(id)` | 시리즈 소개와 순서대로 정렬한 전체 편 목록. 배포에서 초안 편은 주소를 주지 않음 |
| `getAdjacentPosts(slug)` | 이전 글 · 다음 글 (같은 시리즈면 시리즈 순서, 아니면 발행일 순서) |
| `getPostsBySlugs(slugs)` | 글 이름 목록에 맞는 글을 적은 순서대로. 없는 글 이름이 있으면 빌드를 멈춤 (이력서 · 포트폴리오의 「관련 글」) |
| `calculateReadingMinutes` · `groupPostsByYear` · `toSeriesList` · `findAdjacentPosts` · `findPostsBySlugs` | 위 함수들이 쓰는 순수 계산. 단위 테스트함 |
| `splitTitle` | 제목을 첫 `: ` 뒤에서 두 덩어리로 나눔. 글 머리와 공유 미리보기 그림이 함께 씀 |
| `readPostOgImage` | 글 폴더의 `og.png`를 읽고 크기를 검사함. 없으면 `undefined` |
| `readPostLastmods` | 모든 글 원본의 앞머리에서 사이트맵 `lastmod`(고친 날, 없으면 쓴 날)를 글 이름별로 읽음. `astro.config.ts`가 부르므로 `@/` 별칭 없이 씀. 날짜는 `YYYY-MM-DD`로 적고, 날짜로 읽을 수 없으면 빌드를 멈춤 |
| `codeTitleTransformer` · `codeLineNumbersTransformer` | 코드 칸 메타의 `title`을 `<pre data-title>`로 옮기고, 20줄 넘는 코드에 `data-line-numbers`를 붙이는 Shiki transformer. `astro.config.ts`에서 씀 |
| `codeThemes` | VS Code Light+ / Dark+에서 대비가 모자란 색만 고친 Shiki 테마 두 벌(`blog-light-plus` · `blog-dark-plus`). 테스트가 모든 글자색의 대비를 확인함 |

- 컴포넌트는 `astro:content`를 직접 import하지 않고 이 함수들을 부릅니다.
- 날짜는 한국 달력 날짜입니다. `Date`로 넘기되, `shared/utils/formatDate`의 `isoDateTime`은 그 한국 날짜의 0시(+09:00)로 적습니다. 사이트맵과 RSS의 UTC 출력도 같은 순간으로 맞춥니다.
- 마크다운 처리기는 Astro 7 기본인 Sätteri이고, `astro.config.ts`의 `markdown.processor: satteri({...})`로 설정합니다(각주 문구 등). `markdown.remarkRehype` · `remarkPlugins`는 unified 처리기용이라 쓰지 않습니다. 화면 모양을 바꾸는 일은 플러그인보다 `PostBody`의 MDX `components` 바꿔 끼우기로 먼저 해결합니다.

- content-guide 4.1 개정 대기, 2026-11-22 렌더링 버그: Sätteri가 본문 한 줄의 물결표 둘 사이를 취소선으로 그리므로 `checkPost`의 「본문 한 줄의 물결표 두 개 이상」은 실패입니다. 코드 칸·인라인 코드와 이스케이프한 물결표는 제외합니다. 범위 표기 규칙과 본문 수정은 이스타가 정합니다.
