#!/bin/bash
# PostToolUse(Write|Edit) 훅. 마크다운(.md)과 MDX(.mdx) 파일에 쓴 문장에서 writing-style 스킬의 금지 표현을 찾는다.
# 위반이 있으면 decision:"block"으로 위반 목록을 에이전트에게 돌려보내 다시 쓰게 한다.

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty')

# 마크다운 산문만 검사. 블로그 글(src/content/posts/{slug}/index.mdx)은 MDX다
[[ "$FILE" == *.md || "$FILE" == *.mdx ]] || exit 0

# 제외: 금지 표현을 예시로 담은 규칙 문서와 에이전트 지침 문서
# .claude 아래 스킬과 규칙, CLAUDE.md, AGENTS.md, docs/ 아래 정본 · 기록 문서
# (docs/content-guide.md는 가운뎃점을 표기 규칙으로 정하고, 정본 문서는 에이전트가 고치지 않는다)
case "$FILE" in
  */.claude/*|*/CLAUDE.md|*/AGENTS.md|*/docs/*) exit 0 ;;
esac

[ -f "$FILE" ] || exit 0

DIR="$(cd "$(dirname "$0")" && pwd)"

# Edit는 새로 넣은 문장이 든 줄만 검사한다.
# 원래 있던 표현까지 검사하면 고치지 않은 줄 때문에 매번 막힌다.
LINES=""
if [ "$TOOL" = "Edit" ]; then
  LINES=$(mktemp)
  trap 'rm -f "$LINES"' EXIT
  printf '%s' "$INPUT" | jq -r '.tool_input.new_string // empty' > "$LINES"
fi

VIOLATIONS=$(bash "$DIR/check.sh" "$FILE" "$LINES" | head -15)

if [ -n "$VIOLATIONS" ]; then
  jq -n --arg v "$VIOLATIONS" --arg f "$FILE" \
    '{decision: "block", reason: ("금지 표현 위반(writing-style 스킬): " + $f + "에서 아래 표현이 나왔습니다. .claude/skills/writing-style/SKILL.md의 금지 목록을 다시 읽고, 해당 문장을 다른 표현으로 고쳐 파일을 수정하세요.\n\n" + $v)}'
fi
exit 0
