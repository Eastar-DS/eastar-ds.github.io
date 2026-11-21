# 하네스를 블로그용으로 옮긴 기록 (2026-11-21)

이 저장소의 `CLAUDE.md`, `.claude/rules/`, `.claude/skills/project-structure/`는 Knot 하네스(`harness/knot`, 커밋 `86de4e9` 기준. 그 뒤 커밋 `2b2523e`는 프론트엔드 파일을 고치지 않음)의 프론트엔드 부분을 Astro 블로그에 맞게 옮긴 것입니다. 하네스 원본은 고치지 않았습니다.

## 그대로 가져온 생각

- 폴더 구조의 판단 기준은 「변경에 유연함」, 즉 코드가 어떤 이유로 함께 바뀌는가입니다.
- `pages` > `widgets` > `features` > `composites` > `primitives` 참조 순서, 같은 레벨끼리는 조합하지 않음.
- 컴포넌트 폴더 + `index`, 세그먼트(`ui` / `model` / `utils` / `types` / `constants` / `context`) 안은 플랫 파일.
- `shared`는 폴더 + `index.ts`, 단위 테스트는 같은 폴더의 `test.ts`.
- 「코드를 shared로 내리는 기준」(사용 횟수가 아니라 강결합 여부, 이름 · 인자 · 반환값 · 이식 테스트 네 기준).
- 이름 짓기(`is` 불리언, `on`/`handle` 핸들러, `root`/`container`/`wrapper`, `SNAKE_CASE` 상수, `Params` 인터페이스), 리턴 타입 미명시, 객체 반환 훅.
- 테스트는 단위 · 통합 · E2E만.

## 파일별로 바꾼 것

