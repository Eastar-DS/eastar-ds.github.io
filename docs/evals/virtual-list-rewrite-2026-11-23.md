# 가상화 시리즈 다섯 편 다시 쓰기 결과 (2026-11-23–24)

문서 목록 가상화 시리즈 다섯 편을 다시 썼습니다. 글 이름(slug) 다섯 개, 게시일 2026-11-13–2026-11-17, `draft: true`, 시리즈 순서는 바꾸지 않았습니다. 글쓰기 검사는 다섯 편 모두 금지 표현 0건이었고, 게시 전 점검은 실패 0건, `pnpm check`, `pnpm test`(92개 파일 501건), `pnpm build`는 끝 코드 0으로 통과했습니다. 브라우저 확인은 처음 20건과 마지막 본문 수정 뒤 1편과 3편 8건이 모두 통과했습니다. 브랜치 커밋 대상은 글 5편, 차트 라벨(`measurements.ts`), 이 보고서이며, 푸시와 게시는 하지 않습니다.

## 편마다 바뀐 점

| 편 | 구조와 정의 | DOM 예시 | 결과 |
| --- | --- | --- | --- |
| 1 `virtualized-document-list` | 제목을 「React 목록 가상화: 966ms를 46ms로 줄인 방법」으로 바꿈. INP, 트레이스, Chrome의 Commit 단계와 React 커밋, Profiler용 빌드, Fiber를 괄호로 정의. 폴더 카드 계산 절과 그림은 2편으로 보냄 | 그림 1 아래 `html` 코드 칸 2개. 카드 `ul`의 `height`와 `padding-top`, 머리는 `div` 안 `h3`로 실제 코드를 따름 | 시간 표와 따로 새 JS heap과 DOM 표를 더함. 37,168과 558이 무엇을 센 값인지 밝힘 |
| 2 `virtual-list-row-range` | 제목의 「카드 높이」를 「전체 높이」로. 행 번호는 0부터, `end`는 그리지 않는 첫 행이라고 정의. 행 개수 방식에서 px 방식으로 바꾼 까닭과 실측 대조 절을 새로 둠 | 1편에서 가져온 그림 아래 코드 칸 2개(넓힌 구간 170–360px, `padding-top: 129px`, 높이 519px) | 지금 코드대로 `row.index`를 넘긴다고 고침. 원자료가 없는 실측값은 팀 보고 값이라고 밝힘 |
| 3 `virtual-list-blank-frames` | 카드, 넓힌 구간, 레이어, 타일, 래스터, CDP를 첫 등장에 정의. h2 7개 | 휠 데모 아래 코드 칸 2개(휠 전, 다시 그린 뒤, 빈 칸 35px 계산) | 빈 칸 판정을 「PNG 가로줄 4줄 이상」으로 고침. CSS px 환산은 확인하지 못했다고 적음 |
| 4 `virtual-list-back-navigation` | 작업, 마이크로태스크, Scheduler를 한 줄씩 정의. 「가상화 전」과 「고치기 전」 빌드를 나눔. h2 7개 | 프레임 그림 아래 코드 칸 2개(범위 7–29, `padding-top: 454px`) | 120Hz 문장은 근거가 운영 조건뿐이라 뺌 |
| 5 `virtual-list-accessibility` | 접근성 트리와 HTML-AAM을 정의. 표 1을 읽는 문장 대신 「순서 / 항목 수」 값으로 바꿈. h2 7개 | 포커스 그림 아래 코드 칸 2개(고치기 전 `padding-top: 600px`, 고친 뒤 간격 `li`) | 실험 기록이 없는 Tab 실험 문장은 쓰지 않음 |

새 화면 컴포넌트는 만들지 않았고 기존 코드 칸만 써서 `docs/design-system.md`는 고칠 필요가 없었습니다. 예시의 폴더와 문서 이름은 지어낸 값입니다. `measurements.ts`는 작업 시작 때 바뀐 것이 없었고, 이번에 1편 차트 라벨 세 곳만 고쳤으며(「주제별」→「문서 목록 탭」 두 곳, 「렌더링한」→「마운트한」 컴포넌트 한 곳) 숫자는 그대로입니다. 실제 diff는 Codex가 검토했습니다.

## 측정 여섯 가지의 뜻과 조건

