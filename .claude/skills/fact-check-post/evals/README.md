# 사실 대조 평가

1. `bash .claude/skills/fact-check-post/evals/make-fixtures.sh`로 저장소 밖 `_evals/f1-eval-*/`에 사본 여섯 개와 주장 후보를 만듭니다. 원본과 사본의 sha256은 각 `fixture.json`에 둡니다.
2. 사본마다 checker.md를 따라 `fact-check.md`를 씁니다. 기본은 Paseo Codex `codex-work` 프로필(`gpt-6.1-sol`)이며, `research` 프로필(Opus)은 부른 쪽이 지정했을 때의 대안입니다. 부른 쪽이 에이전트 생성을 금지하고 직접 평가하라고 지시하면 현재 세션이 대조하고 그 실행 방식을 기록합니다. 판정이 들어 있는 정답 대조표는 자동 생성하지 않습니다.
3. `bash .claude/skills/fact-check-post/evals/grade.sh 1 {f1-number-swap/fact-check.md}`처럼 시나리오 번호와 경로를 줍니다. `grade.json`에 verify·의도한 오류 검출·원문 보존 결과를 씁니다.

스크립트는 인용의 존재와 표 형식, 목표 판정을 검사합니다. 같은 조건의 1차 출처인지, 숫자 없는 동작 설명을 모두 더했는지, 판정이 타당한지는 사람이 확인합니다. 사본 0번은 verify와 해시만 검사하므로 잘못된 「다름」이 없는지 사람이 읽습니다. 4·5번은 공식 문서 요청과 응답 확인이 필요합니다. 실행하지 않았으면 통과로 쓰지 않습니다.

`pnpm post:evals`는 evals.json과 trigger-evals.json의 형식을 검사합니다. trigger-evals의 실제 스킬 선택 채점과 스킬 사용/미사용 비교는 별도 실행합니다.