| 하네스 원본 | 블로그 파일 | 바꾼 것 | 이유 |
| --- | --- | --- | --- |
| `instructions/frontend/CLAUDE.md` | `CLAUDE.md` | 프로젝트 개요와 명령 표를 블로그로 바꿈. 작업 절차 4단계(스토리 작성)를 빼고 「판단 로직은 테스트와 함께」, 「브라우저로 넓은 화면 · 휴대폰 · 어두운 화면 확인」, 「check · test · build 통과」를 넣음. 영역별 규칙을 표로 바꾸고 새 규칙 세 개를 더함 | Storybook을 두지 않으므로 화면 확인을 브라우저 확인으로 대신함 |
| `skills/frontend/project-structure/SKILL.md` | `.claude/skills/project-structure/SKILL.md` | 폴더 나무를 실제 블로그 구조로 바꿈. `shared/api`·`provider`·`store` 대신 `shared/content`·`seo`·`styles`. 판단 기준 예시를 블로그 코드로 바꾸고, 「움직이는 칸을 .astro로 할지 React로 할지」 체크 항목을 더함 | 서버가 없는 정적 사이트라 HTTP 계층이 없음 |
| `rules/frontend/general-code-convention.md` | `.claude/rules/general-code-convention.md` | `paths`를 `.astro`·`.ts`·`.tsx`로. 컴포넌트 파일을 `index.astro`(React 섬만 `index.tsx`)로. Astro props는 `interface Props`. DTO · 쿼리 키 · Figma · Storybook 부분을 뺌. 스타일을 Emotion 대신 Astro 범위 스타일 + CSS Modules + `tokens.css` 변수로. 「JavaScript 보내기」 절과 container query 원칙을 더함 | Astro는 `Props`라는 이름으로 props 타입을 읽음. Emotion은 런타임 JS가 필요해 「JS를 보내지 않는다」와 맞지 않음 |
| `rules/frontend/component-abstract-pattern.md` | `.claude/rules/component-abstract-pattern.md` | `paths`에 `src/pages/**`를 더함. 도메인을 `site`·`post`·`series`·`demo`로. 「직접 패칭」을 「`shared/content` 함수를 빌드할 때 부름」으로. 페이지가 할 수 있는 일(`getStaticPaths`, `shared/seo`로 메타 만들기, layout primitives로 배치)을 적음. 슬롯으로 끼워 넣는 것은 조합이 아니라는 규칙, React 섬은 `.astro`를 못 쓴다는 규칙을 더함 | Astro는 `getStaticPaths`를 페이지에만 둘 수 있음. 공통 레이아웃을 빼면서 페이지가 widgets를 이어 붙이는 방법이 필요함 |
| `rules/frontend/component-colocation-pattern.md` | `.claude/rules/component-colocation-pattern.md` | `index.astro`/`index.tsx`, React 스타일 `.module.css`를 옆에 두는 규칙을 더함. 스토리 · API mock 부분을 뺌. `.astro`의 `<script>` 판단 로직을 `utils`로 떼어 테스트하는 규칙을 더함 | Storybook과 msw를 두지 않음 |
| `rules/frontend/segment-pattern.md` | `.claude/rules/segment-pattern.md` | 「api 코드의 위치」를 「콘텐츠 코드의 위치」로. `model`·`context`는 React 섬 전용. 전역 Provider를 두지 않는 이유를 적음. 스토리 위치 절을 뺌 | React 섬은 따로 하이드레이션되어 공통 Provider로 감쌀 수 없음 |
| `rules/frontend/shared-layer.md` | `.claude/rules/shared-layer.md` | 최상위 구성에서 `api`·`provider`·`store`를 빼고 `content`·`seo`·`styles`를 더함. `astro:content`는 `shared/content`에서만 import하는 규칙, `routes` 사용 규칙을 더함 | 콘텐츠 모음이 API를 대신함. 메타 만들기가 여러 페이지에서 반복됨 |
| `rules/frontend/test-strategy.md` | `.claude/rules/test-strategy.md` | msw · DTO 기대값 부분을 뺌. `astro:content`를 부르는 함수는 순수 계산을 떼어 테스트하는 규칙, 한국 시간 테스트, 브라우저 확인 절을 더함. 통합 · E2E는 「필요해지면」으로 적음 | 서버 응답이 없고, `astro:content`는 vitest에서 돌지 않음 |
| `rules/frontend/hook-guide.md` | `.claude/rules/hook-guide.md` | React 섬 전용으로 범위를 좁히고 예시를 데모 훅으로 바꿈. 쿼리 훅 언급을 뺌 | `.astro`에는 훅이 없음 |
| (없음) | `.claude/rules/layout-pattern.md` | 새로 씀. 공통 레이아웃(outlet) 없이 페이지마다 배치하는 법, `Document`·`Container`·`Stack`·`WithAside`·`ShowOn`의 역할 | 이스타의 요청: outlet 공통 레이아웃을 빼고 레이아웃을 유연하게 |
| (없음) | `.claude/rules/content-guide.md` | 새로 씀. 글 앞머리, 본문 쓰기(답을 먼저), 데모 넣기(아티팩트를 다시 만드는 흐름), `shared/content` 함수 표 | 블로그의 중심이 글이라 규칙이 필요함 |
| (없음) | `.claude/rules/seo-guide.md` | 새로 씀. h1 하나, 제목 앵커, `createPageMeta`, BlogPosting · BreadcrumbList, 사이트맵 · RSS, 다음 단계 자리(og:image, llms.txt, giscus, PostHog) | `docs/plan.md`의 SEO · AEO 결정을 코드 규칙으로 옮김 |

## 가져오지 않은 하네스 파일

| 파일 | 이유 |
| --- | --- |
| `rules/frontend/api-guide.md`, `dto-guide.md`, `query-hooks.md` | 서버가 없어 HTTP 계층(httpClient, DTO 클래스, React Query, msw)을 쓰지 않음 |
| `rules/frontend/agent-guide.md` | 이번 지시의 옮길 목록에 없었음. 말투 · 커밋 규칙은 이스타의 전역 지침이 이미 다룸 |
| `skills/frontend/create-story/` | Storybook을 두지 않음 |
| `skills/frontend/commit/`, `review/`, `a11y-review/`, `create-pr-content/`, `explain-diff-html/`, `agents/frontend/*`, `scripts/frontend/*` | 이번 단계는 폴더 구조와 코드 규칙만 옮김. 필요해지면 따로 옮김 |

## 지시와 다르게 정한 것

