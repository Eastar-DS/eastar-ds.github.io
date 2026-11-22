#!/bin/bash
# prepublish-check 평가에 쓰는 사본 글을 저장소 밖 작업 폴더에 만든다. 저장소 맨 위에서 돌린다.
#
# 사용법: bash .claude/skills/prepublish-check/evals/make-fixtures.sh [대상 폴더]
#   대상 폴더를 주지 않으면 `node scripts/blogWork.ts dir _evals`가 준 폴더(작업 폴더의 _evals/)에 만든다.
#
# 사본은 {대상 폴더}/{사례}/{원래 slug}/index.mdx 꼴이다. 폴더 이름이 원래 slug라서
# `node scripts/checkPost.ts {사본 경로}`가 저장소의 같은 글 대신 사본을 넣고 링크와 시리즈를 본다.
# 바꿀 문자열이 원본에 없으면 실패로 끝난다. 글이 바뀌어 평가 재료가 낡았다는 뜻이다.
# 끝나면 사본마다 sha256을 {대상 폴더}/checksums.txt에 적는다(「글을 고치지 않음」 채점용).
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [ $# -ge 1 ]; then
  TARGET="$1"
else
  TARGET="$(node scripts/blogWork.ts dir _evals)"
fi

case "$(cd "$(dirname "$TARGET")" 2>/dev/null && pwd)/" in
  "$ROOT"/*) echo "평가 사본은 저장소 밖에 둡니다: $TARGET" >&2; exit 2 ;;
esac

mkdir -p "$TARGET"

FIRST=src/content/posts/virtualized-document-list/index.mdx
SECOND=src/content/posts/virtual-list-row-range/index.mdx

# make_copy 사례 원본 [찾을 글 바꿀 글]... : 원본을 복사하고 찾을 글을 모두 바꾼다
make_copy() {
  local name="$1" source="$2"
  shift 2
  local slug
  slug="$(basename "$(dirname "$source")")"
  local dest="$TARGET/$name/$slug/index.mdx"

  mkdir -p "$(dirname "$dest")"
  node -e '
    const fs = require("fs");
    const [source, dest, ...pairs] = process.argv.slice(1);
    let text = fs.readFileSync(source, "utf8");
    for (let i = 0; i < pairs.length; i += 2) {
      if (!text.includes(pairs[i])) {
        console.error(`${source}에 바꿀 글이 없습니다(평가 재료가 낡음): ${pairs[i]}`);
        process.exit(1);
      }
      text = text.split(pairs[i]).join(pairs[i + 1]);
    }
    fs.writeFileSync(dest, text);
  ' "$source" "$dest" "$@"
  echo "$dest"
}

# p1: 1편 그대로 (〔이스타 확인〕 1개, draft: true)
make_copy p1-marker "$FIRST"

# p2: 요약 뒤에 문장을 붙여 120자로 늘림 (원래 80자 + 40자)
make_copy p2-long-description "$FIRST" \
  '그리게 바꾼 방법을 다룹니다."' \
  '그리게 바꾼 방법을 다룹니다. 측정 조건과 버린 방법, 그리고 가상화로 잃은 것까지 함께 적었습니다."'

# p3: 「얼마나 빨라졌나」 절의 첫 문장 앞에 답이 아닌 문장을 넣음
make_copy p3-no-answer-first "$FIRST" \
  '같은 조건에서 개선 전 빌드와 견주면,' \
  '측정에는 Playwright를 썼습니다. 같은 조건에서 개선 전 빌드와 견주면,'

# p4: 2편 링크를 없는 글 주소로
make_copy p4-broken-link "$FIRST" \
  '(/posts/virtual-list-row-range/)' \
  '(/posts/no-such-post/)'

# p5: 2편의 첫 코드 칸에서 언어와 파일 이름을 지움
make_copy p5-no-lang "$SECOND" \
  '```ts title="getRowOffsets.ts"' \
  '```'

(cd "$TARGET" && shasum -a 256 */*/index.mdx > checksums.txt)
echo "$TARGET/checksums.txt"