1. 966ms와 46ms: 탭을 누른 뒤 rAF 신호가 올 때까지 잰 `toPaint` 가운데값입니다(2026-11-12, CPU 4배 느림, 녹화 없음). 965.5→46ms, 행이 생길 때까지인 `toRows`는 521→35.5ms입니다. CPU 1배에서는 `toPaint` 222→21ms입니다.
2. 트레이스: 3초 동안 이벤트 묶음별 합계입니다. CPU 4배에서 JavaScript 676.5→164.5ms, Commit 444→44.5ms, 레이아웃 131→4ms, GC(Major와 Minor 합) 15.5→2.5ms입니다. 3초 합이라 개선 후 164.5ms가 46ms보다 깁니다.
3. Profiler 마운트와 업데이트: 37,168→558은 탭 진입 구간의 커밋마다 마운트한 수를 더한 합계이고, 살아 있는 Fiber 전체 개수가 아닙니다. 업데이트 합은 37,325→726입니다. 개선 전에는 기록에 남은 가장 큰 커밋 하나가 37,168개를 모두 마운트했습니다.
4. 화면 요소: 요소는 태그만 센 값(17,696→354), DOM 노드는 글자 노드까지 센 값(23,607→479)입니다. 문서 행은 1,939→13, `main` 높이는 128,317px로 같습니다.
5. 프레임: 3편은 CDP screencast로 받은 프레임 가운데 자홍색 PNG 가로줄이 4줄 이상인 프레임을 셉니다. 4편은 뒤로 가기 뒤 2.5초 동안 받은 프레임에서 빈 프레임을 세고, 고치기 전 빌드는 세 번 모두 1장이었습니다. 프레임 간격 가운데값은 8.3ms 안팎입니다.
6. 메모리: 처음 측정에는 JS heap 기록이 없었습니다. 그래서 2026-11-23에 새로 쟀고, 아래 조건과 같습니다.

## 새 측정 (2026-11-23)

- 값: JS heap 사용량 가운데값 53,012,956 B(50.6 MiB) → 10,471,848 B(10.0 MiB), 80.2% 줄어듦. 범위는 53,010,996–53,052,060 B, 10,361,188–10,546,308 B입니다.
- 뜻: 페이지 JavaScript 힙에서 쓰는 바이트이고 브라우저나 프로세스 메모리, Fiber 수가 아닙니다.
- 조건: 개선 전(develop `11ac67db`)과 개선 후(`90218587`까지) 빌드, 시험용 응답 문서 1,939개와 폴더 28개(제목은 지어냄), Chrome 156 계열 Chromium, 창 1200×818 화면 배율 2, CPU 제한 없음, 녹화 꺼짐, 바깥 요청 막음, 앞뒤 순서를 바꿔 가며 조건마다 5번, 탭 진입 2초 뒤 맨 위에서 강제 GC 2번 뒤 읽음.
- 11월 12일 시간 측정(Playwright Chrome, CPU 4배)과 세션과 도구가 달라 글에서 같은 표에 넣지 않았습니다.

## 고른 바깥 글 9편

| # | 제목 | 주소 |
| --- | --- | --- |
| 1 | Virtualize large lists with react-window | https://web.dev/articles/virtualize-long-lists-react-window |
| 2 | TanStack Virtual: Introduction, Virtualizer API | https://tanstack.com/virtual/latest/docs/introduction , https://tanstack.com/virtual/latest/docs/api/virtualizer |
| 3 | bvaughn/react-window README | https://github.com/bvaughn/react-window |
| 4 | List Virtualization (patterns.dev) | https://www.patterns.dev/vanilla/virtual-lists/ |
| 5 | Avoid an excessive DOM size (Lighthouse) | https://developer.chrome.com/docs/lighthouse/performance/dom-size |
| 6 | content-visibility (web.dev) | https://web.dev/articles/content-visibility |
| 7 | Angular CDK Scrolling | https://github.com/angular/components/blob/main/src/cdk/scrolling/scrolling.md |
| 8 | VirtualizedList(무한스크롤 리스트) 리팩토링 개발 이야기 (오늘의집) | https://www.bucketplace.com/post/2024-09-11-virtualizedlist-%EB%AC%B4%ED%95%9C%EC%8A%A4%ED%81%AC%EB%A1%A4-%EB%A6%AC%EC%8A%A4%ED%8A%B8-%EB%A6%AC%ED%8C%A9%ED%86%A0%EB%A7%81-%EA%B0%9C%EB%B0%9C-%EC%9D%B4%EC%95%BC%EA%B8%B0/ |
| 9 | Virtualizing thousands of files, and why the grid is the hard part | https://frelikh.com/articles/virtualizing-lists-and-grids |

가져온 점: 지금 react-window README에는 `List` 말고 `useVirtualizer`도 있어서 1편 비교를 「`List`」로 좁혔습니다. Lighthouse 기준(약 800, 약 1,400)은 「노드」 단위라 우리 요소 수와 나눠 썼습니다. 측정 조건이 없는 바깥 수치(232→30ms 등)는 우리 값과 바로 견주지 않았습니다.

## 사실 대조

| 편 | 맞음 | 일부 맞음 | 다름 | 출처에 없음 | 못 엶 | 대조 안 함 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 170 | 11 | 0 | 4 | 0 | 10 |
| 2 | 52 | 10 | 0 | 0 | 0 | 6 |
| 3 | 52 | 9 | 0 | 0 | 0 | 4 |
| 4 | 82 | 11 | 0 | 0 | 0 | 3 |
| 5 | 52 | 3 | 0 | 0 | 0 | 4 |

