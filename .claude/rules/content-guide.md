---
paths:
  - "src/content/**"
  - "src/content.config.ts"
  - "src/shared/content/**"
description: 글(MDX) 쓰기와 콘텐츠 모음, shared/content 함수 가이드라인. 글을 쓰거나 콘텐츠를 읽는 코드를 고치기 전 필독.
---

# 콘텐츠 가이드라인

## 글 원본

- 글 하나는 `src/content/posts/{slug}/index.mdx`. 이미지는 같은 폴더에 둠
- 폴더 이름이 그대로 글 주소(`/posts/{slug}/`)가 됨. 영어 소문자와 `-`로 짓고, 게시한 뒤에는 바꾸지 않음 (주소가 바뀌면 검색 결과와 링크가 끊김)
- 공개되면 곤란한 초안은 저장소에 넣지 않음. 저장소는 공개 저장소임
- 앞머리(frontmatter)는 `src/content.config.ts`의 스키마를 따름

  ```yaml
  ---
  title: "브라우저는 언제 화면을 다시 그릴까: 레이아웃과 페인트"
  description: "한두 문장 요약. 목록, meta description, RSS에 함께 씀"
  publishedAt: 2026-11-18
  updatedAt: 2026-11-20 # 내용을 고쳤을 때만
  category: 브라우저
  series: # 시리즈 글일 때만
    name: 브라우저 렌더링
    order: 1
  ---
  ```

## 본문 쓰기

- **첫 문단에 답을 먼저 씀.** 검색과 AI는 본문을 읽으므로, 제목의 질문에 대한 답이 첫 문단에 있어야 함
- 제목은 `##`(h2)부터 씀. h1은 글 제목 하나뿐이고 `PostArticle`이 그림. 목차에는 h2, h3만 들어감
- 코드 칸은 파일 이름을 붙임: ```` ```ts title="resize.ts" ````. 파일 이름이 없으면 언어 이름이 보임
- 꼭 기억할 한 문장은 `<Callout>`으로 감쌈. import 없이 씀 (`PostArticle`이 넘겨 줌)
- 표는 GFM 표를 씀. 검색과 AI가 잘 읽음

## 데모 넣기 (아티팩트를 다시 만들어 넣는 흐름)

Claude 앱의 아티팩트는 그대로 붙이지 않고, 필요한 부분만 블로그 디자인에 맞게 다시 만듦. 디자인 기준은 아티팩트가 아니라 블로그 자체임.

1. 데모를 `src/modules/features/demo/{데모 이름}/index.tsx`로 만듦. 틀과 조작 줄은 `DemoFrame`, `DemoControls`를 씀
2. 색과 글꼴은 `tokens.css`의 변수만 씀. 아티팩트의 색을 옮기지 않음
3. 데모가 하는 판단(예: 속성별로 다시 하는 단계)은 `constants`와 `utils`에 두고 단위 테스트함
4. 글에서 import하고 `client:visible`로 씀

   ```mdx
   import RenderingPipelineDemo from "@/modules/features/demo/RenderingPipelineDemo";

   <RenderingPipelineDemo client:visible />
   ```

5. **데모 앞뒤 글만 읽어도 뜻이 통하게 씀.** 데모가 보여 주는 결론을 앞 문단과 데모 아래 한 줄 설명(`caption`)에 글로 적음. 데모는 서버에서 첫 그림을 만들어 두지만, 검색과 AI는 움직이는 결과를 보지 못함

## shared/content 함수

| 함수 | 하는 일 |
| --- | --- |
| `getPosts` | 모든 글을 최신순으로. 화면용 `Post` 모양으로 바꿈 |
| `getPost(slug)` | 글 하나. 없으면 빌드를 멈춤 |
| `renderPost(slug)` | 본문 컴포넌트(`Content`)와 제목 목록(`headings`) |
| `getSeriesList` | 시리즈별 글 수와 첫 편 |
| `calculateReadingMinutes` · `groupPostsByYear` · `toSeriesList` | 위 함수들이 쓰는 순수 계산. 단위 테스트함 |
| `codeTitleTransformer` | 코드 칸 메타의 `title`을 `<pre data-title>`로 옮기는 Shiki transformer. `astro.config.ts`에서 씀 |

- 컴포넌트는 `astro:content`를 직접 import하지 않고 이 함수들을 부름
- 날짜는 `Date`로 넘기고, 문자열로 바꾸는 일은 `shared/utils/formatDate`(한국 시간 고정)가 함
- 마크다운 처리기는 Astro 7 기본인 Sätteri를 씀. remark/rehype 플러그인이 꼭 필요해지면 `@astrojs/markdown-remark`의 `unified()`로 바꿈. 제목 앵커처럼 화면 모양을 바꾸는 일은 플러그인보다 `PostArticle`의 MDX `components` 바꿔 끼우기로 먼저 해결함
