---
paths:
  - "src/**/*.astro"
  - "src/**/*.tsx"
  - "src/**/*.css"
description: 화면을 그리는 코드가 지켜야 하는 디자인 시스템 규칙의 요약. 정본은 docs/design-system.md. 스타일 · 부품을 만들거나 고치기 전 필독.
---

# 디자인 시스템 규칙 (요약)

**정본은 `docs/design-system.md`입니다.** 이 파일은 코드를 쓸 때 꼭 지킬 것만 추립니다. 값 · 부품 모양 · 상태가 궁금하면 정본의 해당 절을 읽습니다. 시안 그림은 `design/exports-system/`의 PNG입니다.

## 값은 토큰으로만

- 색 · 글자 · 간격 · 모서리 · 선 굵기 · 아이콘 크기 · 움직임은 `src/shared/styles/tokens.css`의 CSS 변수만 씁니다. 이름과 값은 정본 2~6장과 같습니다.
- 표에 없는 값이 필요하면 코드에 숫자를 넣지 말고, 정본에 토큰을 먼저 더하자고 보고합니다(에이전트는 `docs/`와 `design/`을 직접 고치지 않습니다).
- 예외: 정본이 부품 크기를 숫자로 정한 값(칩 높이 32px, 슬라이더 줄 4px · 손잡이 16px · 누르는 영역 44px, 데모 화면 최소 높이 200px, 목차 안쪽 15 · 27px, 표 칸 안쪽 10px 등)은 숫자로 쓰고, 옆에 정본의 절 번호를 주석으로 답니다.
- 색은 `light-dark()` 토큰을 쓰므로 어두운 화면 전용 규칙을 따로 만들지 않습니다.
- 그림자(`box-shadow`)와 그라데이션은 쓰지 않습니다. 칸은 1px 선과 `--color-surface`로 나눕니다.

## 색의 쓰임

| 쓰임 | 토큰 |
| --- | --- |
| 꾸밈 선(구분선, 칸 테두리, 목록 줄) | `--color-border` |
| 뜻이 있는 선(슬라이더 남은 줄, 표 머리 줄, 참고 칸 선, 칩 올림 테두리) | `--color-border-strong` (3:1 이상) |
| 24px 넘는 큰 글자만(연도, 404 숫자) | `--color-text-subtle` |
| 「고른 것」 · 「지금 바뀐 것」 | `--color-accent`, `--color-accent-soft` |
| 코드 칸의 틀(바탕 · 선 · 파일 이름 · 「복사됨」 · 줄 번호 · 강조 줄) | `--color-code-*`. 낱말 색은 CSS가 아니라 Shiki 테마(`shared/content/codeThemes`)가 칠함 |
| 데모 범주 | `--color-data-1`~`4`. 데모와 그 데모를 가리키는 본문 낱말에만. 이름표나 모양을 함께 씀 |

- 색만으로 뜻을 알리지 않습니다. 고른 칩은 체크 아이콘, 강조 칸은 아이콘과 제목, 링크는 밑줄을 함께 씁니다.
- 새 색을 쓰면 두 화면에서 대비를 잽니다(글자 4.5:1, 24px 넘는 글자 · 조작 장치 경계 · 포커스 3:1).

## 화면 폭

- 휴대폰부터 짜고 `min-width`로 넓힙니다. 미디어 쿼리에는 변수를 못 쓰므로 숫자를 씁니다.
- 구간: 휴대폰 0–767px, 태블릿 768px부터(글자 · 여백 · 머리말 높이가 넓은 화면 값), 넓은 화면 1200px부터(옆 목차).
- 글자 크기 · 좌우 여백 · 머리말 높이 · 아이콘 단추 크기는 토큰이 768px에서 저절로 바뀝니다. 컴포넌트에서 다시 나누지 않습니다.
- widgets · features 안의 배치는 화면 폭 대신 container query로 나눕니다.

## 부품