1편 「출처에 없음」 4건: C50 Fiber가 컴포넌트와 호스트 요소마다 두는 내부 노드라는 정의, M2 Knot가 우아한테크코스 팀 프로젝트라는 소개, M7 React 커밋과 Profiler용 빌드의 정의, M17 JS heap이 프로세스 메모리가 아니라는 설명.

지난 대조(`docs/evals/factcheck-api-2026-11-23.md`)의 「출처에 없음」 4건은 이렇게 처리했습니다.

- 1편 우아한테크코스 소개(지난 M1): 지시로 1편에 되살렸고, 공개 근거는 여전히 찾지 못해 이번 M2로 다시 남았습니다.
- 1편 Chrome 트레이스 `Commit`(지난 M9): Chrome 「Inside look at modern web browser (part 3)」의 렌더링 단계 설명을 공식 링크로 달고 「Chrome의 Commit 단계」로 이름을 나눴습니다. 트레이스의 `Commit` 이벤트가 그 단계라는 이벤트 정의는 아직 근거를 확인하지 못했습니다. 이번 M7(React 커밋과 Profiler용 빌드의 정의)과는 다른 주장입니다.
- 2편 Emotion 클래스(지난 M24): Emotion 공식 문서가 받치는 범위(값이 다른 스타일마다 클래스가 따로 생김)로 문장을 좁혀, 이번 2편 「출처에 없음」은 0건입니다.
- 5편 aria 두 속성(지난 M4): 명세가 말하는 범위로 낮춰, 이번에는 「일부 맞음」(C47, C48)입니다.

## 이스타가 정할 것

- 1편의 〔이스타 확인: 배운 점〕 자리 1곳(초안이라 경고, 초안을 풀면 실패).
- 1편 updatedAt 2026-11-19와 「고친 내용」은 지시대로 두었습니다. 새 본문에 11월 23일 heap 표와 큰 구조 변화가 들어갔지만 「고친 내용」에는 11월 19일 항목만 있어 서로 맞지 않습니다. 초안 글에 두 가지를 남길지 정해야 합니다.
- 우아한테크코스 소개의 공개 근거.

## 남은 한계

- 3편 측정 스크립트 주석의 「CSS 2px」는 환산을 잰 자료가 없어 맞는지 확인하지 못했고, 본문에도 미확인이라고 적었습니다.

## 비용과 실행

| 단계 | 달러 |
| --- | --- |
| 자료 수집 | 4.88 |
| 웹 조사 | 3.16 |
| 자료 정리와 개요 | 4.68 |
| 본문 | 11.11 |
| 독자 검토와 보완 | 5.26 |
| 사실 대조 | 29.83 |
| 보고서(작성과 보완 합) | 1.4417 |
| 누계 | 60.3655 |

- 사실 대조는 배분 20달러를 넘겨, 본문이 바뀐 1편과 3편만 다시 대조하는 범위로 줄였습니다.
- 실행 문제: 1편 재대조 실행이 대조표를 쓴 뒤 실행별 예산 한도(error_max_budget_usd, 4.82달러)에 닿아 멈췄습니다. 따로 형식을 보완한 뒤 최종 검증은 통과했습니다.
- 최종 누계 60.3655달러는 새 실행 중단 기준 68달러와 전체 상한 72달러 아래입니다.
- 모든 API 실행 32회의 인증과 비용 기록을 확인했습니다.

## 그 밖의 검증

- 글쓰기 검사(`check.sh`)는 금지 표현이 없으면 출력 없이 끝 코드 1로 끝나는 grep 관례를 따르며, Codex가 이 끝 코드를 통과로 바로잡아 읽었습니다.
- 브라우저: 처음 20건(넓은 화면, 휴대폰, 어두운 화면, 키보드, 가로 표 넘침) 모두 통과, 마지막 본문 수정 뒤 1편과 3편을 1440px와 390px, 밝은 화면과 어두운 화면으로 다시 본 8건도 모두 통과했습니다. 캡처 10장과 추가 2장은 직접 눈으로 보았습니다.
- 빌드가 다시 만든 글꼴 파일은 원래대로 되돌렸고, 작업용 브라우저와 개발 서버는 모두 닫았습니다.
- 게시 전 점검은 다섯 편 모두 실패 0이고, 경고는 초안 링크, 1, 2편의 h2 수와 읽는 시간, 2편 「정리」 항목 수, 1편 〔이스타 확인〕입니다.
- 개요 검사 명령은 기존 slug와 겹친다는 5건만 남았고, 고칠 대상 slug 다섯 개를 빼고 돌린 같은 검사는 오류 없이 통과했습니다.
- 변경량: 글 5편과 `measurements.ts`(라벨 세 곳), 577줄 더함, 185줄 뺌.