| 지시 | 실제 | 이유 |
| --- | --- | --- |
| 테마 전환, 코드 복사를 React 컴포넌트로 만들고 `client:*`로 살림 | `.astro` 컴포넌트 + `<script>`로 만듦. 판단 로직(`resolveTheme`, `getNextTheme`)은 `utils`로 떼어 테스트함. React는 데모에만 씀 | 테마 전환은 모든 페이지의 머리말에 있어서, React 섬으로 만들면 모든 페이지가 React 런타임(빌드 결과 약 72KB gzip)을 받음. `<script>`로는 글 목록 페이지의 JavaScript가 인라인 약 0.5KB(gzip)임. 첫 그림 전 테마 적용은 어차피 `Document`의 인라인 스크립트가 해야 해서 React가 할 일이 없음 |
| 목차의 「지금 읽는 곳」 표시 (방법은 지시 없음) | 목차 widget의 `<script>` + `utils/findActiveHeadingId` | 위와 같은 이유 |
| (없음) | `primitives/layout`에 `Stack`(위아래 간격)과 `ShowOn`(화면 폭에 따라 보이기)을 더함 | 페이지가 widgets 사이 간격과 「넓은 화면에서만 옆 목차, 좁은 화면에서만 접는 목차」를 widgets를 고치지 않고 정할 수 있게 함 |
| (없음) | `shared/seo`를 더함 | 메타 · 구조화 데이터 · RSS 값을 만드는 함수가 여러 페이지에서 쓰여서, 페이지에 계산을 두지 않으려고 따로 둠 |
| (없음) | 소개 페이지(`/about/`)를 짧게 만듦 | A안 머리말에 「소개」 메뉴가 있어서, 링크가 404로 가지 않게 함. 내용은 시안의 소개 문장만 씀 |

## 2단계에서 더 바꾼 것 (2026-11-21, 디자인 시스템에 맞추기)

| 파일 | 바꾼 것 | 이유 |
| --- | --- | --- |
| `.claude/rules/design-system.md` | 새로 씀. `.astro` · `.tsx` · `.css`에 주입. 토큰만 쓰기, 색의 쓰임, 화면 폭 구간(767 · 768 · 1200px), 부품 목록, 포커스, `no-js`, `@design` 주석 형식 | 디자인 시스템 정본(`docs/design-system.md`)이 생겨서, 코드를 쓸 때 꼭 지킬 것만 요약해 주입함 |
| `.claude/rules/content-guide.md` | 글쓰기 정책을 빼고 정본(`docs/content-guide.md`)을 가리키는 요약으로 줄임. 스키마, 글에서 쓰는 부품 표, `shared/content` 함수 표만 남김 | 같은 내용이 두 곳에 있으면 어긋나므로 정본을 하나로 둠 |
| `.claude/rules/general-code-convention.md` | 스타일 절을 `design-system.md`로 넘기고, 속성을 펼치는 Astro 컴포넌트는 `data-astro-cid-*`를 거른다는 규칙, `@design` 주석, `no-js` 처리를 더함 | 2단계에서 실제로 부딪친 문제(부모 `.root` 규칙이 `IconButton`에 걸림)를 규칙으로 남김 |
| `.claude/rules/layout-pattern.md`, `seo-guide.md`, `test-strategy.md`, `component-abstract-pattern.md` | 폭 토큰 이름, `main#main`과 건너뛰기 링크, 이전 · 다음 글 · 댓글 자리, 새 h1 페이지, 비교할 시안 폴더(`design/exports-system/`)를 고침 | 코드가 바뀐 만큼 맞춤 |
| `CLAUDE.md` | 디자인 · 글쓰기의 정본 문서를 적고, 규칙 표에 `design-system.md`를 더함. 에이전트가 정본 문서를 고치지 않는다는 줄을 더함 | 정본이 생겼음 |

## 3단계에서 더 바꾼 것 (2026-11-21, 코드 칸과 정리된 디자인 값)

