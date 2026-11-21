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
