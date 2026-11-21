---
paths:
  - "src/shared/**"
description: shared 레이어의 최상위 구성(components / content / seo / hooks / routes / utils / constants / types / styles)과 각 폴더의 역할, 네이밍·의존 규칙 가이드라인. shared에 코드 생성·배치·이동 전 필독.
---

# shared 레이어 가이드라인

**`shared`는 특정 도메인 컴포넌트에 강결합되지 않아 프로젝트 어디서든 쓸 수 있는 코드를 모아두는 레이어.** 이 문서는 shared의 최상위 구성과 각 폴더의 역할을 정의함. 코드를 shared로 내릴지 판단하는 세부 기준은 `project-structure` 스킬 참고.

폴더 구조는 '변경에 유연함'을 판단 근거로 잡았기 때문에, 아래 모든 규칙은 "코드가 어떤 이유로 함께 바뀌는가"를 따라 결정됨.

## 세그먼트와의 구분

`shared` 최상위 폴더 구성은 shared 레이어 자체의 구성이며, 컴포넌트 폴더 내부를 역할별로 나누는 세그먼트(`ui` / `model` / `utils` / `types` / `constants` / `context`)와는 별개 개념.

- 컴포넌트 세그먼트의 내용물 → 해당 컴포넌트 내부 전용
- `shared`의 폴더 → 프로젝트 전역 공용

세그먼트 규칙은 `.claude/rules/segment-pattern.md` 참고.

## 최상위 구성

| 폴더         | 역할                                                                                                                                                                       | 세부 규칙                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `components` | 도메인 로직을 다루지 않는 공통 컴포넌트. `composites`(ui 로직 포함) / `primitives`(ui만, `ui` · `layout` · `animation`으로 분류). HTML 뼈대 `Document`도 `primitives/layout`에 둠 | `.claude/rules/component-abstract-pattern.md`, `.claude/rules/component-colocation-pattern.md`, `.claude/rules/layout-pattern.md` |
| `content`    | 콘텐츠 모음을 읽어 화면용 값으로 바꾸는 함수(글 목록, 글 하나, 본문 그리기, 시리즈, 읽는 시간)와 마크다운 처리용 Shiki transformer                                            | `.claude/rules/content-guide.md`                                                                                                   |
| `seo`        | 문서 메타(`createPageMeta`), 구조화 데이터(BlogPosting, BreadcrumbList), RSS 항목을 만드는 함수                                                                                | `.claude/rules/seo-guide.md`                                                                                                       |
| `hooks`      | React 섬에서 쓰는 훅 중 특정 컴포넌트에 강결합되지 않은 것. `domain` / `common`. 필요할 때 만듦                                                                              | `.claude/rules/hook-guide.md`                                                                                                      |
| `routes`     | 고정 주소(`PATHS`), 글 주소 함수(`getPostPath`), 머리말 메뉴(`NAV_ITEMS`), 페이지 안 자리 id                                                                                 | —                                                                                                                                  |
| `utils`      | 전역 공용 유틸 함수. 폴더 + `index.ts`, 단위 테스트는 같은 폴더의 `test.ts`                                                                                                   | `.claude/rules/test-strategy.md`                                                                                                   |
| `constants`  | 전역 공용 상수 (사이트 정보, 테마 저장 키)                                                                                                                                     | —                                                                                                                                  |
| `types`      | 전역 공용 타입. `types/post.ts`처럼 내용을 나타내는 이름으로 분리                                                                                                             | —                                                                                                                                  |
| `styles`     | 디자인 기준값(`tokens.css`), 기본 스타일(`base.css`), 글꼴과 둘을 묶는 `index.css`. `Document`가 `index.css`를 불러옴                                                        | `.claude/rules/general-code-convention.md`의 「스타일」                                                                            |

서버가 없는 정적 블로그이므로 `api`(HTTP 계층), `provider`, `store`는 두지 않음.

## 네이밍

- `shared`는 폴더 + `index.ts(x)` 코로케이션을 그대로 씀. (예: `utils/formatDate/index.ts`, `content/getPosts/index.ts`, `seo/createPageMeta/index.ts`) 세그먼트 내부의 플랫 파일 규칙은 shared에 적용하지 않음.
  - 예외: `styles`는 CSS 파일이라 `styles/tokens.css`처럼 플랫 파일로 둠.
- 단위 테스트는 구현 폴더 안에 `test.ts`로 둠. (예: `utils/formatDate/index.ts` + `utils/formatDate/test.ts`)
- 타입은 `types/` 폴더 안에 `types/post.ts`처럼 내용을 나타내는 이름으로 분리. (`types.ts` 단일 파일 · `types/index.ts`는 쓰지 않음)
- 네이밍은 카멜(파스칼 포함)로 통일. 케밥 케이스는 쓰지 않음.

## 코드를 shared/ 로 내리는 기준

`shared`에 둘지 컴포넌트 폴더(세그먼트)에 둘지는 사용 횟수("지금은 여기서만 쓴다")가 아니라 **컴포넌트와의 강결합 여부**로 판단. 세부 판단 기준은 `project-structure` 스킬의 「코드를 shared로 내리는 기준」이 원본.

## Routes

- 주소 문자열은 컴포넌트에 직접 쓰지 않고 `shared/routes`의 `PATHS`, `getPostPath`로 만듦. 글 주소 규칙(`/posts/글-이름/`)이 바뀌어도 한 곳만 고침.
- 주소 끝의 `/`는 `astro.config.ts`의 `trailingSlash: "always"`와 맞춤.
- 다른 페이지의 구획으로 가는 링크(예: `/#series`)의 id도 `routes`에 상수로 두고, 그 구획을 그리는 widget이 같은 상수를 씀.

## 의존 규칙

- `shared`의 코드는 특정 도메인 컴포넌트에 강결합되지 않아 프로젝트 어디서든 쓸 수 있어야 함.
- `shared`는 `modules`를 import하지 않음.
- `astro:content`는 `shared/content`에서만 import함. 다른 곳은 `shared/content` 함수를 부름.
- `astro:content`를 부르는 함수는 vitest에서 돌지 않으므로, 바꾸는 계산은 순수 함수(예: `groupPostsByYear`, `toSeriesList`)로 떼어 단위 테스트함.
