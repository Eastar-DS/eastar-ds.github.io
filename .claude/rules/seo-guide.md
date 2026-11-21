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
  - `<title>`은 「페이지 제목 · 사이트 이름」, og:title과 twitter:title은 페이지 제목만 씀(`docs/content-guide.md` 2.1). 사이트 이름은 og:site_name이 알림
  - 모든 페이지에 공유 미리보기 그림(og:image · og:image:type · og:image:width · og:image:height · og:image:alt, twitter:image · twitter:image:alt)을 넣고 `twitter:card`는 `summary_large_image`. 그림은 `createPageMeta`가 `getOgImage`로 고르므로 페이지는 넘길 값이 없음(아래 「공유 미리보기 그림」)

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
| 글 화면 | BlogPosting (제목, 요약, 작성자 이스타, 발행일, 수정일, 주소, 공유 그림 `image`) | `createBlogPostingJsonLd(post)` |
| 글 화면 | BreadcrumbList (사이트 → 글) | `createBreadcrumbListJsonLd([...])` |
| 소개 | ProfilePage (소개하는 사람 mainEntity = 글쓴이 Person) | `createProfilePageJsonLd()` |

- `Document`의 `jsonLds`로 넘기면 `<script type="application/ld+json">`으로 그림. `</script>`가 끼지 않게 `<`를 바꿔 넣음
- 수정일은 앞머리의 `updatedAt`, 없으면 발행일
- 글쓴이 Person(이름 「이스타」, 소개 페이지 주소, `sameAs`에 GitHub, `@id`는 `소개 주소#person`)은 `createPersonJsonLd()` 하나로 만들어 BlogPosting의 author와 ProfilePage가 함께 씀. 본명 · 이메일 · 직함은 이스타가 정하기 전에는 넣지 않음

## 사이트맵과 RSS

- 사이트맵은 `@astrojs/sitemap`이 빌드할 때 만듦(`/sitemap-index.xml`). 404는 빠짐. 기능 스위치가 꺼진 페이지(공개 전 이력서 · 포트폴리오)는 빌드에 없어서 사이트맵에도 없음. 엔드포인트(`og.png`, `llms.txt`, `robots.txt`, `rss.xml`)는 사이트맵에 들어가지 않음
- RSS는 `src/pages/rss.xml.ts`(`/rss.xml`). 항목은 `createRssItems(posts)`로 만듦
- 둘 다 `astro.config.ts`의 `site`(`https://eastar-ds.github.io`)로 절대 주소를 만듦

## 공유 미리보기 그림 (og:image)

- 크기와 글 배치는 `docs/content-guide.md` 6.2(1200×630 PNG, 300KB 이하, 글은 가운데 1080×530px 안, 제목 48px 이상)를 따름. 값은 `shared/constants/ogImage`와 `shared/seo/createOgImage`의 `LAYOUT` · `TITLE_SIZES`
- 그림 주소는 페이지 주소 바로 아래 `og.png`(`getOgImagePath`). 글은 `/posts/{slug}/og.png`, 사이트 기본 그림은 `/og.png`
  - 글: `src/pages/posts/[slug]/og.png.ts`. 글 폴더에 직접 만든 `og.png`가 있으면 그것을 쓰고(`shared/content/readPostOgImage`, 크기가 다르면 빌드 실패), 없으면 분류와 제목으로 그림
  - 글이 아닌 페이지: `src/pages/[...page]/og.png.ts`. 어떤 페이지가 자기 그림을 갖는지는 `shared/seo/getPageOgCards` 한곳에서 정함. 지금은 첫 화면(사이트 기본 그림), 이력서(`IS_RESUME_SHOWN`), 포트폴리오(`IS_PORTFOLIO_SHOWN`). 목록에 없는 페이지(소개, 개인정보 처리 안내, 404)는 사이트 기본 그림
