## 프로젝트 개요

이스타의 개인 블로그(「이스타의 개발 노트」) 저장소입니다. 공부하며 배운 것과 만든 것을 읽기 좋은 글로 남깁니다.

- Astro 7 정적 사이트, `https://eastar-ds.github.io`(GitHub Pages)에 올립니다. 한국어만 씁니다.
- 글 원본은 `src/content/posts/{slug}/index.mdx`이고, 글 주소는 `/posts/{slug}/`입니다.
- 기본으로 JavaScript를 보내지 않습니다. 움직이는 칸만 골라 살립니다.
- 정한 것은 `docs/plan.md`에 있습니다.
- **디자인의 정본은 `docs/design-system.md`**(A안 디자인 시스템: 토큰, 부품, 접근성, 속도 예산)이고, 시안 그림은 `design/exports-system/`의 Pencil PNG입니다. `docs/design-references.md`와 `design/exports-a/`는 방향을 고를 때의 기록입니다.
- **글쓰기 · 게시 정책의 정본은 `docs/content-guide.md`**입니다.
- 폴더 구조와 규칙은 Knot 하네스의 프론트엔드 부분을 Astro에 맞게 옮긴 것입니다. 무엇을 바꿨는지는 `docs/harness.md`에 있습니다.
- 노션 익명 댓글과 PostHog 중계는 `worker/`의 Cloudflare Worker가 맡습니다. 구조 · 노션 표 칸 · 무료 한도는 `docs/worker.md`, 이스타가 할 배포 순서는 `docs/deploy-phase2.md`에 있습니다. Worker는 블로그와 따로 설치 · 시험 · 배포합니다.

### 명령

| 명령 | 하는 일 |
| --- | --- |
| `pnpm post:sources` · `post:sources:check` | 저장소 밖 작업 폴더의 자료 훑기 · 목록 검사 |
| `pnpm post:answers` · `post:interview:check` · `post:outline:check` | 답 원문 저장 · 인터뷰 대조 · 개요 검사 |
| `pnpm post:measure` · `post:fixtures` · `post:evals` | 글 분량 재기 · 저장소 밖 평가 재료 만들기 · 스크립트 평가 |
| `pnpm dev` | 개발 서버 (`http://localhost:4321`). 에이전트는 `pnpm astro dev --background`로 띄우고 `pnpm astro dev stop`으로 끕니다 |
| `pnpm build` | 정적 빌드(`dist/`). 빌드 → 사이트 글자로 글꼴 만들기(`scripts/buildFonts.ts`) → 다시 빌드 → 빠진 글자 검사. 글꼴이 바뀌면 `src/shared/styles/fonts/`를 함께 커밋 |
| `pnpm check` | 타입 검사 (`astro check`, TypeScript strict) |
| `pnpm test` | 단위 테스트 (vitest) |
| `pnpm fonts` · `pnpm fonts:check` | `dist`로 글꼴만 다시 만들기 · 빠진 글자만 검사 (보통은 `pnpm build`가 함께 함) |
| `pnpm test:worker` · `pnpm check:worker` | Worker 시험 · 타입 검사. 먼저 `pnpm --dir worker install` |
| `pnpm test:all` | 블로그 타입 검사 · 시험과 Worker 타입 검사 · 시험을 한 번에 |
| `pnpm check:post <slug>` · `--all` · `--include-drafts` | 게시 전 점검(`scripts/checkPost.ts`). 글이 `docs/content-guide.md` 10장과 그 항목이 가리키는 장을 지키는지 셀 수 있는 것만 검사. `--dist`를 붙이면 빌드 결과도 보고, `--json`은 스킬용. 실패가 있으면 끝 코드 1. 배포 워크플로가 `--all --dist dist`로 돌림 |
| `pnpm check:links` | 글(초안 포함)의 바깥 링크가 열리는지 검사. 주 1회 워크플로(`.github/workflows/check-links.yml`)도 돌림 |
| `worker`에서 `pnpm dev` · `pnpm dev:fake-notion` | 로컬 Worker(8787)와 가짜 노션 서버(8790). `worker/.dev.vars.example`을 `.dev.vars`로 복사해 씀 |