| 파일 | 바꾼 것 | 이유 |
| --- | --- | --- |
| `.claude/rules/layout-pattern.md`, `component-abstract-pattern.md` | 글 화면을 `PostHeader`(글 머리) · `PostBody`(본문)로 나누고, 페이지가 `WithAside`의 `top` 슬롯으로 놓는 방식을 적음. `PostArticle`의 `after-header` 슬롯 설명을 뺌 | 목차가 본문 첫 문단 높이에서 시작하려면 글 머리와 본문을 다른 줄에 놓아야 함. widget 안에서 맞추지 않고 페이지 배치로 해결함 |
| `.claude/rules/design-system.md` | 코드 칸 규칙(테마 · 가독성 값 · 대비 테스트 · D2Coding 부분 글꼴), 페이지 제목 `title` 단계를 더함 | 코드 칸이 확정됨 |
| `.claude/rules/content-guide.md` | 강조 줄 메타 `{3,5-6}`, 줄 번호 자동, `pnpm fonts:code`, 새 함수(`codeThemes` 등)를 더함 | 글을 쓸 때 알아야 할 코드 쪽 규칙 |
| `CLAUDE.md`, 스킬 | `pnpm fonts:code`와 `pnpm check`의 글꼴 검사, 폴더 나무의 `scripts/` · `styles/fonts/`를 더함 | 새 도구 |

## 4단계에서 더 바꾼 것 (2026-11-21, 글꼴 최적화와 1차 배포 준비)

| 파일 | 바꾼 것 | 이유 |
| --- | --- | --- |
| `scripts/buildFonts.ts`, `scripts/fonts/` | 새로 씀. `pnpm build`가 빌드 → 빌드 결과의 글자로 글꼴 세 개(Blog Sans · JetBrains Mono · Blog Code Hangul) 만들기 → 다시 빌드 → 빠진 글자 검사 순서로 돔. 글자 모으기와 이름 바꾸기는 순수 함수로 떼어 테스트함. 3단계의 `scripts/buildCodeFont.ts`와 `shared/content/collectCodeHangul`은 여기로 합침 | 글이 늘 때마다 글꼴을 손으로 다시 만들지 않게 하고, 빠진 글자가 있으면 배포 전에 빌드가 멈추게 함. 빌드 도구라 `src/`의 레이어 밖(`scripts/`)에 둠 |
| `vitest.config.ts` | `scripts/**/*.test.ts`를 테스트 대상에 더함 | 위 순수 함수의 단위 테스트 |
| `.claude/rules/design-system.md`, `content-guide.md` | 글꼴 파일을 손으로 고치지 않음, 굵기 400–800, 대체 글꼴 순서를 바꾸지 않음, 글을 쓴 뒤 바뀐 글꼴 파일을 함께 커밋함을 적음. `pnpm fonts:code`와 `collectCodeHangul` 줄을 뺌 | 글꼴 만드는 방식이 바뀜 |
| `.claude/rules/component-abstract-pattern.md` | `Document`가 상수를 직접 읽는 예외에 `SITE.verification`(검색 등록 확인 메타)을 더함 | 문서 머리의 메타는 페이지가 넘길 값이 아님 |
| `shared/constants/features` | 새로 둠. `IS_COMMENTS_ENABLED` | 1차 배포에서 댓글 자리를 설정 하나로 끄고 켬 |
| `.github/workflows/deploy.yml` | 새로 씀. main에 올라오면 타입 검사 · 단위 테스트 · 빌드(빠진 글자 검사 포함) 뒤 GitHub Pages 공식 액션으로 배포 | 1차 배포 준비 |
| `CLAUDE.md`, 스킬 | 명령 표(`pnpm build` · `pnpm fonts` · `pnpm fonts:check`), 배포 줄, 폴더 나무의 `scripts/fonts/` · `.github/` · `constants/features`를 고침 | 새 도구 |

## 5단계에서 더 바꾼 것 (2026-11-21, 소개 문구와 이력서, 포트폴리오)