- 그림은 satori로 배치하고 sharp로 PNG를 만듦. 색은 `tokens.css`의 밝은 값을 `?raw`로 읽고(그림에 색을 직접 쓰지 않음), 사람 이름은 `SITE`에서 읽음
- 글자는 사이트 글꼴(Blog Sans)이 아니라 Pretendard 원본 OTF 전체로 그림. 원본에도 없는 글자(한자, 그림 문자)가 있으면 빌드를 멈춤. 그림은 `scripts/buildFonts.ts`가 읽지 않아 사이트 글꼴 만들기와 엉키지 않음

## llms.txt

- `src/pages/llms.txt.ts`(`/llms.txt`)가 `shared/seo/createLlmsTxt`로 만듦. 규격은 https://llmstxt.org v2: H1 사이트 이름 → 인용문 사이트 설명 → 읽는 법 문단 → H2 절마다 `- [이름](주소): 설명` 목록
- 절: 「글」(최신순, 제목 · 주소 · 요약 · 분류 · 쓴 날), 「글쓴이」(소개, 페이지가 있을 때만 포트폴리오 · 이력서), 「Optional」(RSS, 사이트맵, 개인정보 처리 안내)
- 모든 페이지 `<head>`에 `<link rel="describedby" href="/llms.txt">`를 둠(규격 v2의 찾게 하는 방법). robots.txt와 사이트맵에는 llms.txt를 알리는 표준 관례가 없어 적지 않음
- llms-full.txt와 글별 `.md` 사본은 두지 않음. 글 페이지가 JavaScript 없는 정적 HTML이라 에이전트가 주소를 그대로 읽으면 됨
- `scripts/buildFonts.ts`는 llms.txt의 글자를 사이트 글꼴에 넣지 않음(화면에 그리지 않는 글)

## IndexNow

- 배포 워크플로(`.github/workflows/deploy.yml`)가 배포 뒤 글이 바뀐 페이지 주소를 IndexNow로 알림. 스크립트는 `scripts/indexNow.ts`(`plan` · `submit`), 순수 함수와 시험은 `scripts/indexNow/`
- 고르는 법: 빌드 결과의 페이지마다 「`<title>` + meta description + `<main>`의 글」 해시를 `dist/indexnow-pages.json`에 쓰고, 지금 배포된 같은 파일과 견줌. 새로 생기거나 글이 바뀌거나 없어진 페이지만 보냄. 화면 모양만 바뀐 배포는 보내지 않음. 배포된 파일이 없으면(처음) 모든 페이지
- 404와 noindex 페이지, 사이트맵 · RSS · llms.txt · 그림은 보내지 않음
- 키는 규격상 공개 값이라 `public/{키}.txt`와 `scripts/indexNow/constants.ts`에 둠(시험이 둘이 같은지 봄). 접수 주소는 네이버 한 곳이고 참여 엔진끼리 나눔
- 고르기와 보내기 모두 실패해도 배포를 막지 않고 응답 코드를 로그에 남김

## 댓글과 방문 통계 (2차, `docs/worker.md`)

- **노션 댓글**: `modules/widgets/post/Comments`가 Cloudflare Worker의 `/comments`에서 불러옴. `IS_COMMENTS_ENABLED`(`shared/constants/features`)와 `WORKER_URL` · `TURNSTILE_SITE_KEY`(`shared/constants/services`)가 모두 있을 때만 그림
- **PostHog**: `Document`의 `head` 슬롯이 아니라 `Document` 안(`ui/AnalyticsScript`)에 한 번만 넣음. Worker 주소와 중계 경로는 `shared/constants/services`에 둠. `WORKER_URL` · `POSTHOG_PROJECT_KEY`가 모두 있을 때만 불러옴
- 값이 비어 있으면 `astro.config.ts`가 두 부품을 빈 부품으로 바꿔 빌드에 싣지 않음. 새로 붙이는 바깥 서비스 부품도 같은 방식으로 뺌
- 모으는 정보가 바뀌면 개인정보 처리 안내(`PrivacyNotice`)를 먼저 고침. 댓글 · 방문 통계 문단은 설정 값이 있을 때만 보임
