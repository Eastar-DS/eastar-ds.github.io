---
name: project-structure
description: 블로그(Astro) 전체 폴더 구조와 레이어(pages / modules / shared)별 역할, 네이밍·운영 원칙 가이드. 새 파일·폴더를 만들거나, 기존 코드를 어디에 둘지·어느 레이어로 옮길지 판단하거나, 로직을 컴포넌트 `utils`·`model`에 둘지 `shared`로 내릴지 판단하거나, "이 파일 어디에 둬야 해", "폴더 구조 알려줘", "project-structure" 같은 요청을 받을 때 사용.
user-invocable: true
---

# 프로젝트 폴더 구조 가이드

이 스킬은 **파일·폴더의 위치와 이름을 결정**할 때 사용함. 새 파일 생성, 기존 파일 이동, 레이어 판단이 필요한 시점에 먼저 로드.

폴더 구조는 '변경에 유연함'을 판단 근거로 잡았기 때문에, 아래 모든 규칙은 "코드가 어떤 이유로 함께 바뀌는가"를 따라 결정됨.

## 이 스킬이 하는 일

1. **대상 파악** - 만들거나 옮길 대상이 무엇인지(컴포넌트 / 데모 / 콘텐츠 함수 / SEO 함수 / 유틸 / 타입 / 테스트 / 글) 특정
2. **레이어 결정** - 아래 [레이어별 역할](#레이어별-역할)에 따라 `pages` / `modules` / `shared` / `content` 중 어디에 둘지 결정
3. **경로·이름 확정** - [전체 폴더 구조](#전체-폴더-구조)에 맞춰 최종 경로를 확정하고, 폴더·파일명은 `.claude/rules/general-code-convention.md`의 네이밍 규칙을 따름
4. **세부 규칙 위임** - 위치가 정해진 뒤의 내부 구성은 아래 역할별 문서를 따름

## 세부 규칙 문서

- 폴더·파일 네이밍, 스타일, JavaScript 보내기: `.claude/rules/general-code-convention.md`
- 디자인 토큰 · 부품 · 화면 폭: `.claude/rules/design-system.md` (정본 `docs/design-system.md`)
- 컴포넌트 위치(추상화 레벨): `.claude/rules/component-abstract-pattern.md`
- 컴포넌트 폴더 구성(콜로케이션): `.claude/rules/component-colocation-pattern.md`
- 세그먼트 정의·배치·의존 규칙: `.claude/rules/segment-pattern.md`
- 페이지 배치(공통 레이아웃 없음): `.claude/rules/layout-pattern.md`
- shared 레이어 구성·폴더별 역할: `.claude/rules/shared-layer.md`
- 글 쓰기와 콘텐츠 함수: `.claude/rules/content-guide.md` (정본 `docs/content-guide.md`)
- 메타·구조화 데이터·사이트맵·RSS: `.claude/rules/seo-guide.md`
- React 섬의 훅: `.claude/rules/hook-guide.md`
- 테스트: `.claude/rules/test-strategy.md`

모두 아닐 시 위의 규칙 문서를 사용하지 않기.

## 전체 폴더 구조

```plaintext
astro.config.ts                      # site, trailingSlash, MDX · React · sitemap, Shiki 두 테마와 transformer, 설정이 빈 기능 부품을 빈 부품으로 바꾸는 별칭
scripts/buildFonts.ts                # 사이트 글자만 담은 글꼴 만들기 · 빠진 글자 검사 (pnpm build가 돌림)
scripts/fonts/                       # 글자 모으기 · 글꼴 이름 바꾸기 (단위 테스트 포함)
scripts/newPost.ts                   # pnpm new-post <slug>: 새 글 폴더와 원본 틀 만들기 (글 이름 꼴 · 겹침 검사)
scripts/newPost/                     # 글 이름 꼴 판단과 원본 틀 순수 함수 (단위 테스트 포함)
scripts/EmptyPart.astro              # 아무것도 그리지 않는 빈 부품 (댓글 · 방문 통계 설정이 비면 astro.config.ts가 대신 넣음)
scripts/indexNow.ts                  # 배포 때 글이 바뀐 페이지를 골라(plan) IndexNow로 알림(submit). 바깥 패키지 없이 Node만으로 돎
scripts/indexNow/                    # 페이지 글 해시 · 바뀐 주소 고르기 · 요청 만들기 순수 함수와 IndexNow 키 (단위 테스트 포함)
public/{IndexNow 키}.txt             # IndexNow 키 파일 (규격상 공개 값)
.github/workflows/deploy.yml         # main에 올라오면 검사 · 빌드 · GitHub Pages 배포, 배포 뒤 IndexNow 알리기
worker/                              # Cloudflare Worker: 노션 댓글(/comments)과 PostHog 중계(/bridge). 블로그와 따로 설치 · 시험 · 배포 (docs/worker.md)
src/
├── content.config.ts                # 글 모음 스키마 (Astro가 요구하는 위치)
├── content/
│   └── posts/{slug}/
│       ├── index.mdx                # 글 원본. 폴더 이름이 글 주소
│       └── *.png                    # 글의 이미지
│
├── pages/                           # 라우트. widgets를 배치·조립만 함
│   ├── index.astro                  # 글 목록 (/)
│   ├── about/index.astro            # 소개 (/about/)
│   ├── resume/[...path]/index.astro # 이력서 (/resume/). 공개 스위치가 꺼지면 배포 빌드에 없음
│   ├── portfolio/[...path]/index.astro # 포트폴리오 (/portfolio/). 포트폴리오 스위치(IS_PORTFOLIO_SHOWN, 지금은 켜 둠)를 따름
│   ├── privacy/index.astro          # 개인정보 처리 안내 (/privacy/)
│   ├── posts/[slug]/index.astro     # 글 화면 (/posts/{slug}/)
│   ├── posts/[slug]/og.png.ts       # 글의 공유 미리보기 그림 (/posts/{slug}/og.png)
│   ├── [...page]/og.png.ts          # 글 아닌 페이지의 공유 그림 (/og.png 사이트 기본, /resume/og.png, /portfolio/og.png)
│   ├── 404.astro
│   ├── rss.xml.ts                   # RSS (/rss.xml)
│   ├── robots.txt.ts                # robots.txt
│   └── llms.txt.ts                  # AI 에이전트용 사이트 안내 (/llms.txt)
│
├── modules/
│   ├── widgets/{domain}/AComponent/
│   │   ├── index.astro
│   │   ├── ui/
│   │   │   └── CodeBlock.astro
│   │   ├── model/
│   │   │   └── mountComments.ts     # .astro 스크립트를 동적 import로 나눈 상태 · DOM 코드 (예: Comments)
│   │   ├── utils/
│   │   │   ├── toTocItems.ts
│   │   │   └── toTocItems.test.ts   # 단위 테스트
│   │   ├── types/
│   │   │   └── toc.ts
│   │   └── test.ts                  # 통합 테스트 (필요할 때)
│   │
│   └── features/
│       ├── {domain}/BComponent/
│       │   ├── index.astro          # 작은 동작은 .astro + <script>
│       │   └── utils/
│       │       ├── resolveTheme.ts
│       │       └── resolveTheme.test.ts
│       └── demo/CDemo/              # 글 속 데모는 React 섬
│           ├── index.tsx
│           ├── index.module.css
│           ├── ui/
│           │   ├── DocumentRows.tsx
│           │   └── DocumentRows.module.css
│           ├── model/
│           │   └── useVirtualList.ts
│           ├── constants/
│           ├── types/
│           └── utils/
│
├── shared/
│   ├── components/
│   │   ├── primitives/
│   │   │   ├── ui/                  # Icon, IconButton, Chip, Callout, Figure, SkipLink, AnchorHeading, DemoFrame, DemoControls, DemoSlider
│   │   │   ├── layout/              # Document, Container, Stack, WithAside, ShowOn
│   │   │   └── animation/
│   │   └── composites/
│   ├── content/                     # 콘텐츠 모음을 읽어 화면용 값으로 바꾸는 함수, 코드 칸 테마 · transformer
│   │   ├── getPosts/index.ts
│   │   └── groupPostsByYear/
│   │       ├── index.ts
│   │       └── test.ts
│   ├── seo/                         # 메타, 공유 미리보기 그림, 구조화 데이터, RSS 항목, robots.txt, llms.txt
│   │   ├── createPageMeta/
│   │   │   ├── index.ts
│   │   │   └── test.ts
│   │   └── createOgImage/           # satori + sharp로 1200×630 PNG (Pretendard 원본 글꼴)
│   ├── hooks/                       # React 섬용 (필요할 때)
│   │   ├── domain/
│   │   └── common/
│   ├── routes/
│   │   ├── paths/index.ts           # PATHS, getPostPath, getOgImagePath, getPortfolioProjectPath, NAV_ITEMS · getNavItems, MAIN_CONTENT_ID
│   │   └── getSwitchPagePaths/      # 스위치로 켜고 끄는 고정 주소 페이지의 getStaticPaths 값
│   ├── utils/
│   │   ├── formatDate/
│   │   │   ├── index.ts
│   │   │   └── test.ts
│   │   └── isCommentsReady/         # astro.config.ts도 부르므로 import 없는 순수 함수 (shouldLoadAnalytics도 같음)
│   ├── constants/                   # site(검색 등록 메타 값 포함), theme, features(기능 켜고 끄기, 포트폴리오 공개 판단), career(이력서 · 포트폴리오의 프로젝트 정보, 글 앞머리 projects가 받는 id 목록), services(Worker · Turnstile · PostHog 설정), ogImage(공유 그림 크기)
│   ├── types/                       # post.ts, seo.ts, theme.ts, career.ts
│   └── styles/                      # tokens.css, base.css, codeFont.css, index.css
│       └── fonts/                   # 만든 글꼴(Blog Sans · JetBrains Mono · Blog Code Hangul)과 OFL 전문
│
└── __test__/                        # E2E 테스트 (필요할 때)
```

## 레이어별 역할

| 레이어 | 정의·판단 기준 |
| --- | --- |
| `pages` / `modules/widgets` / `modules/features` | `.claude/rules/component-abstract-pattern.md` (컴포넌트 종류 · 참조 규칙 · 주의사항) |
| 페이지의 화면 배치 | `.claude/rules/layout-pattern.md` |
| `shared` (`components` · `content` · `seo` · `hooks` · `routes` · `utils` · `constants` · `types` · `styles`) | `.claude/rules/shared-layer.md` |
| `content` (글 원본) | `.claude/rules/content-guide.md` |

`modules`와 `shared`의 경계, 즉 코드를 컴포넌트 세그먼트에 둘지 `shared`로 내릴지는 아래 [코드를 shared로 내리는 기준](#코드를-shared로-내리는-기준)을 따름.

## 코드를 shared로 내리는 기준

`shared`에 둘지 컴포넌트 폴더(세그먼트)에 둘지는 사용 횟수("지금은 여기서만 쓴다")가 아니라 **컴포넌트와의 강결합 여부**로 판단. 사용 횟수로 분류하면 강결합된 코드와, 강결합되지 않았지만 한 번밖에 쓰이지 않은 코드가 같은 위치에 섞여 재사용 이점을 살릴 수 없기 때문.

> **"코드가 컴포넌트와 강결합되어 있다"의 정의**
> 코드가 바뀔 수 있는 원인이 컴포넌트에 있어서, 컴포넌트 UI가 바뀔 때 코드도 같이 바뀔 확률이 매우 높은 상태.

컴포넌트와 강결합된 코드는 컴포넌트 폴더의 `model`(React 훅) · `utils`(함수)에 두고, 아니면 `shared`에 둠.

### 기준 1. 이름에서 컴포넌트 이름을 지울 수 있는가

```ts
findActiveHeadingId(); // 목차의 「지금 읽는 곳」 판단 → TableOfContents/utils
formatDate({ date, format }); // ✅ 컴포넌트와 무관한 이름 → shared/utils
```

### 기준 2. 인자가 도메인 값인가, 컴포넌트의 내부 값인가

```ts
getStructureRows({ scrollTop, scale, ranges }); // 데모의 내부 상태 → 데모 utils
groupPostsByYear(posts); // ✅ 도메인 값만 받음 → shared/content
```

### 기준 3. 반환값이 도메인 개념인가, 특정 JSX용 묶음인가

```ts
getRowCounts({ rowCount, ranges }); // 데모 숫자 칸에 보일 값 묶음 → 데모 utils
getPostPath(slug); // ✅ 보편적인 값 → shared/routes
```

### 기준 4. 다른 화면에 붙여보는 상상 테스트

- `calculateReadingMinutes`처럼 글이 있는 화면이면 어디서든 말이 되는 함수는 `shared/content`.
- `useVirtualList`처럼 특정 데모의 화면 구조 안에서만 의미가 있는 훅은 `model`에 코로케이션.

## 콘텐츠 · SEO · Routes

- 콘텐츠 모음(`astro:content`)을 읽는 코드는 `shared/content`에만 둠. HTTP 계층(`shared/api`)은 서버가 없어서 두지 않음.
- 메타와 구조화 데이터를 만드는 함수는 `shared/seo`에 두고, 페이지가 불러 `Document`에 넘김.
- 주소는 `shared/routes`에서 path 상수와 글 주소 함수로 관리.

## 네이밍 규칙

폴더·파일 네이밍(카멜 통일, `src/pages` 라우트 폴더의 `kebab-case` 예외, 폴더 + `index.astro`/`index.tsx`/`index.ts`, 세그먼트 내부 플랫 파일, `types/` 파일명, React 스타일의 `.module.css`)은 `.claude/rules/general-code-convention.md`의 「폴더 및 파일명」이 원본이므로 여기서 반복하지 않음.

## 판단 체크리스트

파일 위치를 확정하기 전에 아래를 확인.

- [ ] 컴포넌트라면 `.claude/rules/component-abstract-pattern.md`의 판단 기준으로 `modules/widgets` · `modules/features` · `shared/components/*` 중 어디인지 정했는가?
- [ ] 움직이는 칸이라면 `.astro` + `<script>`로 될지, React 섬이 필요한지 정했는가? (`general-code-convention.md`의 「JavaScript 보내기」)
- [ ] 로직이라면 「코드를 shared로 내리는 기준」(이름·인자·반환값·이식 테스트)으로 컴포넌트 세그먼트에 둘지 `shared`로 내릴지 정했는가?
- [ ] `shared/`라면 `components` / `content` / `seo` / `hooks` / `routes` / `utils` / `constants` / `types` / `styles` 중 어디인가?
- [ ] 페이지 배치를 바꾸는 일이라면 widgets가 아니라 페이지 파일과 `primitives/layout`만 고치는가? (`.claude/rules/layout-pattern.md`)
- [ ] 폴더·파일명이 `.claude/rules/general-code-convention.md`의 네이밍 규칙에 맞는가?