| 파일 | 바꾼 것 | 이유 |
| --- | --- | --- |
| `.claude/rules/component-abstract-pattern.md` | 도메인에 `career`(이력서와 포트폴리오)를 더하고, 스위치로 켜고 끄는 고정 주소 페이지를 `pages/{주소}/[...path]/index.astro` + `getSwitchPagePaths`로 만든다는 줄을 더함 | 고정 주소 페이지는 `getStaticPaths`를 쓸 수 없어서, 공개 전 페이지를 배포 빌드에서 빼려면 나머지 매개변수 폴더가 필요함 |
| `.claude/rules/seo-guide.md` | h1 목록에 `Resume`과 `Portfolio`, 구조화 데이터 표에 소개의 ProfilePage, 글쓴이 Person을 한 함수로 만든다는 줄, 스위치가 꺼진 페이지는 사이트맵에 없다는 줄을 더함 | 소개 페이지를 BlogPosting의 author가 가리키므로 같은 Person으로 묶음 |
| `.claude/rules/shared-layer.md` | `routes`에 `getNavItems`와 `getSwitchPagePaths`, `constants`에 `features`와 `career`, `seo`에 ProfilePage와 Person을 적음 | 새 shared 코드 |
| `.claude/rules/design-system.md` | 인쇄 규칙(밝은 값 고정, 머리말과 꼬리말 숨김, `Container` 여백 풀기, 이력서 인쇄는 정본 7.23)을 더함 | 이력서를 종이로 뽑을 일이 생김 |
| `.claude/skills/project-structure/SKILL.md` | 폴더 나무에 이력서와 포트폴리오 페이지, `routes/getSwitchPagePaths`, `constants/career`, `types/career.ts`를 더함 | 새 파일 |

## 6단계에서 더 바꾼 것 (2026-11-21, 2차 작업: 노션 댓글과 PostHog 중계)

| 파일 | 바꾼 것 | 이유 |
| --- | --- | --- |
| `worker/` | 새로 둠. Cloudflare Worker(Hono)와 그 시험, 노션 표 만들기 · 가짜 노션 서버 스크립트. 블로그와 따로 설치하는 패키지(`worker/package.json`, 자기 lockfile) | Worker는 블로그 빌드와 다른 실행 환경(workerd)이고 배포도 따로라서, `src/`의 레이어 규칙 밖에 둡니다. 블로그의 GitHub Pages 배포가 wrangler를 설치하지 않게 pnpm workspace로 묶지 않았습니다 |
| `tsconfig.json` | `exclude`에 `worker` | Worker는 Cloudflare 타입을 써서 블로그의 `astro check`와 따로 검사합니다(`pnpm check:worker`) |
| `package.json` | `test:worker`, `check:worker`, `test:all` | 루트에서 블로그와 Worker 시험을 한 번에 돌리는 방법 |
| `astro.config.ts`, `scripts/EmptyPart.astro` | 설정 값이 비어 있으면 `./ui/CommentSection.astro` · `./ui/AnalyticsScript.astro`를 빈 부품으로 바꾸는 별칭(alias) | Astro는 그리지 않는 부품이라도 import되어 있으면 CSS와 스크립트를 빌드 결과에 넣고, 글꼴 만들기가 그 글자까지 모읍니다. 1차 배포 상태의 빌드에 댓글 · PostHog 코드가 실리지 않게 합니다 |
| `shared/constants/services` | 새로 둠. `WORKER_URL`, `TURNSTILE_SITE_KEY`, `POSTHOG_PROJECT_KEY`, `POSTHOG_RELAY_PATH`, `POSTHOG_UI_HOST`, `SESSION_REPLAY_SAMPLE_RATE` | 바깥 서비스 설정을 한곳에. seo-guide가 적었던 「중계 주소는 `shared/constants/site`」 대신 따로 뒀습니다(사이트 정보와 바뀌는 까닭이 다름) |
| `shared/utils/isCommentsReady`, `shared/utils/shouldLoadAnalytics` | 새로 둠 | 댓글 위젯 · `Document` · 개인정보 안내 · `astro.config.ts`가 같은 판단을 씁니다. `astro.config.ts`는 `@/` 별칭을 못 쓰므로 import가 없는 순수 함수로 둡니다 |
| `widgets/post/Comments` | 자리만 그리던 칸을 노션 댓글 화면으로 바꿈. `slug`를 받음. `model/mountComments.ts`에 댓글 동작 코드 | 댓글 코드를 동적 import로 나눠 첫 화면에 싣지 않으려고, `.astro` 스크립트의 상태 · DOM 코드를 `model`에 뒀습니다(세그먼트 규칙에 이 경우를 더함). 판단 로직은 `utils`에서 단위 시험합니다 |
| `primitives/layout/Document` | `ui/AnalyticsScript.astro`(PostHog 늦게 불러오기), `utils/createPosthogConfig` · `isSessionSampled` | seo-guide대로 `Document` 안에 한 번만 둡니다. `Document`가 서비스 상수와 `shared/utils`를 읽는 것은 문서 뼈대의 일이라 예외에 더함 |
| `widgets/site/PrivacyNotice` | 댓글 · 방문 통계 문단을 설정 값이 있을 때만 보임 | 기능을 켜기 전과 뒤 모두 안내가 실제와 같게 |
| `docs/design-system.md` | 7.21을 댓글 칸 부품(목록, 「글쓴이」 표시, 쓰기 칸, 남기기 단추, 글자 단추)으로 고치고, 10장 바깥 스크립트 줄과 12장 부록에 Pencil 미반영을 적음 | 오케스트레이터 지시(새 부품은 문서에 기록). Pencil과 `design/` PNG는 고치지 않았습니다 |
| `docs/worker.md`, `docs/deploy-phase2.md` | 새로 씀 | Worker 구조 · 노션 표 칸(세컨드 브레인도 읽음) · 무료 한도, 이스타가 따라 할 배포 순서 |
| `.gitignore` | `.wrangler/`, `.dev.vars*`(예시 파일 빼고), `.env*` | Worker 로컬 상태와 로컬 비밀값 |

