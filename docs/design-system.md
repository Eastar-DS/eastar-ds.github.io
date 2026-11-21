# A안 디자인 시스템 (정본)

이 블로그 화면의 기준값과 부품 규칙을 적은 정본입니다. 값을 바꿀 때는 이 문서를 먼저 고치고, 그다음 Pencil 변수와 코드의 CSS 변수를 같은 값으로 맞춥니다.

- 고른 방향: A안(차분한 문서형). 글과 데모가 주인공이고, 꾸밈은 줄입니다.
- 디자인 파일: `design/blog.pen`
  - 「A · 디자인 시스템 · 기초」 보드(id `uZtUD`): 색, 글자, 간격, 배치, 아이콘 · 움직임 · 포커스
  - 「A · 디자인 시스템 · 부품」 보드(id `lU6va`): 재사용 컴포넌트와 상태
  - 「A · 코드 칸 비교」 보드(id `mgkh9`): 코드 칸 색 세 방식 비교와 채택안(VS Code Light+ / Dark+ + 대비 보정), 낱말별 대비 표
  - 화면: 「A · 글 화면 · 넓은 화면」(`l3Icmh`), 「A · 글 목록 · 넓은 화면」(`Yknaw`), 「A · 글 화면 · 어두운 화면」(`fwBr7`), 「A · 글 화면 · 휴대폰」(`CoBjY`), 「A · 404 · 넓은 화면」(`m3K3l`). 다섯 화면 모두 아래 부품의 인스턴스로 만들었습니다.
- 내보낸 그림: `design/exports-system/` (`system-foundations.png`, `system-components.png`, `code-compare.png`, `screen-*.png`)
- 글쓰기와 데모 규칙은 [content-guide.md](./content-guide.md)에 있습니다.

## 목차

1. 원칙
2. 색
3. 글꼴과 글자 단계
4. 간격, 모서리, 선, 그림자
5. 화면 폭과 배치
6. 아이콘, 움직임, 포커스
7. 부품
8. 접근성
9. 어두운 화면 규칙
10. 속도 예산
11. Pencil과 코드 잇기
12. 부록: 지금 코드와 다른 점

---

## 1. 원칙

1. **토큰만 씁니다.** 색 · 크기 · 간격 · 모서리는 아래 표의 CSS 변수로만 씁니다. 표에 없는 값이 필요하면 먼저 이 문서에 토큰을 더합니다.
2. **이름은 쓰임으로 짓습니다.** `--color-blue`가 아니라 `--color-accent`처럼 씁니다. 그래야 어두운 화면에서 값만 바꿀 수 있습니다.
3. **그림자와 그라데이션을 쓰지 않습니다.** 칸은 1px 선과 `--color-surface` 바탕으로 나눕니다.
4. **색만으로 뜻을 알리지 않습니다.** 링크는 밑줄, 고른 칩은 체크 아이콘, 강조 칸은 아이콘과 제목 글자로 종류를 함께 알립니다.
5. **JavaScript 없이도 읽힙니다.** 목차, 메뉴, 접는 칸은 `<details>`로 만들고, 데모는 정지 그림과 앞뒤 글로 뜻이 통하게 합니다.

## 2. 색

### 2.1 쓰는 법

- 색 토큰은 `light-dark(밝은 값, 어두운 값)`로 한 줄에 둡니다.
- `:root`는 `color-scheme: light dark`로 시스템 설정을 따릅니다.
- 사용자가 밝기 단추로 고르면 `<html data-theme="light|dark">`가 `color-scheme`을 하나로 고정합니다.
- 고른 값은 `localStorage`에 두고, `<head>` 안의 작은 인라인 스크립트가 첫 화면을 그리기 전에 `data-theme`을 붙입니다. 그래야 화면이 번쩍이지 않습니다.
- Pencil에서는 같은 이름의 변수(`--` 없이, 예: `color-bg`)가 `mode` 축(`light` · `dark`)으로 값을 바꿉니다.

### 2.2 대비 기준

- WCAG 2.2 AA를 지킵니다.
- 글자는 바탕과 4.5:1 넘게 맞춥니다.
- 24px 넘는 큰 글자(또는 18.66px 넘는 굵은 글자), 조작 장치의 경계, 포커스 표시는 3:1 넘게 맞춥니다.
- `--color-border`는 꾸밈 선입니다. 선이 없어도 부품을 알아볼 수 있을 때만 씁니다. 경계가 뜻을 가지면(슬라이더 줄 등) `--color-border-strong`을 씁니다.
- 아래 대비 값은 WCAG 상대 휘도 식으로 직접 계산했습니다. 「칸」은 `--color-surface` 위에서 잰 값입니다.

### 2.3 색 토큰 표

#### 바탕과 글자

| CSS 변수 | 밝은 화면 | 어두운 화면 | 쓰는 곳 | 대비 (밝은 / 어두운) |
|---|---|---|---|---|
| `--color-bg` | `#FFFFFF` | `#0F1115` | 페이지 바탕 | 기준 |
| `--color-surface` | `#F6F8FA` | `#171A21` | 코드 칸, 데모 화면, 참고 칸 바탕 | 바탕과 1.06 / 1.09 (선과 함께 씀) |
| `--color-surface-hover` | `#EEF1F4` | `#1F232B` | 아이콘 단추 · 칩 올림 바탕 | 그 위 글자 13.93 / 12.83 |
| `--color-text` | `#1F2328` | `#E6E8EB` | 본문, 제목 | 바탕 15.80 · 칸 14.84 / 바탕 15.39 · 칸 14.18 |
| `--color-text-muted` | `#59636E` | `#9AA4B2` | 글 정보, 요약, 설명, 목차, 메뉴 | 바탕 6.11 · 칸 5.74 / 바탕 7.49 · 칸 6.90 |
| `--color-text-subtle` | `#8A929C` | `#616A78` | 24px 넘는 큰 글자만(글 목록 연도, 404 숫자) | 바탕 3.15 / 3.46 |

#### 선

| CSS 변수 | 밝은 화면 | 어두운 화면 | 쓰는 곳 | 대비 (밝은 / 어두운) |
|---|---|---|---|---|
| `--color-border` | `#E5E7EB` | `#2A2F38` | 구분선, 칸 테두리, 목록 줄, 목차 왼쪽 선 (꾸밈) | 바탕 1.24 / 1.41 (기준 없음) |
| `--color-border-strong` | `#7D8590` | `#6E7785` | 슬라이더 줄, 표 머리 줄, 참고 칸 왼쪽 선, 칩 올림 테두리 | 바탕 3.73 · 칸 3.50 / 바탕 4.18 · 칸 3.85 |

#### 강조와 링크

| CSS 변수 | 밝은 화면 | 어두운 화면 | 쓰는 곳 | 대비 (밝은 / 어두운) |
|---|---|---|---|---|
| `--color-accent` | `#2457D6` | `#7AA2FF` | 링크, 지금 읽는 목차, 분류, 고른 상태 | 바탕 6.16 · 칸 5.79 / 바탕 7.59 · 칸 7.00 |
| `--color-accent-hover` | `#1A44B0` | `#A8C2FF` | 링크 올림 | 바탕 8.41 / 10.64 |
| `--color-accent-soft` | `#EAF0FD` | `#1B2540` | 핵심 칸 바탕, 고른 칩 바탕, 데모에서 바뀐 단계 바탕 | 그 위 강조 글자 5.39 / 6.09 |
| `--color-on-accent` | `#FFFFFF` | `#0F1115` | 강조색 바탕 위 글자(건너뛰기 링크) | 강조 위 6.16 / 7.59 |
| `--color-focus` | `#2457D6` | `#7AA2FF` | 포커스 테두리 (`--color-accent`와 같은 값) | 바탕 6.16 · 칸 5.79 / 바탕 7.59 · 칸 7.00 |
| `--color-link-visited` | `#6E40C9` | `#B9A3F5` | 본문 속 방문한 링크 | 바탕 6.48 / 8.66 |

#### 상태

| CSS 변수 | 밝은 화면 | 어두운 화면 | 쓰는 곳 | 대비 (밝은 / 어두운) |
|---|---|---|---|---|
| `--color-good` | `#047857` | `#34D399` | 좋은 예 글자 · 표시, 「복사됨」 | 바탕 5.48 / 9.83 |
| `--color-good-soft` | `#E7F5EE` | `#0E2A22` | 좋은 예 바탕 | 그 위 좋음 글자 4.88 / 7.96 |
| `--color-bad` | `#B91C1C` | `#F87171` | 나쁜 예 글자 · 표시 | 바탕 6.47 / 6.83 |
| `--color-bad-soft` | `#FDECEC` | `#2E1618` | 나쁜 예 바탕 | 그 위 나쁨 글자 5.66 / 6.10 |
| `--color-warn` | `#8A5A00` | `#D29922` | 주의 칸 제목 · 아이콘 · 왼쪽 선 | 바탕 5.93 / 7.49 |
| `--color-warn-soft` | `#FFF5D6` | `#2B2111` | 주의 칸 바탕 | 그 위 주의 글자 5.44 / 6.26 |

#### 코드 (확정: VS Code Light+ / Dark+ + 대비 보정)

2026-11-21 이스타가 정했습니다. 코드 칸은 **페이지 밝기를 따라** 밝은 화면에서 VS Code Light+, 어두운 화면에서 VS Code Dark+ 색을 씁니다. 다만 VS Code 원래 값 가운데 4.5:1에 모자라는 색만 같은 계열로 고쳤습니다.

