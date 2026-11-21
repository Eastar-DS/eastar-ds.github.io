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
- **h1은 페이지마다 하나.** 글 화면은 `PostHeader`(글 머리), 글 목록은 `SiteIntro`, 소개는 `AboutProfile`, 이력서는 `Resume`(이름 「이스타」), 포트폴리오는 `Portfolio`, 개인정보 처리 안내는 `PrivacyNotice`, 404는 `NotFoundMessage`(「찾는 글이 없습니다」)가 가짐. 머리말의 사이트 이름은 h1이 아님
- 본문 제목(h2, h3)에는 앵커를 붙임. `AnchorHeading`이 제목 뒤에 「제목」 링크 아이콘을 둠(올리거나 포커스할 때만 보임)
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
| 소개 | ProfilePage (소개하는 사람 mainEntity = 글쓴이 Person) | `createProfilePageJsonLd()` |

- `Document`의 `jsonLds`로 넘기면 `<script type="application/ld+json">`으로 그림. `</script>`가 끼지 않게 `<`를 바꿔 넣음
- 수정일은 앞머리의 `updatedAt`, 없으면 발행일
- 글쓴이 Person(이름 「이스타」, 소개 페이지 주소, `sameAs`에 GitHub, `@id`는 `소개 주소#person`)은 `createPersonJsonLd()` 하나로 만들어 BlogPosting의 author와 ProfilePage가 함께 씀. 본명 · 이메일 · 직함은 이스타가 정하기 전에는 넣지 않음

## 사이트맵과 RSS

- 사이트맵은 `@astrojs/sitemap`이 빌드할 때 만듦(`/sitemap-index.xml`). 404는 빠짐. 기능 스위치가 꺼진 페이지(공개 전 이력서 · 포트폴리오)는 빌드에 없어서 사이트맵에도 없음
- RSS는 `src/pages/rss.xml.ts`(`/rss.xml`). 항목은 `createRssItems(posts)`로 만듦
- 둘 다 `astro.config.ts`의 `site`(`https://eastar-ds.github.io`)로 절대 주소를 만듦

## 다음 단계에 붙일 자리

- **글별 og:image**: `createPageMeta`에 `imagePath`를 더하고 `Document`에 `og:image`, `twitter:image`를 그림. 이미지가 생기면 `twitter:card`를 `summary_large_image`로 바꿈
- **llms.txt**: `src/pages/llms.txt.ts` 엔드포인트로 `getPosts` 결과를 목록으로 내보냄

## 댓글과 방문 통계 (2차, `docs/worker.md`)

- **노션 댓글**: `modules/widgets/post/Comments`가 Cloudflare Worker의 `/comments`에서 불러옴. `IS_COMMENTS_ENABLED`(`shared/constants/features`)와 `WORKER_URL` · `TURNSTILE_SITE_KEY`(`shared/constants/services`)가 모두 있을 때만 그림
- **PostHog**: `Document`의 `head` 슬롯이 아니라 `Document` 안(`ui/AnalyticsScript`)에 한 번만 넣음. Worker 주소와 중계 경로는 `shared/constants/services`에 둠. `WORKER_URL` · `POSTHOG_PROJECT_KEY`가 모두 있을 때만 불러옴
- 값이 비어 있으면 `astro.config.ts`가 두 부품을 빈 부품으로 바꿔 빌드에 싣지 않음. 새로 붙이는 바깥 서비스 부품도 같은 방식으로 뺌
- 모으는 정보가 바뀌면 개인정보 처리 안내(`PrivacyNotice`)를 먼저 고침. 댓글 · 방문 통계 문단은 설정 값이 있을 때만 보임