## 7단계에서 더 바꾼 것 (2026-11-21, 2차 작업: 공유 미리보기 그림, llms.txt, IndexNow)

| 파일 | 바꾼 것 | 이유 |
| --- | --- | --- |
| `shared/seo/createOgImage`, `pages/posts/[slug]/og.png.ts`, `pages/[...page]/og.png.ts` | 빌드할 때 글마다 1200×630 PNG를 그리고, 글이 아닌 페이지는 사이트 기본 그림(`/og.png`)을 씀. 이력서와 포트폴리오는 페이지가 있을 때만 자기 그림을 만듦 | `docs/plan.md`의 「글별 og:image」. satori(배치)와 sharp(PNG)를 개발 의존성으로 더했습니다. sharp는 Astro가 이미 쓰는 판과 같습니다 |
| `shared/seo/getOgImage`, `getPageOgCards`, `createPageMeta`, `Document` | og:image와 너비, 높이, 형식, 설명, `twitter:card` `summary_large_image`, twitter:image를 그림. og:title과 twitter:title에서 사이트 이름을 뺌 | `docs/content-guide.md` 2.1(og:title에는 사이트 이름을 붙이지 않음)과 6.2. 어떤 페이지가 자기 그림을 갖는지는 `getPageOgCards` 한곳에서 정하고 메타와 그림 엔드포인트가 같은 목록을 봅니다 |
| `shared/constants/features`의 `IS_PORTFOLIO_SHOWN` | 포트폴리오 그림과 llms.txt가 볼 값 하나를 둠. 지금은 `IS_RESUME_SHOWN`과 같음 | 이스타가 포트폴리오를 이력서보다 먼저 공개하기로 정했고(2026-11-21), 포트폴리오를 스위치에서 떼는 작업과 합칠 때 이 줄만 `true`로 바꾸면 됩니다 |
| `shared/content/splitTitle` | `widgets/post/PostHeader/utils`에서 옮김 | 글 머리와 공유 그림이 같은 규칙(첫 `: ` 뒤에서 줄을 나눔)을 써서, 컴포넌트 이름이 없는 함수라 shared로 내렸습니다 |
| `shared/content/readPostOgImage` | 글 폴더의 `og.png`가 있으면 그 그림을 쓰고 크기를 검사함 | `docs/content-guide.md` 6.2의 「직접 만든 그림이 있으면 글 폴더의 og.png」 |
| `shared/seo/createLlmsTxt`, `pages/llms.txt.ts`, `Document`의 `rel="describedby"` | llms.txt(규격 v2)를 만듦 | `docs/plan.md`의 llms.txt |
| `scripts/buildFonts.ts` | llms.txt의 글자를 사이트 글꼴에 넣지 않음 | 화면에 그리지 않는 글이라 넣으면 글꼴만 커집니다 |
| `scripts/indexNow.ts`, `scripts/indexNow/`, `public/{키}.txt`, `.github/workflows/deploy.yml` | 배포 뒤 글이 바뀐 페이지를 IndexNow로 알림 | 새 글을 검색 엔진이 사이트맵을 다시 읽기 전에 알 수 있게 합니다. 워크플로는 로컬에서 돌릴 수 없어서 고르는 부분을 순수 함수로 떼어 시험합니다 |
| `vitest.config.ts` | `css.include`에 `tokens.css` | vitest는 CSS를 빈 글로 불러와서, 공유 그림이 `?raw`로 읽는 색 토큰을 시험에서도 읽게 했습니다 |
| `.claude/rules/seo-guide.md`, `shared-layer.md`, `content-guide.md`, 스킬 | 공유 그림, llms.txt, IndexNow 절과 새 함수, 폴더 나무를 더함 | 코드가 바뀐 만큼 맞춤 |

