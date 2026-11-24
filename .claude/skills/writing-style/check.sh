#!/bin/bash
# 마크다운(.md) · MDX(.mdx) 파일에서 banned-patterns.txt의 금지 표현이 든 줄을 "줄번호: 내용"으로 출력한다.
# 코드 블록, 인라인 코드, HTML 주석 표시, URL, 구분선과 표 구분 행은 검사하지 않는다.
#
# 사용법: check.sh FILE [LINES_FILE]
#   LINES_FILE을 주면 그 파일의 줄(앞뒤 공백을 뺀 4바이트 이상)이 들어 있는 줄만 검사한다.
#   훅이 Edit로 새로 넣은 문장만 검사할 때 쓴다.

# 훅 환경에 로캘이 없어도 [가-힣] 같은 한글 범위가 글자 단위로 맞게 한다.
# 맥의 BSD grep은 en_US.UTF-8에서 grep -E로 한글 범위를 읽는다.
# GNU grep(리눅스, CI)은 어느 UTF-8 로캘에서도 [가-힣]을 받지 않아서(Invalid collation character),
# 범위를 코드 포인트로 바꾸고 grep -P 한 패턴으로 검사한다.
PATTERNS="$(cd "$(dirname "$0")" && pwd)/banned-patterns.txt"

if grep --version 2>/dev/null | grep -q '^grep (GNU grep)'; then
  export LC_ALL=C.UTF-8
  # grep -P는 패턴을 하나만 받아서 줄마다 (?:…)로 싸서 | 로 잇는다
  PCRE_PATTERN="$(grep -v '^$' "$PATTERNS" | sed 's/가-힣/\\x{AC00}-\\x{D7A3}/g' | awk '{ printf "%s(?:%s)", (NR > 1 ? "|" : ""), $0 }')"
  match() { grep -P -e "$PCRE_PATTERN"; }
else
  export LC_ALL=en_US.UTF-8
  match() { grep -E -f "$PATTERNS"; }
fi

FILE="$1"
LINES="$2"

awk -v lines="$LINES" '
  BEGIN {
    if (lines != "") {
      while ((getline l < lines) > 0) {
        gsub(/^[ \t]+|[ \t]+$/, "", l)
        if (length(l) >= 4) keep[++n] = l
      }
      if (n == 0) exit
    }
  }
  /^```/ { code = !code; next }
  code { next }
  {
    if (n > 0) {
      hit = 0
      for (i = 1; i <= n; i++) if (index($0, keep[i])) { hit = 1; break }
      if (!hit) next
    }
    line = $0
    gsub(/`[^`]*`/, "", line)
    gsub(/<!--|-->/, "", line)
    gsub(/https?:\/\/[^] \t)>"\047]+/, "", line)
    if (line ~ /^[ \t]*[-|: \t]+$/) next
    print NR ": " line
  }
' "$FILE" | match
