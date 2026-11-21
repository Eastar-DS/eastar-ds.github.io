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
| HTML 문서의 뼈대 | `primitives/layout/Document` | `<html lang="ko">`, `<head>` 메타 · 구조화 데이터 · 테마 초기화, `<body>`. **화면 구조는 담지 않음** |
| 가운데 정렬과 최대 폭 | `primitives/layout/Container` | `size`: `page`(1200px) · `content`(680px) · `withAside`(본문 + 옆 칸) |
| 위아래로 쌓기 | `primitives/layout/Stack` | `gap`(px) |
| 본문 + 옆 칸 | `primitives/layout/WithAside` | 넓은 화면(1200px 이상)에서만 나란히. `isAsideSticky`로 옆 칸 고정 |
| 화면 폭에 따라 보이기 | `primitives/layout/ShowOn` | `screen`: `wide` · `narrow` |
| 배치를 고르는 일 | `src/pages/**` | 위 primitives로 widgets를 놓고, 페이지 위아래 여백만 `<style>`로 정함 |

## 페이지를 쓰는 법

```astro
<Document meta={meta} jsonLds={jsonLds}>
  <SiteHeader />
  <main class="main">
    <Container size="withAside">
      <WithAside isAsideSticky>
        <PostArticle slug={post.slug}>
          <ShowOn screen="narrow" slot="after-header">
            <TableOfContents slug={post.slug} variant="collapsible" />
          </ShowOn>
        </PostArticle>
        <ShowOn screen="wide" slot="aside">
          <TableOfContents slug={post.slug} variant="list" />
        </ShowOn>
      </WithAside>
    </Container>
  </main>
  <SiteFooter />
</Document>
```

- 페이지마다 `<main>`은 하나. 꼬리말이 화면 아래에 붙도록 `base.css`가 `body > main`을 늘림
- 머리말 · 꼬리말을 빼고 싶은 페이지는 그냥 놓지 않으면 됨
- 목차를 왼쪽으로 옮기거나 없애는 일도 그 페이지 파일만 고침

## widgets가 지킬 것

- **자기가 어떤 틀 안에 놓일지 가정하지 않음.** 바깥 여백, 최대 폭, 고정 위치(sticky), 화면 폭에 따라 숨기기는 widgets가 하지 않고 페이지와 layout primitives가 함
- 안쪽 배치가 폭에 따라 바뀌어야 하면 container query를 씀 (예: `PostList`의 좁은 칸 배치, `SiteHeader`의 메뉴 접기, 데모의 세로 단계)
- 머리말처럼 화면 끝까지 닿는 줄(테두리)이 디자인의 일부인 widget은 안쪽에서 `Container`를 써서 내용 폭을 맞춤
- 다른 widget을 끼워 넣을 자리가 필요하면 이름 있는 슬롯을 열어 둠 (예: `PostArticle`의 `after-header`). 무엇을 넣을지는 페이지가 정함

## layout primitives가 지킬 것

- 화면 구조만 다루고 내용은 모름. 도메인 이름(글, 목차)을 props나 클래스에 쓰지 않음
- 화면 폭 구간은 넓은 화면 1200px 하나로 맞춤 (`tokens.css` 머리 주석). 새 구간이 필요하면 `tokens.css` 주석에 먼저 적음
- 숨긴 내용은 `display: none`으로 숨겨 스크린 리더에도 읽히지 않게 함. 같은 내용을 두 번 그려도 한 번만 읽힘
