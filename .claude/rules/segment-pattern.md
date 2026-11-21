---
paths:
  - "src/modules/**"
  - "src/shared/components/**"
description: 컴포넌트 폴더(widgets·features·composites) 내부 세그먼트(ui / model / utils / types / constants / context)의 정의와 배치·의존 규칙 가이드라인. 세그먼트 코드 생성·배치·이동 전 필독.
---

# 세그먼트 패턴 가이드라인

**세그먼트란 컴포넌트 폴더(widgets·features·composites) 내부를 역할별로 나누는 하위 폴더 구획**. 이 문서는 그 세그먼트의 정의와 배치·의존 규칙을 정의함.

세그먼트는 `shared` 최상위 폴더 구성(`components`, `content`, `seo`, `hooks`, `routes`, `utils`, `constants`, `types`, `styles`)과 별개 개념. `utils`·`types`·`constants`처럼 이름이 겹치는 폴더가 있어도, 세그먼트의 내용물은 해당 컴포넌트 내부 전용이고 `shared`의 폴더는 프로젝트 전역 공용. shared 레이어의 구성은 `.claude/rules/shared-layer.md`, 코드를 shared로 내리는 기준은 `project-structure` 스킬 참고.

폴더 구조는 '변경에 유연함'을 판단 근거로 잡았기 때문에, 아래 모든 규칙은 "코드가 어떤 이유로 함께 바뀌는가"를 따라 결정됨.

## 세그먼트 정의

features, widgets, composites 레이어의 세그먼트는 `ui`, `model`, `utils`, `types`, `constants`로 통일하며, 필요 시 `context`를 선택적으로 추가. 콘텐츠를 읽는 코드는 세그먼트가 아니며 `shared/content`에서 관리.

`primitives`와 `pages`는 세그먼트를 강제하지 않음. 다만 필요해지면 동일한 세그먼트 규칙을 그대로 적용. (예: `primitives/ui/Icon/constants/iconPaths.ts`)

세그먼트는 항상 폴더로 두되, **세그먼트 내부에서는 폴더 + `index` 코로케이션을 다시 쓰지 않고 구현체 이름의 플랫 파일로 둠**. (예: `utils/getListRanges.ts` ✅ / `utils/getListRanges/index.ts` ❌)

- `ui` : 서브 컴포넌트. `ui/CodeBlock.astro`, `ui/DocumentRows.tsx`처럼 플랫 파일로 둠. React 서브 컴포넌트의 스타일은 `ui/DocumentRows.module.css`처럼 옆에 둠.
- `model` : 해당 컴포넌트에 강결합된 React 훅·상태 로직. `model/useVirtualList.ts`처럼 플랫 파일로 둠. (`hooks` 폴더는 `shared` 전용이므로 컴포넌트 폴더에는 만들지 않음) `.astro` 컴포넌트에는 상태가 없으므로 `model`이 생기지 않음.
- `utils` : 유틸 함수. `utils/findActiveHeadingId.ts`와 `utils/findActiveHeadingId.test.ts`(단위 테스트)를 나란히 코로케이션. `.astro`의 `<script>`가 쓰는 판단 로직도 여기에 둠.
- `types` : 타입. 항상 `types/` 폴더로 두고, `types/virtualList.ts`처럼 내용을 나타내는 이름의 파일로 나눔. (`types.ts` 단일 파일·`types/index.ts`는 쓰지 않음)
- `constants` : 상수. `constants/virtualList.ts`처럼 플랫 파일로 둠.
- `context` (선택, React 섬 전용) : 특정 컴포넌트 전용 컨텍스트. Provider(JSX)를 함께 작성하므로 `context/demoContext.tsx`처럼 `.tsx` 플랫 파일로 둠.

## model 세그먼트 — 강결합된 훅만 둠

`model`에는 **해당 컴포넌트와 강결합된 훅·상태 로직**만 둠. 사용 횟수("지금은 여기서만 쓴다")는 판단 근거로 삼지 않음.

> **"훅이 컴포넌트와 강결합되어 있다"의 정의**
> 훅이 바뀔 수 있는 원인이 컴포넌트에 있어서, 컴포넌트 UI가 바뀔 때 훅도 같이 바뀔 확률이 매우 높은 상태.

- 컴포넌트의 렌더 구조·Context·로컬 state에 구조적으로 묶여 있으면 `model`에 코로케이션.
- 도메인 값만 주고받아 다른 화면에 이식 가능하면, 지금 한 곳에서만 쓰이더라도 `shared/hooks`에 둠.
- 강결합 여부의 세부 판단 기준(이름·인자·반환값·다른 화면 이식 테스트)은 `project-structure` 스킬의 「코드를 shared로 내리는 기준」이 원본.

## 콘텐츠 코드의 위치

콘텐츠 모음(`astro:content`)을 읽는 함수는 컴포넌트 폴더에 두지 않음. 글 목록·글 하나·본문 그리기·시리즈 같은 함수는 모두 `shared/content`에서 관리하며, 작성 규칙은 `.claude/rules/content-guide.md` 참고.

## context 세그먼트

- `createContext`, `useContext`, `Provider` 세 가지는 파편화를 막기 위해 한 파일 안에 함께 작성.
- 특정 React 섬에서만 쓰이는 컨텍스트는 해당 컴포넌트 폴더의 `context` 세그먼트에 코로케이션.
- 전역 Provider는 두지 않음. React 섬은 서로 따로 하이드레이션되어 공통 Provider로 감쌀 수 없음.

## 테스트 위치

자동화 테스트는 단위·통합·E2E 세 가지만 가져감.

| 종류        | 위치                                                                                                                   | 대상                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 단위 테스트 | `utils` 세그먼트 안에 구현 파일과 `*.test.ts`를 나란히 코로케이션 (예: `utils/getListRanges.ts` + `utils/getListRanges.test.ts`) | 유틸 함수 (훅은 테스트하지 않음)            |
| 통합 테스트 | 최종 책임 컴포넌트(대부분 widgets) 폴더 안의 `test.ts(x)`                                                                 | 콘텐츠를 읽어 화면에 그리기까지 한 구획 전체 |
| E2E 테스트  | 전역 `src/__test__/`에 페이지 이름을 붙인 파일(`postPage.test.ts`)                                                      | 페이지 단위 수행 권장                       |

## 의존 규칙

- 컴포넌트 폴더의 세그먼트 내용물은 해당 컴포넌트 내부에서만 사용. 외부에 공개하는 것은 `index`뿐. (`.claude/rules/component-colocation-pattern.md` 참고)
- widgets·features의 세그먼트 코드는 다른 도메인 컴포넌트에서 사용하지 않음. 도메인이 겹치는 상황에서는 컴포넌트를 재사용하지 않고, 도메인 로직을 `shared/content` 함수나 `shared/hooks/domain` 훅으로 내려서 재사용.
