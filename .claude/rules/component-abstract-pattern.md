---
paths:
  - "src/pages/**"
  - "src/modules/**"
  - "src/shared/components/**"
description: 컴포넌트(Astro·React)가 지켜야 하는 추상화 레벨을 정의한 가이드라인. 컴포넌트 생성·수정·리팩토링·코드리뷰 전 필독.
---

# 컴포넌트 추상화 가이드라인

이 문서는 블로그의 모든 컴포넌트가 지켜야 하는 컴포넌트 추상화 레벨을 정의함.

이 문서는 **컴포넌트를 어느 위치에 둘 것인가**만 다룸. 위치가 정해진 이후는 아래 문서 참고.

- `.claude/rules/component-colocation-pattern.md` : 컴포넌트 폴더를 어떻게 구성할 것인가
- `.claude/rules/segment-pattern.md` : 컴포넌트 폴더 내부 세그먼트(`ui` / `model` / `utils` / `types` / `constants` / `context`)를 어떻게 나누고 어디에 둘 것인가
- `.claude/rules/layout-pattern.md` : 페이지의 화면 배치를 어떻게 정할 것인가

## 핵심 원칙

모든 컴포넌트는 아래의 추상화 레벨을 지켜야 함.
핵심적으로 모든 컴포넌트는 도메인 로직을 다루는지에 따라 `modules/...` 또는 `shared/components/...`에 들어감.

이 블로그의 도메인은 `site`(사이트 공통), `post`(글), `series`(시리즈), `demo`(글 속 데모)임.

`shared/components/` 내에서도 내부 로직·ui를 다루는 컴포넌트인지에 따라 `shared/components/composites/...`와 `shared/components/primitives/...`로 나뉨.

`modules` 컴포넌트 내에서도 section 단위의 독립적인 구획을 담당하는 큰 컴포넌트(`widgets`)와, 코드 복사 버튼처럼 섹션이 되지 못하는 작은 컴포넌트(`features`)로 나뉨.

### 컴포넌트 종류

- `modules/widgets` : `<section />`, `<article />`, `<nav />`, `<header />`처럼 문서의 독립적인 구획을 담당하는 큰 컴포넌트. 도메인 로직을 포함하며, 페이지에서 import되어 사용되고 **여러 page에서 재사용 가능**. 구획에 필요한 콘텐츠를 스스로 가져옴.
- `modules/features` : widgets 내부에서 독립적으로 존재할 수 있는, 섹션이 되지 못하는 작은 단위의 도메인 컴포넌트. 할당받은 완결된 작업을 스스로 수행.
- `shared/components/composites` : 공통 ui와 내부(ui) 로직을 다룸. 도메인 로직은 다루지 않음.
- `shared/components/primitives` : 공통 ui만 다룸.

### widgets vs features 판단 기준

**공통점**: 둘 다 도메인 로직을 가지며, 필요한 콘텐츠를 `shared/content` 함수로 스스로 가져오는 독립적인 단위이므로 props가 거의 없어야 함. 글 화면의 widgets는 글을 가리키는 `slug` 하나만 받음.

**판단 순서** (두 단계):

1. **섹션 단위인가?** 문서의 구획으로 묶일 만큼 크면 widgets. 제목(h1·h2)이나 landmark(`nav`, `header`, `footer`)가 있으면 widgets일 가능성이 높음.
2. **1번으로 애매하다면, widgets 안에서 재사용될 수 있는가?** 재사용 가능하면 features, 아니면 widgets.

### 참조 규칙

- 각 컴포넌트는 `pages` > `widgets` > `features` > `composites` > `primitives` 순서의 레벨을 가지며, 자신보다 하위 레벨만 사용 가능. 상위 레벨 컴포넌트는 사용 불가.
  - `pages` : widgets를 배치·조립하는 역할만 담당. 배치는 `primitives/layout`으로 함. UI 단위가 크지 않은 경우에는 features를 바로 사용 가능.
  - `widgets` : features·composites·primitives를 조합 가능.
  - `features` : composites·primitives만 조합 가능. **widgets는 사용 불가.**
  - `composites` : primitives만 조합 가능.
  - `primitives` : 상위 레벨을 사용할 수 없음.
- **동일 레벨끼리의 조합은 `primitives`에서만 허용.**
  - widgets는 widgets를 import할 수 없음.
  - features가 features를 import하면 도메인이 섞이므로 금지.
  - composites끼리도 조합 불가. 공통 UI가 겹치면 primitives로 내려서 재사용.
  - primitives끼리 조합한 결과는 primitives로 둠.
- **페이지가 슬롯으로 끼워 넣는 것은 조합이 아님.** `PostArticle`의 `after-header` 슬롯에 페이지가 `TableOfContents`를 넣는 것처럼, 두 widgets를 이어 붙이는 쪽은 페이지임. widgets는 서로를 import하지 않음.
- React 컴포넌트(섬)는 `.astro` 컴포넌트를 쓸 수 없음. React 섬이 쓰는 하위 컴포넌트도 React로 만듦 (e.g. `DemoFrame`, `DemoControls`).
- 도메인이 겹치는 상황에서는 컴포넌트 재사용 대신, 도메인 로직을 함수로 만들어 `shared/content`(콘텐츠) 또는 `shared/hooks/domain`(React 섬 상태)으로 내려서 재사용.