---

### 작업 절차

코드 구현 시 아래 순서를 따라야 한다.

1. **대상 파일을 먼저 특정한다.** 요구사항을 보고 어떤 파일을 새로 만들거나 고쳐야 하는지 정한다. 위치·역할 판단의 근거는 `project-structure` 스킬이다.
2. **대상 파일과 그 주변을 읽는다.** 고칠 파일, 같은 폴더의 기존 파일, 참고할 유사 구현을 먼저 읽는다. 새 파일이라면 들어갈 폴더의 기존 파일을 읽는다.
3. **주입된 규칙을 확인한 뒤 구현한다.** 규칙이 주입되지 않았다면 아직 대상 영역의 파일을 읽지 않은 것이므로 2단계로 돌아간다.
4. **판단 로직은 테스트와 함께 쓴다.** `utils`, `shared/content`, `shared/seo`의 함수는 단위 테스트를 함께 쓰고 `pnpm test`로 확인한다.
5. **화면을 바꿨다면 브라우저로 본다.** 개발 서버에서 넓은 화면(1440px), 휴대폰(390px), 어두운 화면을 보고 `design/exports-system/`의 Pencil PNG와 비교한다. 새 색을 썼다면 대비를 잰다. 확인 캡처는 저장소에 넣지 않는다.
6. **마치기 전에 `pnpm check`, `pnpm test`, `pnpm build`를 모두 통과시킨다.** `worker/`를 고쳤다면 `pnpm test:worker` · `pnpm check:worker`도 통과시킨다.

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
- 글(`src/content/posts/**/index.mdx`)을 쓰거나 고칠 때는 `writing-style` 스킬(`.claude/skills/writing-style/SKILL.md`)을 따르고, `bash .claude/skills/writing-style/check.sh <글 파일>`을 출력 없이 통과시킨다. Write · Edit 뒤에는 같은 검사와 게시 막기(초안이 아닌 글에 남은 〔이스타 확인〕 표시), 개인 정보 검사(글과 데모의 로컬 경로 · 이메일 · 토큰 꼴 · 사설 IP · 전화번호)를 훅(`.claude/settings.json`, `scripts/hooks/`)이 돌린다.
- 게시 전에는 `prepublish-check` 스킬로 10장 확인 목록을 점검한다. 셀 수 있는 기준 값은 `scripts/checkPost/constants.ts`에 정본의 근거와 함께 있고, 분류 목록과 제목 · 요약 상한은 `src/shared/constants/post`에서 빌드 스키마와 함께 쓴다.
- `.references/`(다른 사이트 화면)와 `design/*.pen`(Pencil 원본)은 저장소에 넣지 않는다. 시안은 `design/exports-system/`의 PNG를 보고, `.pen` 파일은 파일 도구로 열거나 고치지 않는다(다룰 때는 Pencil 도구로만, 이스타가 시킬 때만).
- 커밋 메시지는 `feat: ...함`처럼 한국어로 쓰고, 공동작업자 줄을 넣지 않는다.
- 배포는 `.github/workflows/deploy.yml`이 main에 올라올 때 한다. 배포가 끝나면 글이 바뀐 페이지 주소를 IndexNow로 알린다(`scripts/indexNow.ts`, 실패해도 배포는 성공). 저장소 만들기 · 푸시 · 배포는 이스타나 오케스트레이터가 시킬 때만 한다.
- IndexNow 키(`public/{키}.txt`, `scripts/indexNow/constants.ts`)는 규격상 공개 값이라 저장소에 둔다. 비밀값이 아니다.
- Worker 배포(`wrangler deploy`)와 Cloudflare · 노션 · PostHog 계정 작업은 이스타가 한다. 비밀값(노션 토큰, Turnstile 비밀 키)은 `wrangler secret put`과 로컬 `worker/.dev.vars`(저장소에 올리지 않음)로만 다루고, 코드 · 문서 · 로그 · 커밋에 쓰지 않는다.
- `shared/constants/services`의 값이 비어 있으면 댓글 · PostHog 부품이 빌드에서 빠진다(`astro.config.ts`). 확인하려고 값을 채웠으면 커밋 전에 되돌린다.
