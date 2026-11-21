---
description: 코드 작성 시 지켜야 하는 전역 규칙(네이밍, 타입, Astro·React 컴포넌트 작성, 스타일, JavaScript 보내기) 가이드라인
paths:
  - "src/**/*.astro"
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

## 네이밍

### 폴더 및 파일명

- 폴더명: `camelCase`
  - **예외: `src/pages` 하위의 라우트 폴더는 URL 경로를 그대로 반영하므로 `kebab-case` 허용** (e.g. `pages/posts/[slug]`). Astro 라우팅 규약용 이름(`[slug]`, `404.astro`, `rss.xml.ts`)도 그대로 사용.
- 파일명:
  - 컴포넌트 파일: 컴포넌트 폴더의 구현체는 `index.astro`. 움직이는 칸 중 React로 만드는 것만 `index.tsx`. 세그먼트 `ui` 안의 서브 컴포넌트는 `PascalCase` + `.astro`(`.tsx`)
  - 컴포넌트 외 파일: `camelCase` + `.ts`
  - React 컴포넌트의 스타일: 같은 이름의 CSS Modules 파일을 옆에 둠 (e.g. `index.tsx` + `index.module.css`, `ui/PipelineStep.tsx` + `ui/PipelineStep.module.css`)
- 인덱스(`index.ts`, `index.astro`, `index.tsx`)를 제외한 나머지는 폴더 + `index` 형태로 두되, 테스트 파일(`test.ts`, 컴포넌트 통합 테스트는 `test.ts(x)`)은 예외로 일반 파일로 둠
- **컴포넌트 폴더의 세그먼트(`ui`/`model`/`utils`/`types`/`constants`/`context`) 내부는 예외**: 폴더 + `index`를 다시 쓰지 않고 구현체 이름의 플랫 파일로 둠 (e.g. `ui/CodeBlock.astro`, `model/useRenderingPipeline.ts`, `constants/pipeline.ts`). 단위 테스트는 `utils/getStepStates.test.ts`처럼 구현 파일 옆에 둠. `shared` 레이어는 기존대로 폴더 + `index.ts`
- 타입 파일은 항상 `types/` 폴더로 감싸고, `index.ts` 없이 내용을 나타내는 이름으로 분리:

  ```
  src/modules/widgets/post/TableOfContents/types/
  └── toc.ts
  ```

### 변수 및 함수명

- 함수명: `camelCase` (작명 방식은 유연하게)
- 변수명: `camelCase`
  - Boolean 타입은 `is`로 시작 (`isOpen`, `isAsideSticky`)
  - 여러 요소를 담는 경우 `s` 접미사 (`posts`)
  - UI가 리스트 형태인 경우 `List` 접미사 (`PostList`)
- 커스텀 훅(React 섬 안에서만): `use` + 훅 이름 (`useRenderingPipeline`)
- 컨텍스트(React 섬 안에서만): 이름 + `Context`

### 핸들러 함수

- **props로 전달되는** 핸들러: `on`으로 시작 (`onChange`, `onPlayToggle`)
- **컴포넌트 내부** 핸들러: `handle`로 시작 (`handleClick`, `handleSliderChange`). `.astro`의 `<script>` 안에서도 같음

### 스타일(레이아웃) 요소 네이밍

Astro 범위 스타일의 클래스와 CSS Modules 클래스에 똑같이 적용함.

- `root`: 컴포넌트의 **최상위 요소**이면서 **1개**의 요소만을 감쌀 때 (슬롯 하나를 감싸는 경우 포함)
- `container`: **2개 이상**의 요소를 감쌀 때
- `wrapper`: **1개**의 요소를 감쌀 때
- 최상위 요소가 2개 이상을 감싸면 `root`가 아니라 `container`를 사용. `root`와 `wrapper`가 모두 해당하면 `root` 우선

## 상수

- 상수: `SNAKE_CASE`
- 함수 **내부** 상수: `camelCase`

## 타입

- `any` 금지
- **type vs interface**: 객체는 `interface`, 나머지는 `type`
- `class`는 쓰지 않음
- **리턴 타입은 명시하지 않음** — 거의 100% 추론되므로 타입 시스템에 맡김
  - 문맥 타입이 필요하면(예: Shiki transformer의 `this`) 리턴 타입 대신 초기값에 타입을 붙임: `const transformer: ShikiTransformer = { ... }; return transformer;`
- 초기값에 타입을 지정해 타입 시스템이 알아서 추론하도록 둠 (타입스크립트를 자바스크립트처럼 쓰기)
- 컴포넌트 props 타입
  - React 컴포넌트: `컴포넌트명 + Props` **인터페이스**
  - Astro 컴포넌트: **`interface Props`**. Astro가 이 이름으로 컴포넌트의 props 타입을 읽기 때문에 이름을 바꾸지 않음

  ```astro
  ---
  interface Props {
    slug: string;
  }

  /** 글 한 편입니다. */
  const { slug } = Astro.props;
  ---
  ```

- 훅·함수의 인자 타입: `함수명 + Params` **인터페이스**

## 컴포넌트 · 훅 · 함수 작성