### 주의사항

- 라우트에 대응하는 화면 단위는 `src/pages`에 두며, widgets를 import해 **배치하는 레이아웃 역할만** 담당. 페이지가 하는 일은 아래까지임.
  - `getStaticPaths`로 만들 주소 정하기 (Astro 규약이라 페이지에만 둘 수 있음)
  - `shared/seo` 함수로 문서 메타와 구조화 데이터를 만들어 `Document`에 넘기기
  - `primitives/layout`으로 widgets 배치하기, 페이지 위아래 여백 정하기
- 페이지에서 콘텐츠를 가공하거나 화면 요소를 직접 그리지 않음.
- 하나의 페이지를 보여주는 컴포넌트는 `modules/`, `shared/components/`에 두지 않음.

#### modules/widgets

- 도메인 로직을 다루는 컴포넌트
- 구획 단위의 큰 컴포넌트로, 여러 page에서 재사용 가능
- 콘텐츠를 가져와 하위 요소에 책임을 할당하는 지휘자 역할. 빌드할 때 `shared/content` 함수를 직접 부름 (같은 글을 여러 widgets가 불러도 Astro가 콘텐츠를 한 번만 읽음)
- **자기가 어떤 틀 안에 놓일지 가정하지 않음.** 바깥 여백·폭·고정 위치는 페이지와 layout primitives가 정함. 안쪽 반응형은 container query로 함
- 하위에 도메인별 디렉토리로 작성
  - e.g. `site/SiteHeader`, `post/PostArticle`, `post/TableOfContents`, `series/SeriesChips`

#### modules/features

- 도메인 로직을 다루는 작은 컴포넌트. 대부분 움직이는 칸임
- 섹션이 되지 못하는 작은 단위로, 여러 widgets·pages에서 재사용 가능한 단위로 작성
- 하위에 도메인별 디렉토리로 작성
  - e.g. `site/ThemeToggle`, `post/CopyCodeButton`, `demo/RenderingPipelineDemo`
- 글 속 데모는 `demo/{데모 이름}`으로 둠. 데모는 글 본문(MDX)이 직접 import하므로 widgets를 거치지 않음

#### shared/components/composites

- 도메인을 다루지 않는 컴포넌트
- 내부 로직(ui 로직)까지만 다룸. 탭, 접는 상자처럼 스스로 상태를 갖는 공통 UI
- 접고 펴기는 먼저 `<details>`로 JavaScript 없이 만들 수 있는지 살핌

#### shared/components/primitives

- 내부 로직 및 도메인 로직을 다루지 않는 컴포넌트
- props를 그리는 방법만 정하고, props로 받은 값 자체는 바꾸지 않음. 숫자를 문구로, 날짜를 형식으로 바꾸는 일은 primitives 밖에서 끝내고 결과만 넘김
  - e.g. `<Chip count={`${series.count}편`}>` ⭕ / `<Chip seriesCount={3} />` ❌
- 파생값 계산이 허용되는 경우는 어떤 디자인 변형을 그릴지 고르는 계산뿐
- `shared/utils`와 도메인 상수를 import하지 않음. `Document`가 테마 저장 키(`shared/constants/theme`)와 RSS 주소를 쓰는 것은 문서 뼈대의 일이라 예외
- 종류에 따라 `ui`, `layout`, `animation`으로 나뉨
  - `ui` : 색상이나 모형 등 실체가 있는 컴포넌트 (e.g. `Icon`, `IconButton`, `Chip`, `Callout`, `Figure`, `SkipLink`, `AnchorHeading`, `DemoFrame`)
  - `layout` : 특정 요소를 위치시키는 컴포넌트 (e.g. `Document`, `Container`, `Stack`, `WithAside`, `ShowOn`)
  - `animation` : 특정 요소의 애니메이션을 다루는 컴포넌트

## 컴포넌트 구현하기

### 절차

1. 도메인 로직 확인하기

글 속 렌더링 단계 데모를 만든다면 도메인 로직은 "렌더링 단계와 CSS 속성의 관계".

2. 추상화 레벨에 맞추어 구현 계획 세우기

- **렌더링 단계 데모** → `modules/features/demo/RenderingPipelineDemo`
- 데모를 담는 틀, 재생·슬라이더 조작 줄 → `shared/components/primitives/ui/DemoFrame`, `DemoControls`
- 데모 안에서만 쓰는 단계 칸, 속성 고르기 → 데모의 `ui` 세그먼트

3. 구현하기

---

**기억할 것**: 이 문서의 추상화 규칙 외의 불필요한 추상화는 절대 금지.