- 비교한 세 방식과 고른 까닭은 Pencil 「A · 코드 칸 비교」 보드(id `mgkh9`, 그림 `design/exports-system/code-compare.png`)에 있습니다. 채택한 줄에 「채택」 표시를 붙였습니다.
- 색 값은 Shiki 4.6.0으로 TypeScript · JSX · CSS · JSON · 셸 · 마크다운 조각을 실제로 토큰화해서 확인했습니다.
- Pencil에서는 변수 축 `code`의 기본값 `current`가 확정안입니다. 따로 지정하지 않아도 「코드 칸」 컴포넌트(`CX4xi`)와 A안 화면의 코드 칸이 확정 색으로 보입니다. 비교용으로 `plus`(VS Code 원래 값), `plus-dark`(늘 어두운 칸), `plus-tuned`(확정안과 같음), `github`(이전 값)를 남겨 두었습니다.

##### 바탕과 틀

| 항목 | CSS 변수 | 밝은 화면 | 어두운 화면 | 비고 |
|---|---|---|---|---|
| 코드 칸 바탕 | `--color-code-bg` | `#F6F8FA` | `#1E1E1E` | 밝은 화면은 Light+의 `#FFFFFF` 대신 칸 색. 어두운 화면은 Dark+ 그대로(페이지 `#0F1115`보다 밝아 칸이 나뉨) |
| 강조 줄 바탕 | `--color-code-line-highlight` | `#F1F5FE` | `#232830` | 아래 모든 낱말이 이 바탕에서도 4.5:1을 넘습니다 |
| 강조 줄 왼쪽 선 | `--color-code-line-highlight-bar` | `#2457D6` | `#7AA2FF` | 3px |
| 칸 테두리 | `--color-code-border` | `#E5E7EB` | `#2A2F38` | 머리 줄 아래 선도 같은 값 |
| 파일 이름 · 「복사」 | `--color-code-meta` | `#59636E` (5.74) | `#9AA4B2` (6.61) | |
| 「복사됨」 | `--color-code-success` | `#047857` (5.15) | `#34D399` (8.67) | |
| 줄 번호 | `--color-code-line-number` | `#237893` (4.72) | `#858585` (4.52) | 강조 줄의 줄 번호는 본문 글자색 |

##### 낱말 종류별 최종 색 — 밝은 화면 (바탕 `#F6F8FA`, 강조 줄 `#F1F5FE`)

| 낱말 종류 | CSS 변수 (Pencil · 문서용) | VS Code Light+ 원래 값 | 최종 값 | 대비 (바탕 / 강조 줄) |
|---|---|---|---|---|
| 본문 글자 · 연산자 · 문장 부호 | `--color-code-text` · `-operator` · `-punctuation` | `#000000` | `#000000` | 19.73 / 19.23 |
| 키워드 (`const` `function` `type` `=>` `of`) · JSX 중괄호 · 템플릿 `${ }` | `--color-code-keyword` · `-jsx-brace` · `-template-brace` | `#0000FF` | `#0000FF` | 8.07 / 7.87 |
| 제어문 (`import` `export` `if` `for` `return`) | `--color-code-control` | `#AF00DB` | `#AF00DB` | 5.13 / 5.00 |
| 함수 | `--color-code-function` | `#795E26` | `#795E26` | 5.73 / 5.59 |
| 변수 · 매개변수 · 속성 · 속성 선언 | `--color-code-variable` · `-parameter` · `-property` · `-property-key` | `#001080` | `#001080` | 14.23 / 13.88 |
| 상수 이름 (`const`로 만든 이름) | `--color-code-constant` | `#0070C1` | `#0070C1` | 4.83 / 4.70 |
| 문자열 | `--color-code-string` | `#A31515` | `#A31515` | 7.37 / 7.19 |
| 숫자 | `--color-code-number` | `#098658` | **`#097F53`** | 4.73 / 4.61 |
| 타입 · 기본 타입 | `--color-code-type` · `-type-primitive` | `#267F99` | **`#247891`** | 4.73 / 4.61 |
| 주석 | `--color-code-comment` | `#008000` | `#008000` | 4.83 / 4.70 |
| JSX 태그 · 태그 괄호 | `--color-code-tag` · `-tag-punctuation` | `#800000` | `#800000` | 10.29 / 10.03 |
| JSX 속성 (CSS 속성 이름도) | `--color-code-attribute` | `#E50000` | **`#E00000`** | 4.73 / 4.61 |
| 정규식 괄호 · 부정 | (테마 안에서만) | `#D16969` | **`#C44040`** | 4.75 / 4.63 |
| 이스케이프 문자 (`\n`), 정규식 `\|` `^` `$` | (테마 안에서만) | `#EE0000` | **`#DF0000`** | 4.77 / 4.65 |
| 정규식 본문 | (테마 안에서만) | `#811F3F` | `#811F3F` | 8.96 / 8.74 |
| CSS 값 · 마크다운 목록 기호 · JSON 키 | (테마 안에서만) | `#0451A5` | `#0451A5` | 7.24 / 7.06 |
| 잘못된 코드 표시 | (테마 안에서만) | `#CD3131` | `#CD3131` | 4.84 / 4.71 |
| 마크다운 굵게 · diff 머리 | (테마 안에서만) | `#000080` | `#000080` | 15.04 / 14.66 |

##### 낱말 종류별 최종 색 — 어두운 화면 (바탕 `#1E1E1E`, 강조 줄 `#232830`)

| 낱말 종류 | CSS 변수 (Pencil · 문서용) | VS Code Dark+ 원래 값 | 최종 값 | 대비 (바탕 / 강조 줄) |
|---|---|---|---|---|
| 본문 글자 · 연산자 · 문장 부호 | `--color-code-text` · `-operator` · `-punctuation` | `#D4D4D4` | `#D4D4D4` | 11.25 / 9.99 |
| 키워드 · JSX 태그 · JSX 중괄호 · 템플릿 `${ }` | `--color-code-keyword` · `-tag` · `-jsx-brace` · `-template-brace` | `#569CD6` | `#569CD6` | 5.65 / 5.02 |
| 제어문 | `--color-code-control` | `#C586C0` | `#C586C0` | 5.99 / 5.32 |
| 함수 | `--color-code-function` | `#DCDCAA` | `#DCDCAA` | 11.80 / 10.48 |
| 변수 · 매개변수 · 속성 · 속성 선언 · JSX 속성 | `--color-code-variable` · `-parameter` · `-property` · `-property-key` · `-attribute` | `#9CDCFE` | `#9CDCFE` | 11.18 / 9.93 |
| 상수 이름 | `--color-code-constant` | `#4FC1FF` | `#4FC1FF` | 8.26 / 7.34 |
| 문자열 | `--color-code-string` | `#CE9178` | `#CE9178` | 6.31 / 5.60 |
| 숫자 | `--color-code-number` | `#B5CEA8` | `#B5CEA8` | 9.81 / 8.72 |
| 타입 · 기본 타입 | `--color-code-type` · `-type-primitive` | `#4EC9B0` | `#4EC9B0` | 8.18 / 7.27 |
| 주석 | `--color-code-comment` | `#6A9955` | **`#6C9C57`** | 5.18 / 4.61 |
| 태그 괄호 (`<` `>` `</`) | `--color-code-tag-punctuation` | `#808080` | **`#919191`** | 5.29 / 4.70 |
| 정규식 본문 | (테마 안에서만) | `#D16969` | **`#D57575`** | 5.26 / 4.68 |
| 정규식 상수 | (테마 안에서만) | `#646695` | **`#8C8EB2`** | 5.26 / 4.67 |
| 잘못된 코드 표시 | (테마 안에서만) | `#F44747` | **`#F55D5D`** | 5.24 / 4.66 |
| `header` 범위 (거의 안 쓰임) | (테마 안에서만) | `#000080` | **`#8383FF`** | 5.28 / 4.69 |
| CSS 선택자 | (테마 안에서만) | `#D7BA7D` | `#D7BA7D` | 8.90 / 7.91 |
| 마크다운 목록 기호 | (테마 안에서만) | `#6796E6` | `#6796E6` | 5.62 / 5.00 |
| 이름표(label) | (테마 안에서만) | `#C8C8C8` | `#C8C8C8` | 9.96 / 8.85 |

**굵게**가 고친 값입니다. 고친 테마 두 벌은 쓰는 색 18개가 모두 바탕과 강조 줄 위에서 4.61:1 이상입니다.

##### 고친 값과 VS Code 원래 값의 차이

| 화면 | 원래 값 → 최종 값 | 쓰이는 범위 | 대비 (가장 낮은 바탕 기준) | 색 차이 (CIEDE2000) |
|---|---|---|---|---|
| 밝은 | `#098658` → `#097F53` | 숫자, enum 멤버, 단위 | 4.22 → 4.61 | 2.5 |
| 밝은 | `#267F99` → `#247891` | 타입, 클래스, 네임스페이스 | 4.20 → 4.61 | 2.6 |
| 밝은 | `#E50000` → `#E00000` | JSX · HTML 속성 이름, CSS 속성 이름 | 4.44 → 4.61 | 1.1 |
| 밝은 | `#D16969` → `#C44040` | 정규식 괄호 · 문자 묶음 | 3.24 → 4.63 | 11.2 |
| 밝은 | `#EE0000` → `#DF0000` | 이스케이프 문자, 정규식 `\|` `^` `$` | 4.15 → 4.65 | 3.2 |
| 어두운 | `#6A9955` → `#6C9C57` | 주석, 마크다운 인용 기호 | 4.44 → 4.61 | 1.0 |
| 어두운 | `#808080` → `#919191` | 태그 괄호 | 3.75 → 4.70 | 6.1 |
| 어두운 | `#D16969` → `#D57575` | 정규식 | 4.19 → 4.68 | 3.3 |
| 어두운 | `#646695` → `#8C8EB2` | 정규식 상수 | 2.73 → 4.67 | 15.4 |
| 어두운 | `#F44747` → `#F55D5D` | 잘못된 코드 표시 | 4.12 → 4.66 | 4.5 |
| 어두운 | `#000080` → `#8383FF` | `header` 범위 | 1.04 → 4.69 | 40.2 |