## 8단계에서 더 바꾼 것 (2026-11-21, 이름 표기, 포트폴리오 공개, 관련 글)

| 파일 | 바꾼 것 | 이유 |
| --- | --- | --- |
| `shared/constants/features`의 `IS_PORTFOLIO_SHOWN` | `true`로 바꾸고, 포트폴리오 페이지, 머리말 메뉴, 소개 링크, 이력서 연락처의 포트폴리오 링크, 글 끝의 「이 글과 이어진 프로젝트」, 사이트맵, 공유 그림, llms.txt가 모두 이 값 하나를 보게 함 | 이스타가 포트폴리오를 이력서와 따로 바로 공개하기로 정함. 공개 판단을 한곳에 둠 |
| `.claude/rules/seo-guide.md` | 이력서 h1을 「이스타(김동성)」으로, 글쓴이 Person을 name 「김동성」과 alternateName 「이스타」로 적고, 이메일과 전화번호는 넣지 않는다고 적음. 사이트맵 줄의 포트폴리오를 `IS_PORTFOLIO_SHOWN`으로 고침 | 이스타가 본명을 함께 쓰기로 정함 |
| `.claude/rules/component-abstract-pattern.md` | 스위치로 켜고 끄는 고정 주소 페이지가 이력서(`IS_RESUME_SHOWN`)와 포트폴리오(`IS_PORTFOLIO_SHOWN`)라고 적음. features 예에 `post/RelatedPostLinks`, `post/PostProjectLinks`를 더함 | 스위치가 둘로 나뉨, 새 features |
| `.claude/rules/shared-layer.md` | `routes`에 `getPortfolioProjectPath`, `content`에 `getPostsBySlugs`, `constants/career`에 프로젝트 id 목록을 적음 | 새 shared 코드 |
| `.claude/rules/content-guide.md` | 글 앞머리 `projects` 칸, 이력서와 포트폴리오의 `relatedPostSlugs`, `getPostsBySlugs`와 `findPostsBySlugs`를 적음 | 글과 이력서, 포트폴리오를 서로 잇는 구조. 정본 `docs/content-guide.md` 1장 표에는 `projects`가 아직 없어 보고함 |
| `.claude/rules/design-system.md` | 「관련 글」 링크와 「이 글과 이어진 프로젝트」가 정본 7.25, 7.26에 있다는 줄을 더함 | 새 화면 요소 |
| `.claude/skills/project-structure/SKILL.md` | 폴더 나무의 포트폴리오 페이지 설명, `getPortfolioProjectPath`, `constants/career`의 id 목록을 고침 | 코드가 바뀐 만큼 맞춤 |
| `src/content.config.ts` | `projects` 칸이 `shared/constants/career`의 id만 받음(`@/` 별칭으로 불러옴) | 없는 프로젝트를 적으면 빌드가 멈춰서 깨진 링크가 배포되지 않게 함 |
| `shared/seo/getPageOgCards`, `shared/seo/createLlmsTxt` | 이력서와 포트폴리오 그림의 이름 줄과 설명을 `SITE.author.displayName`(「이스타(김동성)」)으로, llms.txt 「글쓴이」 절의 소개 설명에 같은 이름을 넣음. 그림의 사이트 이름 줄은 그대로 둠 | 이력서 머리와 같은 이름 표기 |
