# 단계별 Paseo 프로필

2026년 11월 22일 결정에 따라 Opus를 씁니다. 실행 전에 `mcp__paseo__list_profiles`에서 설명과 값을 읽고 `deep-design` 또는 `code`를 고릅니다. 둘 다 Opus 5.5 xhigh이며, 실제 호출에는 프로필의 값을 복사합니다. 예상과 다른 프로필이면 임의의 모델 이름으로 실행하지 말고 오케스트레이터에게 알립니다.

| 단계 | 모델 | 프로필 | 결과를 받는 법 |
|---|---|---|---|
| 자료 모으기와 확정 | Opus 5.5 xhigh | code | 작업 폴더에 씀 |
| 개요와 개요 고침 | Opus 5.5 xhigh | deep-design | 마지막 답의 전문을 저장하고 checkOutline의 `--stdin`으로 검사 |
| 인터뷰 질문 | Opus 5.5 xhigh | deep-design | 마지막 답의 전문을 저장하고 checkInterview의 `--stdin`으로 검사 |
| 답 저장 | 오케스트레이터 | 해당 없음 | saveAnswers 실행 |
| 초안 | Opus 5.5 xhigh | deep-design | 마지막 답의 전문을 받아 글쓴 쪽이 저장하고 문체 검사 |
| 데모와 그림 | Opus 5.5 xhigh | code | 글과 데모 폴더에 씀 |
| 사실 대조 | Opus 5.5 xhigh | code | 글쓴 에이전트와 다른 새 에이전트가 검사 |
| 문체와 판단 검토 | Opus 5.5 xhigh | deep-design | 마지막 답을 review.md로 저장 |
| 새 독자 시험 | Opus 5.5 xhigh | deep-design | 글만 받은 새 에이전트의 마지막 답을 저장 |
| 게시 전 점검 | Opus 5.5 xhigh | code | 검사와 빌드 결과 보고 |
| 게시 | 오케스트레이터 | 해당 없음 | 이스타가 시킬 때만 |

`deep-design`은 계획 모드여서 파일을 쓰지 않습니다. 오케스트레이터가 전문을 그대로 저장하고 검사를 돌립니다. 실패하면 출력만 같은 에이전트에게 돌려보내 고치게 합니다. 초안 쓰기와 게시 같은 후속 스킬이 설치되지 않았으면 그 단계에서 `막힘`으로 적고 필요한 스킬을 보고합니다.

에이전트를 만들 때 `provider`는 프로필의 provider/model을 합친 값, `settings.modeId`, `settings.thinkingOptionId`, `settings.features`는 프로필의 같은 값을 씁니다. `labels`에는 `profile`, `post`, `stage`를 붙입니다. 단계마다 [agents/_common.md](../agents/_common.md)와 해당 단계 지시문을 함께 전달합니다.