색 차이 2 안팎은 나란히 놓아야 겨우 보이는 정도입니다. 흔히 보는 낱말(숫자 · 타입 · 속성 · 주석)은 모두 3 아래입니다. 크게 바뀐 셋(정규식 상수, 밝은 정규식 괄호, `header`)은 원래 값이 바탕과 거의 구분되지 않던 색이고, 글에서 드물게 나옵니다.

##### 코드에서 쓰는 법

**Shiki의 `light-plus` · `dark-plus` 테마를 그대로 가져와, 위 표의 고친 색과 밝은 바탕만 덮어쓴 사용자 테마 두 벌을 씁니다.** 이 방식이 맞습니다. 낱말을 나누는 규칙(scope)은 VS Code 테마 그대로 두고 색 값만 바꾸므로, VS Code와 같은 자리에 같은 계열의 색이 나옵니다. 아래 코드로 만든 테마를 실제로 토큰화해 위 표와 같은 색이 나오는 것을 확인했습니다.

1. 의존성: `@shikijs/themes`를 개발 의존성으로 더합니다. Astro가 쓰는 shiki와 같은 버전(지금 4.6.0)으로 맞춥니다. pnpm은 Astro 안의 shiki를 프로젝트에서 바로 불러올 수 없게 하기 때문입니다.
2. 테마 만들기 (예: `src/shared/content/codeThemes/index.ts`):

```ts
import darkPlus from "@shikijs/themes/dark-plus";
import lightPlus from "@shikijs/themes/light-plus";

type Theme = typeof lightPlus;
type ColorMap = Record<string, string>;

/** 테마의 글자색 가운데 map에 있는 값만 바꾸고, 바탕색을 정합니다 */
function recolor(
  theme: Theme,
  name: string,
  map: ColorMap,
  background: string,
): Theme {
  const upper = Object.fromEntries(
    Object.entries(map).map(([from, to]) => [from.toUpperCase(), to]),
  );
  return {
    ...theme,
    name,
    displayName: name,
    colors: { ...theme.colors, "editor.background": background },
    tokenColors: theme.tokenColors?.map((rule) => {
      const foreground = rule.settings?.foreground?.toUpperCase();
      return foreground && upper[foreground]
        ? { ...rule, settings: { ...rule.settings, foreground: upper[foreground] } }
        : rule;
    }),
  };
}

export const blogLightPlus = recolor(
  lightPlus,
  "blog-light-plus",
  {
    "#098658": "#097F53", // 숫자
    "#267F99": "#247891", // 타입
    "#E50000": "#E00000", // 속성 이름
    "#D16969": "#C44040", // 정규식 괄호
    "#EE0000": "#DF0000", // 이스케이프 문자
  },
  "#F6F8FA",
);

export const blogDarkPlus = recolor(
  darkPlus,
  "blog-dark-plus",
  {
    "#6A9955": "#6C9C57", // 주석
    "#808080": "#919191", // 태그 괄호
    "#D16969": "#D57575", // 정규식
    "#646695": "#8C8EB2", // 정규식 상수
    "#F44747": "#F55D5D", // 잘못된 코드
    "#000080": "#8383FF", // header
  },
  "#1E1E1E",
);
```

3. `astro.config.ts`의 `markdown.shikiConfig.themes`를 `{ light: blogLightPlus, dark: blogDarkPlus }`로 바꿉니다. `defaultColor: "light-dark()"`는 지금처럼 둡니다. 그러면 글자색과 칸 바탕이 `light-dark(밝은 값, 어두운 값)`으로 나가고, `color-scheme`(`data-theme`)만 바꾸면 함께 바뀝니다.
4. 대비가 깨지지 않게 테스트를 둡니다. 두 테마의 모든 `tokenColors` 글자색이 바탕과 강조 줄 바탕 모두에서 4.5:1 이상인지 확인합니다. 이 검사는 Shiki를 올리거나 테마를 바꿀 때 걸러 주는 그물입니다.
5. 위 `--color-code-*` 낱말 변수는 Pencil과 문서용입니다. 코드에서는 낱말 색을 Shiki 테마가 칠합니다. CSS 변수로 두는 것은 틀 색(`--color-code-bg`, `-border`, `-meta`, `-success`, `-line-number`, `-line-highlight`, `-line-highlight-bar`)뿐입니다. `--color-code-bg`는 Shiki 바탕과 같은 `light-dark(#F6F8FA, #1E1E1E)`로 두어 머리 줄과 코드 부분의 색을 맞춥니다.

##### 가독성 값 (확정)

