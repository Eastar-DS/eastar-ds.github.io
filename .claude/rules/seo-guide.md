---
paths:
  - "src/pages/**"
  - "src/shared/seo/**"
  - "src/shared/components/primitives/layout/Document/**"
description: 검색(SEO)과 AI 답변(AEO)을 위한 메타, 구조화 데이터, 사이트맵, RSS 가이드라인. 페이지를 만들거나 메타를 고치기 전 필독.
---

# SEO · AEO 가이드라인

## 페이지마다 지킬 것

- `<html lang="ko">`는 `Document`가 넣음
- **h1은 페이지마다 하나.** 글 화면은 `PostArticle`, 글 목록은 `SiteIntro`, 소개는 `AboutProfile`, 404는 `NotFoundMessage`가 가짐. 머리말의 사이트 이름은 h1이 아님
- 본문 제목(h2, h3)에는 앵커를 붙임. `AnchorHeading`이 제목 자체를 `#id` 링크로 만듦
- 모든 페이지는 `shared/seo/createPageMeta`로 메타를 만들어 `Document`에 넘김. `Document`가 title, description, canonical, og, twitter 메타를 그림

  ```astro
  ---
  const meta = createPageMeta({
    title: post.title, // 사이트 이름은 함수가 뒤에 붙임
    description: post.description,
    path: getPostPath(post.slug),
    ogType: "article",
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
  });
  ---
  <Document meta={meta} jsonLds={jsonLds}>...</Document>
  ```

- canonical은 늘 절대 주소이고 끝에 `/`가 붙음 (`trailingSlash: "always"`)
- 검색에 나오면 안 되는 페이지(404)는 `head` 슬롯으로 `<meta name="robots" content="noindex">`를 더함

## 구조화 데이터 (JSON-LD)

| 페이지 | 넣는 것 | 만드는 함수 |
| --- | --- | --- |
| 글 화면 | BlogPosting (제목, 요약, 작성자 이스타, 발행일, 수정일, 주소) | `createBlogPostingJsonLd(post)` |
| 글 화면 | BreadcrumbList (사이트 → 글) | `createBreadcrumbListJsonLd([...])` |

- `Document`의 `jsonLds`로 넘기면 `<script type="application/ld+json">`으로 그림. `</script>`가 끼지 않게 `<`를 바꿔 넣음
- 수정일은 앞머리의 `updatedAt`, 없으면 발행일

## 사이트맵과 RSS

- 사이트맵은 `@astrojs/sitemap`이 빌드할 때 만듦(`/sitemap-index.xml`). 404는 빠짐
- RSS는 `src/pages/rss.xml.ts`(`/rss.xml`). 항목은 `createRssItems(posts)`로 만듦
- 둘 다 `astro.config.ts`의 `site`(`https://eastar-ds.github.io`)로 절대 주소를 만듦

## 다음 단계에 붙일 자리

- **글별 og:image**: `createPageMeta`에 `imagePath`를 더하고 `Document`에 `og:image`, `twitter:image`를 그림. 이미지가 생기면 `twitter:card`를 `summary_large_image`로 바꿈
- **llms.txt**: `src/pages/llms.txt.ts` 엔드포인트로 `getPosts` 결과를 목록으로 내보냄
- **giscus 댓글**: `modules/features/post/Comments`로 만들고 글 화면 페이지에서 `PostArticle` 아래에 배치
- **PostHog**: `Document`의 `head` 슬롯이 아니라 `Document` 안에 한 번만 넣음. 중계 주소(Cloudflare Workers)는 `shared/constants/site`에 둠
