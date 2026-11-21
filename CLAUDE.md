## 프로젝트 개요

이스타의 개인 블로그(「이스타의 개발 노트」) 저장소입니다. 공부하며 배운 것과 만든 것을 읽기 좋은 글로 남깁니다.

- Astro 7 정적 사이트, `https://eastar-ds.github.io`(GitHub Pages)에 올립니다. 한국어만 씁니다.
- 글 원본은 `src/content/posts/{slug}/index.mdx`이고, 글 주소는 `/posts/{slug}/`입니다.
- 기본으로 JavaScript를 보내지 않습니다. 움직이는 칸만 골라 살립니다.
- 정한 것은 `docs/plan.md`에 있습니다.
- **디자인의 정본은 `docs/design-system.md`**(A안 디자인 시스템: 토큰, 부품, 접근성, 속도 예산)이고, 시안 그림은 `design/exports-system/`의 Pencil PNG입니다. `docs/design-references.md`와 `design/exports-a/`는 방향을 고를 때의 기록입니다.
- **글쓰기 · 게시 정책의 정본은 `docs/content-guide.md`**입니다.
- 폴더 구조와 규칙은 Knot 하네스의 프론트엔드 부분을 Astro에 맞게 옮긴 것입니다. 무엇을 바꿨는지는 `docs/harness.md`에 있습니다.

### 명령

| 명령 | 하는 일 |
| --- | --- |
| `pnpm dev` | 개발 서버 (`http://localhost:4321`). 에이전트는 `pnpm astro dev --background`로 띄우고 `pnpm astro dev stop`으로 끕니다 |
| `pnpm build` | 정적 빌드 (`dist/`) |
| `pnpm check` | 타입 검사 (`astro check`, TypeScript strict) |
| `pnpm test` | 단위 테스트 (vitest) |

---

### 작업 절차

코드 구현 시 아래 순서를 따라야 한다.

1. **대상 파일을 먼저 특정한다.** 요구사항을 보고 어떤 파일을 새로 만들거나 고쳐야 하는지 정한다. 위치·역할 판단의 근거는 `project-structure` 스킬이다.
2. **대상 파일과 그 주변을 읽는다.** 고칠 파일, 같은 폴더의 기존 파일, 참고할 유사 구현을 먼저 읽는다. 새 파일이라면 들어갈 폴더의 기존 파일을 읽는다.
3. **주입된 규칙을 확인한 뒤 구현한다.** 규칙이 주입되지 않았다면 아직 대상 영역의 파일을 읽지 않은 것이므로 2단계로 돌아간다.
4. **판단 로직은 테스트와 함께 쓴다.** `utils`, `shared/content`, `shared/seo`의 함수는 단위 테스트를 함께 쓰고 `pnpm test`로 확인한다.
5. **화면을 바꿨다면 브라우저로 본다.** 개발 서버에서 넓은 화면(1440px), 휴대폰(390px), 어두운 화면을 보고 `design/exports-system/`의 Pencil PNG와 비교한다. 새 색을 썼다면 대비를 잰다. 확인 캡처는 저장소에 넣지 않는다.
6. **마치기 전에 `pnpm check`, `pnpm test`, `pnpm build`를 모두 통과시킨다.**

하네스의 「스토리 작성」 단계는 블로그에서 뺐다. Astro 컴포넌트는 Storybook 지원이 약하고, 화면 확인은 5단계의 브라우저 확인으로 한다.

영역별로 주입되는 규칙:

| 영역 | 규칙 |
| --- | --- |
| `src/**/*.astro`, `src/**/*.ts`, `src/**/*.tsx` 전체 | `general-code-convention.md` |
| `src/**/*.astro`, `src/**/*.tsx`, `src/**/*.css` | `design-system.md` (정본 `docs/design-system.md`의 요약) |
| `src/pages/**` | `component-abstract-pattern.md`, `layout-pattern.md`, `seo-guide.md` |
| `src/modules/**`, `src/shared/components/**` | `component-abstract-pattern.md`, `component-colocation-pattern.md`, `segment-pattern.md` |
| `src/shared/components/primitives/layout/**` | 위에 더해 `layout-pattern.md` (`Document`는 `seo-guide.md`도) |
| `src/shared/**` | `shared-layer.md` |
| `src/shared/content/**`, `src/content/**`, `src/content.config.ts` | `content-guide.md` (정본 `docs/content-guide.md`의 코드 쪽 요약) |
| `src/shared/seo/**` | `seo-guide.md` |
| `src/shared/hooks/**` | `hook-guide.md` |
| `src/**/test.ts(x)`, `src/**/*.test.ts`, `src/__test__/**` | `test-strategy.md` |

---

### 지킬 것

- 레이아웃은 공통 틀(outlet, `BaseLayout`)로 감싸지 않는다. 페이지마다 머리말 · widgets · 꼬리말을 직접 배치한다. (`layout-pattern.md`)
- 디자인 값은 `src/shared/styles/tokens.css`의 CSS 변수만 쓴다. 이름과 값은 `docs/design-system.md`와 같게 두고, 밝은 · 어두운 값은 `light-dark()`로 한 줄에 둔다.
- `docs/design-system.md`, `docs/content-guide.md`, `design/` 아래는 에이전트가 고치지 않는다. 문서와 코드가 맞지 않거나 문서가 틀렸다고 보면 보고한다.
- 글에는 공개되면 곤란한 내용을 넣지 않는다. 저장소는 공개 저장소다.
- `.references/`(다른 사이트 화면)와 `design/*.pen`(Pencil 원본)은 저장소에 넣지 않는다. 시안은 `design/exports-system/`의 PNG를 보고, `.pen` 파일은 파일 도구로 열거나 고치지 않는다(다룰 때는 Pencil 도구로만, 이스타가 시킬 때만).
- 커밋 메시지는 `feat: ...함`처럼 한국어로 쓰고, 공동작업자 줄을 넣지 않는다.
