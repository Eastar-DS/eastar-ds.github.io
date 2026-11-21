---
paths:
  - "src/modules/**"
  - "src/shared/components/**"
description: 컴포넌트가 지켜야 하는 폴더/index.astro(index.tsx) 방식의 colocation 패턴을 정의한 가이드라인. 컴포넌트 생성·수정·리팩토링·코드리뷰 전 필독.
---

# 컴포넌트 콜로케이션 패턴 가이드라인

이 문서는 블로그의 모든 컴포넌트가 지켜야 하는 컴포넌트 콜로케이션 패턴을 정의함.

## 핵심 원칙

모든 컴포넌트는 추상화 레벨과 무관하게 아래의 콜로케이션 패턴을 지켜야 함.
각 컴포넌트는 자신의 폴더를 가지며, 해당 폴더 내 `index.astro`(React 섬은 `index.tsx`) 파일이 컴포넌트의 메인 구현임.

컴포넌트에서 사용되는 서브 컴포넌트, 상태 로직, 유틸, 타입, 상수, 스타일 등은 모두 해당 컴포넌트 폴더 내에 위치해야 함.

`index` 파일에서 컴포넌트의 메인을 구현하며, 다른 파일들은 컴포넌트 내부에서만 사용.

코로케이션의 목적은 응집도. 같이 변하는 코드를 함께 묶어두면 해당 위치의 코드를 1개의 이유로만 수정하게 되고, 내부 로직 수정 시 영향 범위를 폴더 구조만 보고도 알 수 있음.

### 세그먼트

컴포넌트 폴더 내부는 `ui` / `model` / `utils` / `types` / `constants` 세그먼트로 나누며, 필요 시 `context`를 선택적으로 추가.
콘텐츠를 읽는 함수는 세그먼트가 아니므로 컴포넌트 폴더에 두지 않고 `shared/content`에 둠.

**각 세그먼트의 정의와 판단 기준·의존 규칙은 `.claude/rules/segment-pattern.md` 참고.**
`hooks` 폴더는 `shared` 전용이므로 컴포넌트 폴더 내부에는 만들지 않고, 해당 컴포넌트에 강결합된 훅은 `model`에 둠.

### 네이밍 규칙

- 컴포넌트 폴더명은 구현체 이름으로 짓고, 구현체 파일은 `index.astro` 또는 `index.tsx`로 통일. (예: `Chip/index.astro`, `DemoFrame/index.tsx`)
- 네이밍은 카멜(파스칼 포함)로 통일. (예: `site`, `SiteHeader`)
- 폴더 + `index` 형태는 컴포넌트 폴더 자체에만 적용. **세그먼트 내부에서는 폴더 + `index`를 다시 쓰지 않고 구현체 이름의 플랫 파일로 둠.**
  - 서브 컴포넌트·훅·유틸은 세그먼트 폴더 바로 아래의 플랫 파일. (예: `ui/CodeBlock.astro`, `model/useVirtualList.ts`, `utils/getListRanges.ts`)
  - 타입 파일은 항상 `types/` 폴더 안에 `types/toc.ts`처럼 내용을 나타내는 이름으로 작성.
  - React 컴포넌트의 스타일은 같은 이름의 `.module.css`를 바로 옆에 둠. (예: `index.tsx` + `index.module.css`, `ui/StructureView.tsx` + `ui/StructureView.module.css`) Astro 컴포넌트는 같은 파일의 `<style>`을 씀.
  - 통합 테스트(`test.ts(x)`)는 세그먼트 밖, 컴포넌트 폴더 바로 아래의 일반 파일. 단위 테스트는 `utils/getListRanges.test.ts`처럼 구현 파일 옆에 둠.

### 폴더 구조 예시

```plaintext
src/
├── modules/
│   ├── widgets/
│   │   └── post/
│   │       └── TableOfContents/
│   │           ├── index.astro                 # 페이지에서 배치되는 목차
│   │           ├── ui/
│   │           │   └── TocList.astro           # 목차 링크 목록
│   │           ├── utils/
│   │           │   ├── toTocItems.ts
│   │           │   └── toTocItems.test.ts      # 단위 테스트
│   │           └── types/
│   │               └── toc.ts
│   └── features/
│       └── demo/
│           └── VirtualListDemo/
│               ├── index.tsx                   # React 섬 (글에서 client:visible로 씀)
│               ├── index.module.css
│               ├── ui/
│               │   ├── DocumentRows.tsx
│               │   └── DocumentRows.module.css
│               ├── model/
│               │   └── useVirtualList.ts       # 이 데모에 강결합된 상태
│               ├── constants/
│               │   └── virtualList.ts
│               └── utils/
│                   ├── getListRanges.ts
│                   └── getListRanges.test.ts
└── shared/
    └── components/
        └── primitives/
            ├── layout/                         # primitives의 컴포넌트 분류 (세그먼트 아님)
            │   └── WithAside/
            │       └── index.astro
            └── ui/
                └── Icon/
                    ├── index.astro
                    ├── constants/
                    │   └── iconPaths.ts
                    └── types/
                        └── icon.ts
```

### 주의사항

- 각 컴포넌트는 자신의 폴더를 가져야 함. `modules/*`, `shared/components/*` 폴더 내에 컴포넌트 파일이 직접 위치하지 않도록 함. (단, `ui` 세그먼트 안의 서브 컴포넌트는 폴더 없이 플랫 파일로 둠)
- 컴포넌트 폴더 내에 `index.astro` 또는 `index.tsx`가 반드시 존재해야 함.
- 컴포넌트 관련 모든 파일은 반드시 해당 컴포넌트 폴더의 세그먼트 내에 위치. (예외: 통합 테스트와 React 메인 컴포넌트의 `index.module.css`는 컴포넌트 폴더 바로 아래에 둠)
- 컴포넌트 폴더 내에서만 사용되는 파일들은 외부에서 임포트되지 않도록 주의.
- `ui/` 내부의 서브 컴포넌트도 **부모 컴포넌트의 추상화 레벨 규칙을 그대로 따름**.
  - 예: `PostBody/ui/CodeBlock.astro`는 widget 레벨이므로 feature인 `CopyCodeButton`을 쓸 수 있음.
- **훅의 위치는 사용 횟수("지금은 여기서만 쓴다")로 판단하지 않음.** 컴포넌트와 강결합된 훅만 `model`에 코로케이션하고, 도메인 값만 주고받는 훅은 `shared/hooks/domain/<도메인>`에 둠. 세부 기준은 `project-structure` 스킬의 「코드를 shared로 내리는 기준」 참고.
- `.astro`의 `<script>`가 쓰는 판단 로직(예: 지금 읽는 제목 고르기)은 `utils`로 떼어 단위 테스트함. `<script>`에는 DOM을 읽고 쓰는 일만 남김.
- 하나의 페이지를 렌더링하는 파일은 추상화 규칙의 대상은 아니지만, 폴더/`index.astro` 형태는 동일하게 지킴. (예: `pages/posts/[slug]/index.astro`)
- 통합 테스트는 최종 책임 컴포넌트(대부분 widgets) 폴더 안에, 단위 테스트는 `utils` 세그먼트 안에 구현 파일과 나란히, E2E 테스트는 전역 `__test__/`에 둠. 훅은 테스트하지 않음.

#### 컴포넌트 폴더에서의 세그먼트

세그먼트 자체의 정의는 `.claude/rules/segment-pattern.md`를 따르며, 컴포넌트 폴더에서는 아래가 추가로 적용됨.

- 모든 세그먼트의 내용물은 **해당 컴포넌트 내부에서만 사용**. 외부에 공개하는 것은 `index`뿐.