| 항목 | 값 | 코드에서 |
|---|---|---|
| 글자 크기 | 15px, 휴대폰(767px 이하) 14px | `--font-size-code` |
| 줄 간격 | 1.65 | `--line-height-code` |
| 글꼴 | JetBrains Mono. 코드 속 한글(주석 · 문자열)은 D2Coding 부분 글꼴 | `--font-mono: "JetBrains Mono", "Blog Code Hangul", "D2Coding", ui-monospace, SFMono-Regular, Menlo, Consolas, "Pretendard Variable", monospace`. D2Coding(OFL)에서 글에 쓰인 한글만 남긴 부분 글꼴을 `src/shared/styles/fonts/`에 두고 `unicode-range`를 한글 범위로 제한합니다(`pnpm fonts:code`가 만듦). D2Coding의 OFL은 「D2Coding」을 예약 글꼴 이름(Reserved Font Name)으로 정해서, 수정본인 부분 글꼴은 그 이름을 쓸 수 없습니다. 그래서 이름을 「Blog Code Hangul」로 바꿨고, 저작권 표시와 OFL 전문(`fonts/D2Coding-OFL.txt`)을 함께 둡니다. 뒤의 `"D2Coding"`은 컴퓨터에 D2Coding을 깐 사람을 위한 것입니다. 둘 다 없으면 Pretendard가 대신합니다. Pencil 시안은 구글 글꼴 Nanum Gothic Coding(변수 `font-mono-hangul`)으로 대신 그렸습니다 |
| 글자 이음 | 끔 (`=>`, `!==`가 이어 붙지 않음) | `font-variant-ligatures: none; font-feature-settings: "calt" 0, "liga" 0;`. Pencil 그림에서는 끌 수 없어 이어 보입니다 |
| 탭 폭 | 2 | `tab-size: 2`. 글 속 코드의 들여쓰기도 스페이스 2칸 |
| 강조 줄 | 짚어 줄 줄에만, 한 칸에 세 줄 이하 | 바탕 `--color-code-line-highlight` + 왼쪽 3px `--color-code-line-highlight-bar`. 코드 칸 메타에 줄 번호를 적는 방식(` ```ts {3,5-6} `)을 권합니다. 코드를 복사해도 표시가 섞이지 않습니다. `@shikijs/transformers`의 `transformerMetaHighlight`로 줄에 `highlighted` class를 붙입니다 |
| 줄 번호 | 20줄 넘는 코드만 | 작은 transformer가 줄 수를 세어 `pre`에 `data-line-numbers`를 붙이고, CSS counter(`::before`)로 그립니다. 가상 요소라서 복사에 섞이지 않습니다. 줄 번호 열은 22px, 코드와 사이 16px |
| 넘침 | 줄바꿈하지 않고 칸 안에서 가로 스크롤 | `white-space: pre; overflow-x: auto;`, 칸에 `tabindex="0"`(키보드로도 밀 수 있게) |
| 안쪽 여백 | 16 · 20px, 휴대폰 12 · 16px | 줄 번호나 강조 줄이 있으면 줄마다 좌우 20px를 두어 강조 바탕이 칸 끝까지 닿게 합니다 |

### 2.4 시안에서 고친 값과 이유

| 고친 곳 | 시안 값 | 고친 값 | 이유 |
|---|---|---|---|
| 코드 칸 색 | GitHub 계열 (`github-light-default` 주석 `#6E7781` 4.27:1 등) | VS Code Light+ / Dark+ + 대비 보정 11색 (2.3 「코드」) | 이스타가 VS Code처럼 낱말 대비가 확실한 색을 골랐습니다(2026-11-21). VS Code 값 가운데 4.5:1에 모자라는 색만 고쳤습니다 |
| 글 목록 연도 숫자 | 선 색 `#E5E7EB` · `#2A2F38` (1.24:1 · 1.41:1) | `--color-text-subtle` `#8A929C` · `#616A78` (3.15:1 · 3.46:1) | 연도도 읽는 글자입니다. 48px 큰 글자라 3:1 기준을 적용했습니다 |
| 슬라이더 줄 등 조작 장치 경계 | 선 색 `#E5E7EB` (1.24:1) | `--color-border-strong` `#7D8590` · `#6E7785` (3.73:1 · 4.18:1) | 조작 장치의 모양을 알리는 선은 3:1이 필요합니다 |
| 새로 더한 색 | 없음 | warn · warn-soft, good-soft, bad-soft, link-visited, accent-hover, on-accent, focus, surface-hover, data-1~4 | 주의 칸, 좋은 예 · 나쁜 예, 링크 상태, 데모 범주에 필요했습니다. 모두 위 기준을 넘깁니다 |

## 3. 글꼴과 글자 단계

### 3.1 글꼴

| CSS 변수 | 값 |
|---|---|
| `--font-sans` | `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif` |
| `--font-mono` | `"JetBrains Mono", "Blog Code Hangul", "D2Coding", ui-monospace, SFMono-Regular, Menlo, Consolas, "Pretendard Variable", monospace` |

- 제목과 본문은 Pretendard Variable 하나로 씁니다. 코드 속 한글(주석 · 문자열)은 D2Coding 부분 글꼴 「Blog Code Hangul」이 그립니다(2.3 「코드」의 가독성 값, 이름을 바꾼 까닭도 거기에 있습니다). 불러오지 못하면 뒤쪽 Pretendard가 대신합니다.
- Pencil 시안은 구글 글꼴만 쓸 수 있어서 Pretendard 자리에 Noto Sans KR을 넣었습니다. Pencil 변수 `font-sans`의 값이 `Noto Sans KR`인 까닭입니다. 실제 사이트는 Pretendard입니다.
- Pretendard는 한글 일부씩 나눈 dynamic subset을 저장소에 두고(self-host) `font-display: swap`으로 씁니다. 가변 글꼴이라 조각 하나에 모든 굵기가 들어 있습니다. 미리 받는(preload) 조각은 `PretendardVariable.subset.91.woff2` 하나입니다(10장).
- 굵기 토큰은 넷만 씁니다.

| CSS 변수 | 값 | 쓰는 곳 |
|---|---|---|
| `--font-weight-regular` | 400 | 본문, 설명 |
| `--font-weight-semibold` | 600 | h3, 목록 글 제목, 지금 읽는 목차, 고른 칩 |
| `--font-weight-bold` | 700 | h1, h2, 사이트 이름, 칸 제목 |
| `--font-weight-heavy` | 800 | 글 목록 연도, 404 숫자 |

### 3.2 글자 단계

휴대폰 값은 767px 이하에서 같은 토큰의 값만 바뀝니다. Pencil에서는 `device` 축(`desktop` · `mobile`)이 같은 일을 합니다.

| 단계 | 크기 토큰 | 넓은 화면 | 휴대폰 | 줄 간격 토큰 | 줄 간격 | 굵기 | 자간 | 쓰는 곳 |
|---|---|---|---|---|---|---|---|---|
| display | `--font-size-display` | 48px | 36px | `--line-height-display` | 1.2 | 800 | -0.02em | 글 목록 연도, 404 숫자 |
| h1 | `--font-size-h1` | 36px | 26px | `--line-height-h1` | 1.35 (휴대폰 1.4) | 700 | -0.02em | 글 제목. 페이지에 하나 |
| title | `--font-size-title` | 28px | 24px | `--line-height-title` | 1.4 | 700 | -0.015em | 글 목록 · 시리즈 · 소개 페이지의 h1(페이지 제목). 글 제목보다 한 단계 작게 둡니다 |
| h2 | `--font-size-h2` | 26px | 22px | `--line-height-h2` | 1.4 | 700 | -0.015em | 본문 큰 제목 |
| h3 | `--font-size-h3` | 20px | 18px | `--line-height-h3` | 1.5 | 600 | -0.01em | 본문 작은 제목, 댓글 제목 |
| lead | `--font-size-lead` | 18px | 16px | `--line-height-lead` | 1.65 | 400 | 0 | 글 요약. 사이트 이름(700), 목록 글 제목(600) |
| body | `--font-size-body` | 17px | 16px | `--line-height-body` | 1.75 | 400 | 0 | 본문 문단, 목록, 인용 |
| body-sm | `--font-size-body-sm` | 15px | 14px | `--line-height-body-sm` | 1.6 | 400 | 0 | 목록 요약, 표, 강조 칸 내용(줄 간격 1.7), 머리말 메뉴, 본문 속 코드 |
| small | `--font-size-small` | 14px | 13px | `--line-height-small` | 1.5 | 400 · 600 | 0 | 글 정보, 목차, 칩, 꼬리말 |
| caption | `--font-size-caption` | 14px | 13px | `--line-height-caption` | 1.6 | 400 | 0 | 그림 · 데모 · 표 설명 |
| label | `--font-size-label` | 13px | 12px | `--line-height-label` | 1.4 | 700 | 0 | 목차 제목, 강조 칸 제목, 「복사」 |
| code | `--font-size-code` | 15px | 14px | `--line-height-code` | 1.65 | 400 | 0 | 코드 칸 (JetBrains Mono, 한글은 D2Coding 부분 글꼴, 글자 이음 끔) |
| code-sm | `--font-size-code-sm` | 13px | 12px | `--line-height-label` | 1.4 | 400 | 0 | 코드 칸 파일 이름 |

자간은 Pretendard가 권하는 대로 제목만 조금 좁힙니다. 토큰은 `--letter-spacing-display`, `--letter-spacing-h1`, `--letter-spacing-title`, `--letter-spacing-h2`, `--letter-spacing-h3`이고 값은 위 표의 em 값입니다(Pencil은 px로 환산해 넣었습니다).

### 3.3 줄바꿈과 한글

- 본문은 `word-break: keep-all`로 낱말 가운데서 줄을 바꾸지 않습니다.
- 긴 주소와 코드 이름은 `overflow-wrap: anywhere`로 칸 밖으로 넘치지 않게 합니다.
- 제목은 `text-wrap: balance`, 문단은 `text-wrap: pretty`를 씁니다.
- 글 제목에 손으로 줄바꿈을 넣지 않습니다. 시안의 h1 줄바꿈은 화면 폭을 보여 주려는 것입니다.

### 3.4 본문 흐름 간격

| 자리 | 넓은 화면 | 휴대폰 |
|---|---|---|
| 문단 · 목록 · 코드 칸 · 그림 · 데모 · 강조 칸 사이 | 20px (`--space-5`) | 20px |
| h2 위 / 아래 | 56px / 24px | 40px / 20px |
| h3 위 / 아래 | 40px / 12px | 32px / 12px |
| 글 머리(구분선)와 첫 문단 사이 | 20px | 20px |
| 목록 항목 사이 | 8px | 8px |

CSS로는 `.prose > * + * { margin-top: var(--space-5) }`를 기본으로 두고, 제목에만 `margin-top`을 더 줍니다.

## 4. 간격, 모서리, 선, 그림자

### 4.1 간격

4px 단위입니다. 토큰 번호 × 4 = px입니다. 표에 없는 값은 쓰지 않습니다.

| CSS 변수 | 값 | 쓰는 곳 |
|---|---|---|
| `--space-1` | 4px | 아이콘과 글자 사이(작게), 제목과 요약 사이 |
| `--space-2` | 8px | 칩 사이, 글 정보 낱말 사이, 목록 항목 사이 |
| `--space-3` | 12px | 목차 항목 사이, 칩 좌우 안쪽, 그림과 설명 사이 |
| `--space-4` | 16px | 코드 칸 세로 안쪽, 목록 줄 위아래, 강조 칸 세로 안쪽 |
| `--space-5` | 20px | 문단 사이, 휴대폰 좌우 여백, 코드 칸 · 강조 칸 가로 안쪽 |
| `--space-6` | 24px | h2 아래, 댓글 칸 안쪽, 목차 sticky top |
| `--space-8` | 32px | 데모 화면 가로 안쪽 |
| `--space-10` | 40px | 넓은 화면 좌우 여백, 데모 화면 세로 안쪽, h3 위 |
| `--space-12` | 48px | 휴대폰 글 끝 여백 |
| `--space-14` | 56px | 글 위 여백, h2 위, 목록 묶음 사이 |
| `--space-18` | 72px | 본문과 목차 사이 (`--layout-gap`) |
| `--space-24` | 96px | 글 끝 여백, 404 위아래 |

### 4.2 모서리

| CSS 변수 | 값 | 쓰는 곳 |
|---|---|---|
| `--radius-sm` | 4px | 본문 속 코드, 링크 포커스 테두리 |
| `--radius-md` | 8px | 코드 칸, 강조 칸, 접는 목차, 아이콘 단추, 이전 · 다음 칸, 데모 안 상자 |
| `--radius-lg` | 12px | 데모 틀, 그림 |
| `--radius-full` | 999px | 칩 |

### 4.3 선

| CSS 변수 | 값 | 쓰는 곳 |
|---|---|---|
| `--border-width` | 1px | 구분선, 칸 테두리 |
| `--border-width-strong` | 2px | 고른 상태, 포커스 테두리, 지금 읽는 목차 왼쪽 선 |
| `--border-width-callout` | 3px | 강조 칸 · 인용 왼쪽 선 |

### 4.4 그림자

쓰지 않습니다. `box-shadow`가 필요해 보이면 1px 선과 `--color-surface`로 대신합니다. 어두운 화면에서는 그림자가 거의 보이지 않아 두 화면의 모양이 달라지기 때문입니다. Windows 고대비 모드(`forced-colors`)에서도 선은 남고 그림자는 사라집니다.

## 5. 화면 폭과 배치

### 5.1 폭 구간

휴대폰부터 짜고 `min-width` 미디어 쿼리로 넓혀 갑니다. CSS 변수는 `@media` 안에 쓸 수 없으므로 숫자를 그대로 씁니다.

| 구간 | 폭 | 배치 | 머리말 | 좌우 여백 | 본문 글자 |
|---|---|---|---|---|---|
| 휴대폰 | 0 – 767px | 1단. 본문 폭 = 화면 − 40px. 목차는 글 머리 아래 접는 상자 | 56px | 20px | 16px |
| 태블릿 | 768 – 1199px | 1단. 본문 680px 가운데. 목차는 접는 상자 | 72px | 40px 이상 | 17px |
| 넓은 화면 | 1200px 이상 | 본문 680 + 사이 72 + 목차 220 = 972px을 가운데 둡니다. 목차는 본문 첫 문단 높이에서 시작하고 `position: sticky; top: 24px` | 72px | 40px 이상 | 17px |

### 5.2 배치 토큰

| CSS 변수 | 값 | 쓰는 곳 |
|---|---|---|
| `--content-width` | 680px | 본문, 데모, 코드 칸, 그림, 표의 최대 폭(한글 약 40자) |
| `--toc-width` | 220px | 넓은 화면 오른쪽 목차 |
| `--layout-gap` | 72px | 본문과 목차 사이 |
| `--page-max-width` | 1200px | 머리말 · 꼬리말 안쪽 최대 폭 |
| `--page-padding-inline` | 20px → 40px (768px 이상) | 화면 좌우 여백 |
| `--header-height` | 56px → 72px (768px 이상) | 머리말 높이. 머리말은 따라오지 않습니다(static) |
| `--toc-sticky-top` | 24px | 넓은 화면 목차의 sticky `top` (`scroll-padding-top`과 같음) |

- 목차는 본문 첫 문단과 같은 높이에서 시작합니다. 글 머리는 grid 첫 줄의 왼쪽 칸에만 두고, 본문과 목차를 둘째 줄에 둡니다. 글 머리 옆 오른쪽 칸은 비워 둡니다. 제목이 길든 짧든 목차가 본문과 나란히 시작하게 하려는 것입니다.
- 목차의 sticky `top`은 `--toc-sticky-top` 24px(`--space-6`)입니다. 머리말이 따라오지 않으므로(static) 화면 위에서 24px에 멈춥니다. 아래 `scroll-padding-top`과 같은 값이라, 목차 링크로 이동한 제목과 목차 위쪽이 같은 높이에 섭니다. 머리말을 따라오게 바꾸면 `--header-height + 24px`로 고칩니다. (예전 기초 보드의 「머리말 + 24px」와 문서의 96px를 이 값으로 합쳤습니다.)
- 제목 앵커로 이동할 때 제목이 화면 맨 위에 붙지 않도록 `scroll-padding-top: 24px`을 둡니다.
- 표와 긴 코드만 가로로 넘칠 수 있습니다. 넘치는 칸에만 `overflow-x: auto`를 주고, 페이지 전체는 가로로 밀리지 않게 합니다.

## 6. 아이콘, 움직임, 포커스

### 6.1 아이콘

- lucide 하나만 씁니다. 선 굵기 2(기본값), 색은 `currentColor`로 글자색을 따릅니다.
- 크기 토큰:

| CSS 변수 | 값 | 쓰는 곳 |
|---|---|---|
| `--icon-size-sm` | 14px | 코드 칸 복사, 바깥 링크 |
| `--icon-size-md` | 16px | 강조 칸 제목, 이전 · 다음 화살표, 데모 안 화살표 |
| `--icon-size-lg` | 18px | 머리말, 데모 조작, 접는 목차, h2 앵커 |
| `--icon-size-xl` | 20px | 휴대폰 머리말 (선택) |

- 쓰는 아이콘: `rss`, `moon`, `sun`, `menu`, `x`, `copy`, `check`, `play`, `pause`, `rotate-ccw`, `chevron-down`, `chevron-up`, `link`, `arrow-left`, `arrow-right`, `external-link`, `lightbulb`(핵심), `triangle-alert`(주의), `info`(참고), `image`(그림 자리).
- 아이콘만 있는 단추에는 `aria-label`을 꼭 붙입니다. 꾸밈 아이콘은 `aria-hidden="true"`로 숨깁니다.

### 6.2 움직임

| CSS 변수 | 값 | 쓰는 곳 |
|---|---|---|
| `--duration-fast` | 120ms | 링크 · 단추 색 바뀜 |
| `--duration-base` | 200ms | 접는 목차 열림, 「복사됨」 바뀜 |
| `--duration-slow` | 320ms | 데모 안 단계 이동의 기본 |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | 모든 전환 |

`prefers-reduced-motion: reduce`일 때:

- 모든 전환과 애니메이션 시간을 0.01ms로 바꿉니다.
- `scroll-behavior: smooth`를 끕니다.
- 데모는 자동 재생하지 않고 멈춤 상태로 시작합니다.
- 데모의 이어지는 움직임은 단계별 정지 화면과 슬라이더로 대신합니다.

### 6.3 포커스

- `:focus-visible`에 `outline: 2px solid var(--color-focus); outline-offset: 2px;`를 줍니다. 마우스로 누를 때는 보이지 않고 키보드로 옮길 때만 보입니다.
- 모서리는 부품 모서리를 따릅니다. 링크는 `--radius-sm`입니다.
- `outline: none`으로 지우지 않습니다. `box-shadow`로 대신하지도 않습니다(고대비 모드에서 사라집니다).
- 포커스 색은 두 화면 모두 바탕과 칸에서 3:1을 넘습니다(밝은 6.16 · 5.79, 어두운 7.59 · 7.00).

## 7. 부품

### 7.1 한눈에 보기

Pencil 위치는 모두 `design/blog.pen` 안입니다. 「Pencil id」는 컴포넌트(또는 variants 묶음)의 id이고, 상태별 id는 각 부품 절에 적었습니다. 「코드」는 2026-11-21 3단계 코드 기준 위치입니다.

| 부품 | Pencil 프레임 이름 | Pencil id | 상태 축 | 코드 |
|---|---|---|---|---|
| 링크 | 링크 | `fXlRl` | state: default · hover · focus · visited | 본문 `a` 스타일 (`widgets/post/PostBody`) |
| 아이콘 단추 | 아이콘 단추 | `Bh8HQ` | state: default · hover · focus | `primitives/ui/IconButton` (React 데모 안은 `primitives/ui/DemoControls`가 같은 토큰으로 그림) |
| 칩 | 칩 | `prFrh` | state: default · hover · selected · focus | `primitives/ui/Chip`, `widgets/series/SeriesChips` |
| 슬라이더 | 슬라이더 | `taHDx` | state: default · focus | `primitives/ui/DemoControls` 안 `input[type=range]` |
| 건너뛰기 링크 | 건너뛰기 링크 | `Y9Engv` | 없음 | `primitives/ui/SkipLink` (`primitives/layout/Document`의 `<body>` 맨 앞) |
| 머리말 | 머리말 | `mg60A` | device: desktop · mobile | `widgets/site/SiteHeader`, `features/site/ThemeToggle` |
| 꼬리말 | 꼬리말 | `m9iWo` | device: desktop · mobile | `widgets/site/SiteFooter` |
| 글 목록 항목 | 글 목록 항목 | `A33N0` | state: default · hover | `widgets/post/PostList` |
| 목차 항목 | 목차 항목 | `azbFv` | state: default · current · hover × level: h2 · h3 | `widgets/post/TableOfContents/ui/TocList` |
| 목차 (넓은 화면) | 목차 | `d3ZMZg` | 없음 | `TableOfContents` `variant="list"` |
| 접는 목차 | 접는 목차 | `Hrrbc` | state: closed · open | `TableOfContents` `variant="collapsible"` |
| 이전 · 다음 칸 | 이전 다음 칸 | `kUT78` | direction: prev · next × state: default · hover | `widgets/post/PostNav/ui/PostNavLink` |
| 이전 · 다음 글 | 이전 다음 글 | `v740G` | 없음 (칸 두 개 조합) | `widgets/post/PostNav` |
| 글 머리 | 글 머리 | `tV22U` | 없음 | `widgets/post/PostHeader` |
| 제목 앵커 | 제목 | `bJWiw` | level: h2 · h3 × state: default · hover | `primitives/ui/AnchorHeading`, `PostBody/ui/ContentHeading2 · 3` |
| 본문 속 코드 | 본문 속 코드 | `egCcp` | 없음 | 본문 `code` 스타일 (`widgets/post/PostBody`) |
| 코드 칸 | 코드 칸 | `CX4xi` | state: idle · copied | `PostBody/ui/CodeBlock`, `features/post/CopyCodeButton`, `shared/content/codeThemes` |
| 강조 칸 | 강조 칸 | `eknYZ` | kind: key · warn · note | `primitives/ui/Callout` |
| 그림과 설명 | 그림과 설명 | `I437uy` | 없음 | `primitives/ui/Figure` |
| 표 | 표 | `J9t3G` | 없음 | `PostBody/ui/ContentTable` (표 설명은 `Figure captionSide="top"`) |
| 인용 | 인용 | `Myj7O` | 없음 | 본문 `blockquote` 스타일 (`widgets/post/PostBody`) |
| 데모 틀 | 데모 틀 | `M3NVPX` | state: paused · playing · no-js | `primitives/ui/DemoFrame`, `primitives/ui/DemoControls` |
| 댓글 자리 | 댓글 자리 | `GbsK7` | 없음 | `widgets/post/Comments` |
| 404 본문 | 404 본문 | `W40Po` | 없음 | `widgets/site/NotFoundMessage` |

보드 안 영역 id: 기초 보드의 01 색 `E8coR8`, 02 글자 `IXwNQ`, 03 간격 · 모서리 · 선 `Z5DM2I`, 04 화면 폭과 배치 `e2gfM`, 05 아이콘 · 움직임 · 포커스 `UGtGw`. 부품 보드의 1 기본 조작 `liC3R`, 2 틀과 탐색 `XI5Ey`, 3 본문 `C18uyX`, 4 데모와 페이지 `kzhtc`, 5 어두운 화면과 휴대폰 `PgE4f`.

### 7.2 링크

- Pencil: 「링크」 `fXlRl`. 기본 `SdtPK` · 올림 `RTZf1` · 포커스 `QGa2Z` · 방문 `IQdpC`
- 구성: 글자 하나. 본문 크기를 따릅니다.
- 상태:
  - 기본: `--color-accent`, 밑줄 1px, `text-underline-offset: 3px`
  - 올림: `--color-accent-hover`, 밑줄 2px
  - 포커스: 포커스 테두리, `--radius-sm`
  - 방문: `--color-link-visited`. 본문 속 링크에만 씁니다. 머리말 · 목차 · 목록에는 쓰지 않습니다.
- 쓰는 법: 본문 속 링크와 404 · 댓글 자리처럼 문장 사이에 놓인 링크는 늘 밑줄을 둡니다. 링크 글은 갈 곳을 말합니다(「렌더링 단계 정리」). 머리말 메뉴, 목차, 글 목록 항목, 이전 · 다음 칸은 자리로 링크임을 알 수 있어 평소엔 밑줄을 두지 않고 올릴 때만 둡니다.
- Pencil은 글자 밑줄 속성을 저장하지 못합니다. 그래서 링크 컴포넌트의 밑줄은 글자 칸의 아래 테두리(1px, 올림 2px)로 그렸습니다. 예전 시안에서 404 링크에 밑줄이 없던 것은 이 때문이고, 지금은 밑줄이 보입니다.
- 쓰지 않는 법: 「여기」, 「이 링크」 같은 글. 색만 바꾸고 밑줄을 지우기. 바깥 링크를 새 창으로 열기(`target="_blank"`)는 하지 않습니다. 꼭 필요하면 `external-link` 아이콘과 「새 창」 안내를 붙입니다.

### 7.3 아이콘 단추

- Pencil: 「아이콘 단추」 `Bh8HQ`. 기본 `Owo4g` · 올림 `HkCTt` · 포커스 `wsfAi`
- 구성: 36×36px(휴대폰 40×40px) 칸, 가운데 18px 아이콘, `--radius-md`.
- 상태: 기본은 아이콘 `--color-text-muted`, 올림은 바탕 `--color-surface-hover`와 아이콘 `--color-text`, 포커스는 포커스 테두리.
- 쓰는 법: RSS, 밝기 바꾸기, 메뉴, 데모 재생 · 처음으로. `aria-label` 필수. 밝기 단추는 지금 상태가 아니라 누르면 될 상태를 말합니다(「어두운 화면으로」).
- 쓰지 않는 법: 글자로 쓰면 더 분명한 동작(「글 목록으로」)을 아이콘만으로 만들기.
- Pencil 변수는 너비 · 높이를 받지 않아서, 휴대폰 인스턴스는 40×40을 직접 덮어썼습니다. 코드에서는 `--icon-button-size: 36px`(767px 이하 40px)로 둡니다.

### 7.4 칩

- Pencil: 「칩」 `prFrh`. 기본 `N1QMkh` · 올림 `gHGQX` · 고름 `iJMPy` · 포커스 `TuSbk`
- 구성: 높이 32px, 좌우 12px, `--radius-full`, 체크 아이콘(고를 때만) · 이름(small) · 수(label 크기, 보조색).
- 상태: 기본 `--color-border` 테두리, 올림 `--color-surface-hover` 바탕과 `--color-border-strong` 테두리, 고름 `--color-accent-soft` 바탕 · `--color-accent` 테두리 · 이름 600 · 체크 아이콘, 포커스 2px 포커스 테두리.
- 쓰는 법: 시리즈와 분류로 거르기. 링크로 쓰면 `<a>`, 거르기 단추로 쓰면 `<button aria-pressed>`입니다.
- 쓰지 않는 법: 문장 속 강조나 장식 이름표. 한 줄에 여덟 개 넘게 늘어놓기.

### 7.5 슬라이더

- Pencil: 「슬라이더」 `taHDx`. 기본 `p5EjtZ` · 포커스 `ZWMAF`
- 구성: 진행 줄(`--color-accent`, 4px) · 손잡이(16px, 바탕색 2px 테두리) · 남은 줄(`--color-border-strong`, 4px). 폭은 남는 자리를 채웁니다.
- 상태: 포커스면 손잡이 바깥에 2px 포커스 고리.
- 쓰는 법: 데모 조작 줄 안에서만 씁니다. `<input type="range">`에 `aria-label`(무엇을 바꾸는지)과 `aria-valuetext`(값을 말로, 예: 「진행 40%」)를 줍니다. 누르는 영역은 높이 44px 이상으로 잡습니다.
- 쓰지 않는 법: 값이 둘셋뿐인 고르기(칩이나 라디오가 낫습니다).

### 7.6 건너뛰기 링크

- Pencil: 「건너뛰기 링크」 `Y9Engv`
- 구성: `--color-accent` 바탕, `--color-on-accent` 글자 「본문으로 건너뛰기」, 안쪽 10 · 16px.
- 쓰는 법: 모든 페이지 `<body>` 맨 앞에 둡니다. 평소엔 화면 밖에 두고 포커스를 받으면 왼쪽 위에 나타납니다. `href="#main"`이고 `<main id="main" tabindex="-1">`입니다.

### 7.7 머리말

- Pencil: 「머리말」 `mg60A`. 넓은 화면 `r6OXd` · 휴대폰 `W5ZR4d`
- 구성:
  - 넓은 화면: 높이 72px, 안쪽 폭 최대 1200px. 사이트 이름(lead 700) · 메뉴(글 · 시리즈 · 소개, body-sm) · RSS 단추 · 밝기 단추
  - 휴대폰: 높이 56px. 사이트 이름 · 밝기 단추 · 메뉴 단추. 메뉴는 `<details>`로 펼칩니다.
- 상태: 지금 페이지의 메뉴는 `aria-current="page"`, 글자 `--color-text`와 600.
- 쓰는 법: 화면에 붙어 따라오지 않습니다(`position: static`). 글 읽기를 가리지 않기 위해서입니다.
- 쓰지 않는 법: 메뉴를 다섯 개 넘게 늘리기, 검색창 넣기(검색은 아직 두지 않습니다).

### 7.8 꼬리말

- Pencil: 「꼬리말」 `m9iWo`. 넓은 화면 `qgxES` · 휴대폰 `oHQDs`
- 구성: 위쪽 1px 선. 「© 2026 이스타」 · RSS · GitHub · 개인정보 처리 안내 (small, 보조색). 휴대폰은 두 줄로 쌓습니다.
- 쓰는 법: 개인정보 처리 안내 링크는 PostHog를 쓰므로 빼지 않습니다.

### 7.9 글 목록 항목

- Pencil: 「글 목록 항목」 `A33N0`. 기본 `d9vhG` · 올림 `wn9Tj`
- 구성: 날짜(MM.DD, small) · 제목(lead 600)과 한 줄 요약(body-sm, 보조색) · 읽는 시간(small). 아래쪽 1px 선.
- 상태: 올림이면 제목이 `--color-accent`와 밑줄.
- 쓰는 법: 항목 전체가 하나의 링크입니다. 링크 이름은 제목만 읽히게 하고, 날짜와 시간은 `<time datetime>`으로 둡니다. 연도 묶음 위에 display 크기 연도(`--color-text-subtle`)를 둡니다.
- 쓰지 않는 법: 썸네일 넣기, 요약을 두 줄 넘게 쓰기(요약은 description을 씁니다).

### 7.10 목차 항목 · 목차 · 접는 목차

- Pencil:
  - 「목차 항목」 `azbFv`: 기본 · h2 `RL8Ny`, 지금 · h2 `G4Bn9X`, 올림 · h2 `FDgr2`, 기본 · h3 `RFzFI`, 지금 · h3 `A1O07F`
  - 「목차」 `d3ZMZg` (항목 자리 `ilCJU`는 목차 항목 인스턴스를 넣는 slot)
  - 「접는 목차」 `Hrrbc`: 닫힘 `Q2AGEp` · 열림 `vEVVR`
- 구성:
  - 목차 항목: small 글자, 왼쪽 안쪽 15px(h3는 27px).
  - 목차: 「이 글의 목차」(label) + 왼쪽 1px 선 목록. 폭 220px.
  - 접는 목차: 1px 테두리 상자, 머리 「이 글의 목차 · 6개」 + `chevron-down`. 열면 아래에 같은 목록.
- 상태: 기본은 보조색, 올림은 `--color-text`와 밑줄, 지금 읽는 제목은 `--color-accent` · 600 · 왼쪽 2px 강조색 선(`aria-current="location"`).
- 쓰는 법:
  - h2와 h3만 싣습니다. h2가 셋 미만인 짧은 글은 목차를 두지 않습니다.
  - 넓은 화면(1200px 이상)은 오른쪽 목차, 그보다 좁으면 글 머리 아래 접는 목차입니다.
  - 접는 목차는 `<details><summary>`로 만들어 JavaScript 없이도 열립니다. 지금 위치 강조만 스크립트가 합니다.
- 쓰지 않는 법: h4까지 싣기, 목차 글을 본문 제목과 다르게 줄이기.

### 7.11 이전 · 다음 글

- Pencil: 「이전 다음 칸」 `kUT78` (이전 · 기본 `J0WK8`, 다음 · 기본 `dhP7E`, 이전 · 올림 `VtB9E`), 조합 「이전 다음 글」 `v740G`
- 구성: 1px 테두리 칸 두 개. 위에 「← 이전 글」 / 「다음 글 →」(small, 보조색), 아래 제목(body-sm 600). 다음 글은 오른쪽 정렬.
- 상태: 올림이면 테두리 `--color-border-strong`, 제목 `--color-accent`와 밑줄.
- 쓰는 법: 글 끝, 댓글 위에 둡니다. 같은 시리즈면 시리즈 순서, 아니면 발행일 순서입니다. 휴대폰은 위아래로 쌓습니다. 한쪽이 없으면 빈 칸을 두지 않고 하나만 둡니다.

### 7.12 글 머리

- Pencil: 「글 머리」 `tV22U`
- 구성: 글 정보 줄(분류 강조색 600 · 쓴 날 · 읽는 시간 · 고친 날) → h1 → 요약(lead, 보조색) → 1px 구분선. 사이 20px.
- 쓰는 법:
  - h1은 frontmatter `title`, 요약은 `description`입니다.
  - 「고친 날」은 `updatedAt`이 있고 쓴 날과 다를 때만 보입니다. 시안 화면들은 고친 날을 숨긴 모습입니다.
  - 날짜는 넓은 화면에서 「2026년 11월 18일」, 휴대폰에서 「2026.11.18」로 씁니다. 둘 다 `<time datetime="2026-11-18">`입니다.
- 쓰지 않는 법: 글 머리에 대표 그림 넣기(이 블로그는 대표 그림 없이 글로 시작합니다).

### 7.13 제목 앵커

- Pencil: 「제목」 `bJWiw`. h2 기본 `k0eVo` · h2 올림 `B89Pn` · h3 기본 `PWOAs` · h3 올림 `IWHBj`
- 구성: 제목 글 + `link` 아이콘(h2 18px, h3 16px). 아이콘은 올리거나 포커스할 때만 보입니다.
- 쓰는 법: h2 · h3마다 한글 그대로의 `id`를 붙이고, 아이콘 링크에 `aria-label="「제목」 링크"`를 줍니다. 아이콘을 숨길 때도 `display: none`이 아니라 `opacity`로 숨겨 키보드로 닿게 합니다.

### 7.14 본문 속 코드

- Pencil: 「본문 속 코드」 `egCcp`
- 구성: `--font-mono`, 0.9em(body-sm 크기), 안쪽 1 · 6px, `--color-surface` 바탕, 1px `--color-border`, `--radius-sm`, 글자 `--color-code-text`.
- 쓰는 법: 코드 이름, 속성, 파일 이름, 키 이름. 줄 끝에서 넘치면 줄을 바꿉니다(`overflow-wrap: anywhere`).
- 쓰지 않는 법: 강조하려고 일반 낱말에 쓰기.

### 7.15 코드 칸

- Pencil: 「코드 칸」 `CX4xi`. 복사 전 `w3LWD3` · 복사됨 `oddTf`
- 구성: `--color-code-bg` 바탕, 1px `--color-code-border` 선, `--radius-md`. 머리 줄(파일 이름 또는 언어 이름, code-sm `--color-code-meta` · 복사 단추) + 코드(code 크기 15px · 줄 간격 1.65, 안쪽 16 · 20px, 휴대폰 12 · 16px). 긴 코드는 줄 번호, 짚어 줄 줄은 강조 줄.
- 색: VS Code Light+ / Dark+ + 대비 보정으로 확정했습니다(2.3 「코드」). Pencil 변수 축 `code`의 기본값 `current`가 확정안입니다.
- 상태: 복사하면 아이콘이 `check`, 글이 「복사됨」, 색이 `--color-good`으로 2초 동안 바뀝니다. 바뀐 말은 `aria-live="polite"`로 읽어 줍니다.
- 쓰는 법: 언어를 꼭 적고, 파일이 있으면 `title="파일 이름"`을 적습니다. 긴 줄은 칸 안에서만 가로로 밀립니다(`overflow-x: auto`, `tabindex="0"`).
- 쓰지 않는 법: 결과 화면을 코드 칸으로 보여 주기(그림이나 데모로), 코드 칸 안에 설명 문단 쓰기.

### 7.16 강조 칸

- Pencil: 「강조 칸」 `eknYZ`. 핵심 `C5y0qU` · 주의 `NSuOp` · 참고 `krx9I`
- 구성: 왼쪽 3px 선, `--radius-md`, 안쪽 16 · 20px. 머리(아이콘 16px + 제목 label 700) + 내용(body-sm, 줄 간격 1.7, `--color-text`).

| kind | 제목 | 아이콘 | 바탕 | 선 · 제목색 |
|---|---|---|---|---|
| `key` | 핵심 | `lightbulb` | `--color-accent-soft` | `--color-accent` |
| `warn` | 주의 | `triangle-alert` | `--color-warn-soft` | `--color-warn` |
| `note` | 참고 | `info` | `--color-surface` | `--color-border-strong` · `--color-text-muted` |

- 쓰는 법: `role="note"`. 핵심은 글 하나에 한두 번, 강조 칸 전체로 세 개 이하입니다.
- 쓰지 않는 법: 문단 하나를 통째로 강조 칸에 넣어 글 흐름을 끊기, 강조 칸 안에 코드 칸이나 데모 넣기.

### 7.17 그림과 설명

- Pencil: 「그림과 설명」 `I437uy`
- 구성: `<figure>` 안 그림(본문 폭, `--radius-lg`, 1px 선) + `<figcaption>`(caption, 보조색). 사이 12px.
- 쓰는 법: 그림마다 `width` · `height`를 적어 자리를 미리 잡습니다(CLS 0). 설명은 기본으로 그림 아래(`captionSide="bottom"`)이고, 표를 감쌀 때만 위(`captionSide="top"`)에 둡니다. 설명은 「그림 1.」로 시작하고 그림이 보여 주는 것을 한 문장으로 씁니다.
- 쓰지 않는 법: 글자를 그림으로 넣기(표나 코드 칸으로), 꾸밈 사진.

### 7.18 표

- Pencil: 「표」 `J9t3G`
- 구성: 위에 표 설명(caption 크기, 보조색). 마크다운 표에는 `<caption>`을 넣을 수 없어서, MDX에서 표를 `<Figure caption="표 1. …" captionSide="top">`으로 감싸 `<figcaption>`을 표 위에 둡니다. 설명은 그림 설명처럼 figure의 이름이 됩니다. 머리 줄은 body-sm 600과 아래 `--color-border-strong` 선, 칸은 body-sm과 아래 `--color-border` 선, 안쪽 10 · 12px. 첫 열이 코드면 `--font-mono`.
- 쓰는 법: 비교와 대응 관계만 표로 씁니다. 숫자 열은 오른쪽 정렬. 휴대폰에서 넘치면 표만 가로로 밀립니다(감싸는 칸에 `overflow-x: auto; tabindex="0"`, `role="region"`, `aria-label`).
- 쓰지 않는 법: 줄 맞춤용 배치 표, 다섯 열 넘는 표.

### 7.19 인용

- Pencil: 「인용」 `Myj7O`
- 구성: 왼쪽 3px `--color-border-strong` 선, 왼쪽 안쪽 20px. 인용 글(body, 보조색) + 출처(small, `<cite>`).
- 쓰는 법: 남의 글을 옮길 때만 씁니다. 출처와 링크를 꼭 적습니다.
- 쓰지 않는 법: 강조용, 기울임꼴(한글에는 기울임꼴을 쓰지 않습니다).

### 7.20 데모 틀

- Pencil: 「데모 틀」 `M3NVPX`. 멈춤 `iePqZ` · 재생 `iBsD0` · JavaScript 없음 `SLF8h`
- 구성: `<figure>` 안
  - 데모 상자: 1px 선, `--radius-lg`
    - 데모 화면: `--color-surface`, 안쪽 40 · 32px. **높이가 바뀌지 않게 합니다.** 데모마다 고정 높이(`min-height`)를 정하거나, 서버에서 첫 화면을 그려(Astro 아일랜드의 서버 렌더링) JavaScript가 붙기 전후의 높이를 같게 합니다. 시안의 200px는 예입니다.
    - 조작 줄: 위쪽 1px 선. 재생/멈춤 단추 · 처음으로 단추 · 슬라이더 · 상태 글(caption, 예: 「멈춤 · width 40%」). 휴대폰은 상태 글을 숨깁니다.
  - 데모 설명: `<figcaption>` 한 줄(caption).
- 상태:
  - 멈춤: 재생 단추가 `play`
  - 재생: 단추가 `pause`
  - JavaScript 없음: 데모 화면 자리에 정지 그림, 조작 줄 자리에 안내 「JavaScript가 꺼져 있어 멈춘 그림으로 보여 줍니다.」
- 시안의 단계 그림은 width를 바꾼 상태라 네 단계(스타일 · 레이아웃 · 페인트 · 합성)가 모두 「다시 함」입니다. transform이면 스타일과 합성만 다시 합니다. 그림과 설명은 실제 브라우저 동작과 맞춥니다(2단계 코드와 같은 문장).
- 쓰는 법: 아티팩트를 다시 만든 데모만 넣습니다. 조작은 세 개 이하입니다. 화면에 들어올 때 불러옵니다(`client:visible`). 자세한 규칙은 content-guide의 「아티팩트를 데모로 다시 만드는 규칙」을 따릅니다.
- 쓰지 않는 법: 데모 틀 밖에 따로 조작 장치 두기, 본문 폭보다 넓히기, 자동 재생.

### 7.21 댓글 자리 (giscus)

- Pencil: 「댓글 자리」 `GbsK7`
- 구성: 「댓글」 제목(h3 크기, `<h2>` 태그) + 점선 테두리 칸(안내 글 + 「GitHub Discussions에서 보기」 링크).
- 쓰는 법: 글 맨 끝, 이전 · 다음 글 아래입니다. 화면에 가까워지면 giscus를 불러오고(`loading="lazy"`), 사이트 밝기가 바뀌면 giscus 테마도 `postMessage`로 바꿉니다. 불러오기 전과 JavaScript가 없을 때 이 칸이 보입니다. 이 칸의 높이를 최소 높이로 잡아 giscus가 들어와도 아래가 밀리지 않게 합니다.

### 7.22 404 본문

- Pencil: 「404 본문」 `W40Po`, 화면 「A · 404 · 넓은 화면」 `m3K3l`
- 구성: 「404」(display, `--color-text-subtle`) · h1 「찾는 글이 없습니다」 · 설명 · 링크 둘(「글 목록으로」, 「RSS로 받아 보기」) · 최근 글 두 편(글 목록 항목).
- 쓰는 법: 페이지 제목은 「찾는 글이 없습니다 · 이스타의 개발 노트」, `noindex`. GitHub Pages는 `404.html`을 씁니다. 링크 둘은 링크 부품 그대로 밑줄을 둡니다(7.2).

## 8. 접근성

목표는 WCAG 2.2 AA입니다.

- **언어와 구조:** `<html lang="ko">`. 랜드마크는 `header` · `nav` · `main` · `aside`(목차) · `footer`. h1은 페이지마다 하나, 제목 단계를 건너뛰지 않습니다(h2 다음 h4 없음).
- **대비:** 2장의 기준을 지킵니다. 새 색을 더하면 이 문서 표에 대비 값을 함께 적습니다.
- **포커스:** 6.3의 모양. 포커스 순서는 화면 순서와 같습니다. `tabindex`에 양수를 쓰지 않습니다.
- **키보드:**
  - 모든 링크 · 단추 · 슬라이더 · `<details>`는 Tab으로 닿습니다.
  - 단추는 Enter와 Space, 슬라이더는 화살표 · Home · End로 움직입니다.
  - 휴대폰 메뉴가 열려 있으면 Esc로 닫고 포커스를 메뉴 단추로 돌립니다(작은 스크립트).
  - 건너뛰기 링크로 머리말을 건너뜁니다.
- **누르는 크기:** 조작 장치는 최소 24×24px(WCAG 2.5.8), 휴대폰 단추는 40px 이상을 지킵니다.
- **움직임:** 6.2의 움직임 줄이기 규칙. 5초 넘게 움직이는 것은 멈출 수 있어야 합니다(데모의 멈춤 단추).
- **대체 글:** 뜻이 있는 그림은 그림이 전하는 내용을 `alt`로, 꾸밈은 `alt=""`. 데모의 정지 그림도 `alt`를 씁니다. 자세한 규칙은 content-guide 7장.
- **상태 알림:** 「복사됨」, 데모 단계 바뀜은 `aria-live="polite"`로 읽어 줍니다. 너무 자주 바뀌는 값(슬라이더 끄는 동안)은 읽지 않습니다.
- **고대비 모드:** `forced-colors: active`에서도 선과 포커스가 보이게 그림자 대신 `border` · `outline`을 씁니다.
- **확인:** 글을 올리기 전 Lighthouse 접근성 100, 키보드만으로 한 바퀴, VoiceOver로 제목 목록 확인.

## 9. 어두운 화면 규칙

- 처음에는 시스템 설정(`prefers-color-scheme`)을 따르고, 밝기 단추로 고르면 그 값을 기억합니다.
- 순검정을 쓰지 않습니다. 바탕은 짙은 남색 회색 `#0F1115`, 칸은 `#171A21`입니다.
- 어두운 화면에서는 강조 · 상태 · 데이터 색을 밝게 올렸습니다. 같은 토큰 이름을 쓰면 저절로 바뀝니다. 새 색을 더할 때는 두 값을 함께 정하고 두 화면에서 대비를 잽니다.
- 부품을 어두운 화면용으로 따로 만들지 않습니다. Pencil에서도 같은 인스턴스를 `mode: dark` 프레임에 넣어 확인합니다(부품 보드 5 `PgE4f`, 화면 `fwBr7`).
- 그림:
  - 투명 바탕 도식은 두 벌(`picture` + `prefers-color-scheme`, 그리고 `data-theme`에 맞춘 class)로 두거나, `--color-surface` 바탕 칸에 넣습니다.
  - 스크린샷은 한 벌만 두되 1px 선으로 테두리를 줍니다.
- 코드 칸은 Shiki 두 테마가 같이 바뀝니다. giscus도 사이트 밝기를 따릅니다.
- `<meta name="theme-color">`는 두 값(`#FFFFFF`, `#0F1115`)을 `media`로 나눠 둡니다.

## 10. 속도 예산

| 항목 | 목표 |
|---|---|
| 데모 없는 페이지(목록, 소개, 데모 없는 글)의 JS | 프레임워크 JS 0KB. 작은 스크립트(밝기, 목차 위치, 복사, 메뉴) 합계 5KB 이하(gzip) |
| 데모 있는 글의 JS | 페이지 합계 100KB 이하(gzip, React 런타임 포함). 데모 하나의 자체 코드는 30KB 이하 |
| CSS | 페이지 합계 30KB 이하(gzip) |
| 글꼴 | 첫 화면에 쓰는 Pretendard 조각만, 합계 150KB 이하. preload는 `PretendardVariable.subset.91.woff2` 하나(38KB) |
| LCP | 2.5초 이하 (휴대폰, 느린 4G 기준). 보통 글 제목이 LCP라서 1.5초 안쪽을 노립니다 |
| CLS | 0.1 이하, 목표 0. 그림 · 댓글 자리는 높이를 미리 잡고, 데모 화면은 고정 높이나 서버에서 그린 첫 화면으로 높이가 변하지 않게 합니다 |
| INP | 200ms 이하 |
| Lighthouse (휴대폰) | 성능 95 이상, 접근성 100, 권장사항 100, SEO 100 |

- 미리 받는 글꼴 조각은 `pretendard/dist/web/variable/woff2-dynamic-subset/PretendardVariable.subset.91.woff2` 하나입니다.
  - 가변 글꼴이라 이 파일 하나에 굵기 45~920이 모두 들어 있습니다. 그래서 「본문 굵기 한 가지」를 따로 고를 필요가 없습니다.
  - 이 조각은 영문 · 숫자 · 기본 기호와 가장 자주 쓰는 한글 음절을 담고 있어 첫 화면 글자의 대부분을 그립니다. 다음으로 자주 쓰는 한글은 `subset.90`(21KB)인데, 미리 받지 않고 브라우저가 필요할 때 받게 둡니다.
  - `<link rel="preload" as="font" type="font/woff2" crossorigin>`에는 빌드된 파일 주소(해시가 붙은 주소)를 넣어야 합니다. CSS가 부르는 주소와 다르면 두 번 받습니다.
  - JetBrains Mono는 미리 받지 않습니다. 코드 칸은 대개 첫 화면 밑에 있습니다.
- 데모는 `client:visible`로 화면에 들어올 때 불러옵니다. 첫 화면 안에 데모가 있으면 `client:idle`로 바꿉니다.
- 바깥 스크립트는 PostHog(중계 주소)와 giscus(화면 가까이 왔을 때)뿐입니다.
- 예산을 넘는 글은 올리기 전에 데모를 가볍게 하거나 정지 그림으로 바꿉니다.

## 11. Pencil과 코드 잇기

Knot에서는 컴포넌트마다 Figma 프레임 링크(`@see`)를 스토리에 붙였습니다. 이 블로그는 Pencil이 그 자리를 맡습니다. Pencil 노드에는 웹 주소가 없으므로 파일 이름과 노드 id로 잇습니다.

- 컴포넌트 파일의 JSDoc에 Pencil 위치를 한 줄 적습니다.

  ```ts
  /**
   * 본문에서 꼭 기억할 문장을 강조하는 칸입니다.
   * @design design/blog.pen 「강조 칸」 eknYZ (핵심 C5y0qU · 주의 NSuOp · 참고 krx9I)
   */
  ```

- 이름은 7.1 표의 「Pencil 프레임 이름」과 id를 그대로 씁니다. 상태가 있는 부품은 variants 묶음 id를 먼저, 상태별 id를 괄호에 적습니다.
- Pencil에서 노드를 찾을 때는 Pencil MCP `execute`에서 `Get("eknYZ")`로 읽거나, 앱에서 이름으로 찾습니다.
- 부품 모양을 바꾸는 순서:
  1. 이 문서의 해당 절을 고칩니다.
  2. Pencil 컴포넌트를 고칩니다(인스턴스를 쓰는 화면이 함께 바뀝니다).
  3. 코드를 고칩니다.
  4. `design/exports-system/`의 PNG를 다시 내보냅니다.
- Pencil 변수 이름은 CSS 변수에서 `--`만 뺀 것입니다(`color-bg` = `--color-bg`). 다만 Pencil은 너비 · 높이에 변수를 받지 않아서, `--content-width`, `--toc-width`, `--header-height`, `--icon-button-size` 같은 크기 토큰은 Pencil에 숫자로 들어가 있습니다. 이 값들은 이 문서가 정본입니다.

## 12. 부록: 지금 코드와 다른 점 (2026-11-21 3단계 기준)

1단계 코드와 이 문서의 차이는 2단계(토큰 · 부품 · 상태)와 3단계(코드 칸, 페이지 제목 `title` 단계, 글 페이지 grid와 `--toc-sticky-top`, Pretendard 미리 받기)에서 모두 코드에 반영했습니다. 아래는 남은 차이와, 문서와 다르게 둔 까닭입니다.

| 항목 | 이 문서 | 지금 코드 | 까닭 |
|---|---|---|---|
| 데모 화면 높이 | 200px로 미리 정함 (7.20) | 넓은 칸에서 최소 200px. 렌더링 단계 데모는 고르기 · 미리보기 · 단계가 있어 그보다 높음 | 서버에서 그린 첫 화면이 그대로 있어 JavaScript가 늦게 와도 높이가 변하지 않습니다(10장의 CLS 줄과 같음) |
| 표 설명 | `<caption>` (7.18) | `<Figure caption="표 1. …" captionSide="top">`의 `<figcaption>` | 마크다운(GFM) 표에는 `<caption>`을 넣을 수 없습니다 |
| 글 제목 줄바꿈 | 손으로 줄바꿈을 넣지 않음 (3.3) | 제목의 첫 `: ` 앞뒤를 두 덩어리로 그려, 줄을 바꿔야 할 때 콜론 뒤에서 먼저 바꿈 (`widgets/post/PostHeader/utils/splitTitle`) | 손 줄바꿈이 아니라 「무엇: 어떻게」 꼴의 제목을 읽기 좋게 나누는 규칙입니다. 좁은 칸에서는 덩어리 안에서 다시 줄을 바꿉니다 |
| Pretendard 글꼴 무게 | 첫 화면 조각만 합계 150KB (10장) | 미리 받기는 `subset.91` 하나(37KB). 다만 브라우저는 화면 밖 글자에도 해당 조각을 받아, 시험 글 한 편에서 조각 20여 개(약 550KB)를 받습니다 | dynamic subset의 동작입니다. 「첫 화면」 기준을 어떻게 잴지(첫 화면 안 조각만 셀지, 페이지 전체를 셀지) 정해야 합니다 |
