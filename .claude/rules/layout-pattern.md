---
paths:
  - "src/pages/**"
  - "src/shared/components/primitives/layout/**"
description: 공통 레이아웃(outlet) 없이 페이지마다 화면 배치를 정하는 방법. 페이지를 만들거나 배치를 바꾸기 전 필독.
---

# 레이아웃 가이드라인

## 핵심 원칙

**모든 화면을 같은 틀로 감싸는 공통 레이아웃을 두지 않음.** React Router의 `_layout` + `Outlet`, Astro의 `src/layouts/BaseLayout`처럼 머리말 · 꼬리말 · 본문 폭을 한 파일이 정하는 방식은 쓰지 않음.

대신 페이지마다 머리말, 본문 widgets, 꼬리말을 **직접 배치**함. 그래서 한 페이지의 배치를 바꿔도 다른 페이지나 widgets는 영향을 받지 않음.

## 무엇이 어디에 있나

| 하는 일 | 위치 | 담는 것 |
| --- | --- | --- |
| HTML 문서의 뼈대 | `primitives/layout/Document` | `<html lang="ko">`, `<head>` 메타 · 구조화 데이터 · 테마 초기화, `<body>` 맨 앞의 건너뛰기 링크. **화면 구조는 담지 않음** |
| 가운데 정렬과 최대 폭 | `primitives/layout/Container` | `size`: `page`(1200px) · `content`(680px) · `withAside`(680 + 72 + 220px). 좌우 여백은 `--page-padding-inline` |
| 위아래로 쌓기 | `primitives/layout/Stack` | `gap`: 간격 토큰 번호(14 → `--space-14` 56px) |
| 본문 + 옆 칸 | `primitives/layout/WithAside` | 넓은 화면(1200px 이상)에서만 나란히. `top` 슬롯은 첫 줄 본문 칸에만, 기본 슬롯과 `aside`는 둘째 줄에 나란히(옆 칸이 본문 첫 줄 높이에서 시작). `isAsideSticky`로 옆 칸을 `--toc-sticky-top`(24px)에 고정. `as="article"`로 감싸는 요소를 고름 |
| 화면 폭에 따라 보이기 | `primitives/layout/ShowOn` | `screen`: `wide` · `narrow` |
| 배치를 고르는 일 | `src/pages/**` | 위 primitives로 widgets를 놓고, 페이지 위아래 여백만 `<style>`로 정함(간격 토큰, 768px부터 넓은 값) |

## 페이지를 쓰는 법

```astro
<Document meta={meta} jsonLds={jsonLds}>
  <SiteHeader />
  <main id={MAIN_CONTENT_ID} tabindex="-1" class="main">
    <Container size="withAside">
      <WithAside as="article" isAsideSticky>
        <PostHeader slug={post.slug} slot="top" />
        <Stack gap={14}>
          <Stack gap={5}>
            <ShowOn screen="narrow">
              <TableOfContents slug={post.slug} variant="collapsible" />
            </ShowOn>
            <PostBody slug={post.slug} />
          </Stack>
          <PostNav slug={post.slug} />
          <Comments />
        </Stack>
        <ShowOn screen="wide" slot="aside">
          <TableOfContents slug={post.slug} variant="list" />
        </ShowOn>
      </WithAside>
    </Container>
  </main>
  <SiteFooter />
</Document>
```

- 페이지마다 `<main id={MAIN_CONTENT_ID} tabindex="-1">`은 하나. 건너뛰기 링크가 이 자리로 옮겨 주고, 꼬리말이 화면 아래에 붙도록 `base.css`가 `body > main`을 늘림
- 머리말 · 꼬리말을 빼고 싶은 페이지는 그냥 놓지 않으면 됨
- 목차를 왼쪽으로 옮기거나 없애는 일도 그 페이지 파일만 고침
- 글 머리를 목차 옆까지 넓히고 싶으면 `PostHeader`를 `top` 슬롯이 아니라 기본 슬롯 맨 앞으로 옮기면 됨. widgets는 고치지 않음

## widgets가 지킬 것

- **자기가 어떤 틀 안에 놓일지 가정하지 않음.** 바깥 여백, 최대 폭, 고정 위치(sticky), 화면 폭에 따라 숨기기는 widgets가 하지 않고 페이지와 layout primitives가 함
- 안쪽 배치가 폭에 따라 바뀌어야 하면 container query를 씀 (예: `PostList`의 좁은 칸 배치, `SiteHeader`의 메뉴 접기, 데모의 세로 단계)
- 머리말처럼 화면 끝까지 닿는 줄(테두리)이 디자인의 일부인 widget은 안쪽에서 `Container`를 써서 내용 폭을 맞춤
- widget 사이의 줄 맞춤(예: 목차가 본문 첫 문단과 같은 높이에서 시작)은 widget 안에서 맞추지 않음. widget을 나누고(`PostHeader` · `PostBody`) 페이지가 layout primitive의 슬롯(`WithAside`의 `top`)으로 놓음

## layout primitives가 지킬 것

- 화면 구조만 다루고 내용은 모름. 도메인 이름(글, 목차)을 props나 클래스에 쓰지 않음
- 화면 폭 구간은 휴대폰 0–767px, 태블릿 768px부터, 넓은 화면 1200px부터 (`docs/design-system.md` 5장, `tokens.css` 머리 주석). 휴대폰부터 짜고 `min-width`로 넓힘
- 숨긴 내용은 `display: none`으로 숨겨 스크린 리더에도 읽히지 않게 함. 같은 내용을 두 번 그려도 한 번만 읽힘