- 이미 있는 부품을 먼저 씁니다: `Icon`, `IconButton`, `Chip`, `Callout`(kind: key · warn · note), `Figure`, `SkipLink`, `AnchorHeading`, `DemoFrame`, `DemoControls`, `DemoSlider`.
- 댓글 칸의 부품(목록, 「글쓴이」 표시, 입력 칸, 남기기 단추, 글자 단추)은 정본 7.21에 있고 지금은 `widgets/post/Comments` 안에만 있습니다. 다른 곳에서 입력 칸 · 글자 단추가 필요해지면 primitives로 내립니다. Pencil에는 아직 없습니다(정본 12장).
- 페이지 제목(글 목록 · 시리즈 · 소개 같은 페이지의 h1)은 `title` 단계(`--font-size-title` 28px · 휴대폰 24px), 글 제목은 `h1` 단계(36px · 26px)입니다.
- 코드 칸
  - 낱말 색은 VS Code Light+ / Dark+를 대비 보정한 `blog-light-plus` · `blog-dark-plus`입니다. 테마를 바꾸거나 Shiki를 올리면 `codeThemes/test.ts`가 모든 글자색의 대비(바탕 · 강조 줄 위 4.5:1)를 확인합니다.
  - 15px(휴대폰 14px) · 줄 간격 1.65 · 글자 이음 끔 · 탭 2 · 가로 스크롤. 강조 줄은 메타 `{3,5-6}`, 줄 번호는 20줄 넘을 때만.
  - 코드 속 한글은 D2Coding 부분 글꼴(이름은 OFL 예약 이름 때문에 「Blog Code Hangul」)을 씁니다.
- 글꼴 파일은 `scripts/buildFonts.ts`가 빌드 결과의 글자만 담아 만듭니다(Blog Sans = Pretendard 부분 글꼴, JetBrains Mono, Blog Code Hangul). `pnpm build`가 다시 만들고 빠진 글자를 검사하므로 손으로 고치지 않습니다. 새 글꼴 · 굵기를 쓰려면 이 스크립트와 `fonts.css`를 함께 고치고, 굵기는 400–800 밖으로 쓰지 않습니다(가변 축을 이 범위로 줄였음).
- `font-sans`의 대체 글꼴(Blog Sans Fallback Mac · Win · 기본)은 Blog Sans에 크기를 맞춘 것이라 순서를 바꾸지 않습니다.
- 아이콘은 Lucide 하나만, 선 굵기 2, `currentColor`. 크기는 `size="sm|md|lg|xl"`(14 · 16 · 18 · 20px)입니다. 아이콘만 있는 단추에는 `aria-label`을 꼭 붙입니다.
- 포커스는 `base.css`의 `:focus-visible`(2px `--color-focus`, 간격 2px)을 씁니다. `outline: none`으로 지우거나 `box-shadow`로 대신하지 않습니다. 모서리만 부품 모서리를 따르게 고칩니다.
- 움직임은 `--duration-*`과 `--ease-standard`를 씁니다. 움직임 줄이기 설정이면 `base.css`가 시간을 0으로 줄입니다. 데모는 자동 재생하지 않습니다.
- JavaScript가 꺼지면 `<html>`에 `no-js` 클래스가 남습니다. 누를 수 없는 단추는 `:global(.no-js)`로 숨깁니다.
- 인쇄할 때는 `tokens.css`가 밝은 화면 값으로 고정하고, 머리말 · 꼬리말은 그리지 않으며, `Container`는 좌우 여백과 최대 폭을 풉니다. 인쇄 전용 규칙(`@media print`)은 너비 구간이 아니라서 widgets 안에 써도 됩니다. 이력서의 인쇄 규칙(종이 여백 15mm, 글자 한 단계 줄이기, 쪽 나눔)은 정본 7.23에 있습니다.

## 디자인과 코드 잇기

- 부품 파일의 JSDoc에 Pencil 위치를 한 줄 적습니다. 이름과 id는 정본 7.1 표를 그대로 씁니다.

  ```ts
  /**
   * 본문에서 꼭 기억할 문장을 강조하는 칸입니다.
   * @design design/blog.pen 「강조 칸」 eknYZ (핵심 C5y0qU · 주의 NSuOp · 참고 krx9I)
   */
  ```

- 부품 모양을 바꾸는 순서는 정본 → Pencil → 코드 → `design/exports-system/` PNG입니다. 코드만 먼저 바꾸지 않습니다.
- 정본과 코드가 다르면 코드를 정본에 맞추고, 정본이 틀렸다고 보면 고치지 말고 보고합니다.