- React 컴포넌트는 `export default function` 형식으로 구현
- Astro 컴포넌트는 frontmatter(`---` 사이)의 JSDoc으로 **무엇을 하는 컴포넌트인지 한두 줄**을 둠. 템플릿의 HTML 주석(`<!-- -->`)은 빌드 결과물에 그대로 나가므로 쓰지 않음
- 슬롯이 있으면 JSDoc에 슬롯 이름과 쓰임을 적음
- Pencil 시안에 대응하는 부품이면 JSDoc에 `@design design/blog.pen 「프레임 이름」 id`를 적음 (`.claude/rules/design-system.md`의 「디자인과 코드 잇기」)
- 함수는 화살표 함수로 만들고 `export default`로 내보냄. 한 파일에서 테스트용으로 더 내보낼 것이 있으면 이름 붙인 내보내기를 더함
- 커스텀 훅은 `use*`로 시작하고 **객체 반환** (배열 X — 확장성)
- 파라미터가 **2개 이상**일 때는 객체 구조 분해로 받기

  ```ts
  const formatDate = ({ date, format }: FormatDateParams) => {};
  ```

## 주석

- JSDoc은 무엇을 하는지·쓰임새를 설명함. 코드 안 인라인 주석은 코드로 드러나지 않는 이유·제약만 적고, 코드를 다시 말하지 않음.
- 두 곳이 같은 값을 맞춰야 하면 양쪽에 서로를 가리키는 주석을 둠 (e.g. `getPreviewStyle.ts`의 `BOX_SIZE`와 `PreviewBox.module.css`의 `.box` 폭)

## 스타일

- Astro 컴포넌트는 같은 파일의 범위 `<style>`로, React 컴포넌트는 옆의 `.module.css`로 작성
- 값(색·글자·간격·모서리·움직임)과 화면 폭 구간은 `.claude/rules/design-system.md`(정본 `docs/design-system.md`)를 따름. 토큰만 쓰고 하드코딩하지 않음
- **Tailwind CSS와 CSS-in-JS는 사용하지 않음.** 전역 클래스는 `shared/styles/base.css`의 `.visually-hidden`과 Document가 붙이는 `no-js`만 둠
- 자식 컴포넌트가 그리는 요소(예: `Icon`)에는 부모의 범위 속성이 붙지 않으므로 `.부모클래스 :global(.자식클래스)`로 고름
- 남은 속성을 펼치는(`{...rest}`) Astro 컴포넌트는 `data-astro-cid-*`를 걸러서 펼침. Astro가 부모의 범위 속성도 넘겨서, 그대로 펼치면 부모의 같은 이름 클래스(`.root`) 규칙이 자식에 걸림 (`IconButton` 참고)
- 본문(MDX)처럼 다른 곳이 그린 요소를 꾸밀 때는 `.body > :global(p)`처럼 바로 아래 요소만 골라, 끼워 넣은 컴포넌트로 규칙이 새지 않게 함
- 반응형
  - widgets·features·composites 안에서는 **container query를 먼저 씀**. 컴포넌트는 자기가 어떤 폭의 틀에 놓일지 가정하지 않음
  - 화면 폭 미디어 쿼리는 `pages`, `primitives/layout`, `tokens.css`에서 씀

## JavaScript 보내기

기본은 JavaScript를 보내지 않음. 움직이는 칸만 아래 둘 중 하나로 살림.

| 경우 | 방법 | 예 |
| --- | --- | --- |
| 상태가 작고 DOM 몇 개만 바꾸는 동작 | `.astro`의 `<script>`. 판단 로직은 `utils`로 떼어 단위 테스트 | `ThemeToggle`, `CopyCodeButton`, 목차의 지금 읽는 곳 |
| 상태가 여럿이고 화면을 다시 그리는 데모 | React 컴포넌트(`index.tsx`) + `client:visible` | `RenderingPipelineDemo` |

- React 섬은 처음 그림을 서버에서 만들어 두므로, 서버 HTML과 첫 클라이언트 그림이 같아야 함. 인라인 `style`에 CSS 변수(`--x`)를 넣으면 하이드레이션 경고가 나므로 일반 속성(`width` 등)을 씀
- 첫 그림 전에 꼭 돌아야 하는 코드(테마, `no-js` 클래스 지우기)는 `Document`의 `is:inline` 스크립트만 씀
- JavaScript가 꺼지면 누를 수 없는 단추는 `:global(.no-js)`로 숨기고, 필요하면 안내를 보임 (`ThemeToggle`, `DemoFrame`)

## 임포트 경로

- 경로 별칭 `@/*`(= `src/*`)을 사용하고 상대경로 남용 금지
  - 상대 경로는 본인보다 하위 디렉토리 혹은 같은 디렉토리 내에서만 가능
    (절대 경로와 상대 경로는 줄바꿈 2번으로 구분)
  - 예외: `astro.config.ts`는 별칭을 읽기 전에 불러오므로 `./src/...` 상대 경로를 씀

  ```astro
  ---
  // e.g. src/modules/widgets/post/PostBody/index.astro
  import Callout from "@/shared/components/primitives/ui/Callout/index.astro"; // ✅

  import CodeBlock from "./ui/CodeBlock.astro"; // ✅ 같은 디렉토리(하위) 내에서만 상대경로 허용
  ---
  ```
