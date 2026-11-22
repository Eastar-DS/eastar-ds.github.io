# 공용 로컬 설정

정본 설정 읽기는 `scripts/blogWork/readBlogWork.ts`와 `resolveWorkDir.ts`입니다. `BLOG_WORK_CONFIG`를 지정하면 그 파일만 읽습니다. 지정하지 않으면 `~/.blog-work/config.json`, 저장소의 `.claude/blog-work.local.json` 차례로 찾습니다. 설정이 없으면 자료를 훑지 않고 종료 코드 2로 멈춥니다. 홈 폴더에서 자료 위치를 짐작해 찾지 않습니다.

아래 경로는 모두 지어낸 예입니다. 설정은 저장소 밖에 둡니다. `sourceRoots`와 `repos`의 기존 형식을 유지하며, `readPolicy`와 `unopenedNames`를 더했습니다.

```json
{
  "workDir": "~/.blog-work",
  "repos": { "project": "~/code/example-project" },
  "sourceRoots": ["~/work-notes", "~/private-notes/career"],
  "hiddenNames": [],
  "readPolicy": [
    { "path": "~/work-notes", "name": "work", "kind": "작업 폴더", "read": "읽음" },
    { "path": "~/private-notes/career", "name": "career", "kind": "개인 노트", "read": "단서만" },
    { "path": "~/private-notes/career/interview-raw", "read": "읽지 않음" },
    { "path": "~/private-notes/daily", "read": "읽지 않음" }
  ],
  "unopenedNames": ["analytics-config/", "*.session.json"]
}
```

- `readPolicy`: 경로별 정책 배열입니다. `path`와 `read`는 필수이고 `name`, `kind`, `defaultUse`는 선택입니다. 가장 깊게 맞는 경로를 적용하며, 부모의 `읽지 않음`은 자식에서 풀 수 없습니다.
- `kind`: 작업 폴더, 저장소, 개인 노트, 작업 메모, 내려받은 파일, 이미 쓴 글 가운데 하나입니다.
- 읽기 값: `읽음`, `단서만`, `이름만`, `읽지 않음` 가운데 하나입니다. 개인 노트와 작업 메모의 문장과 제목은 복사하지 않습니다. 기계용 목록에는 관련 절의 줄 번호만 적습니다.
- `defaultUse`: 자료 종류의 기본값을 바꿀 때만 씁니다. 개인 노트의 `단서만`과 비밀값 의심 파일의 `열지 않음`은 풀 수 없습니다.
- `unopenedNames`: 파일 이름 glob 배열입니다. 환경 변수 파일, 로그인 상태, 키 파일, 브라우저 프로필은 이 칸이 비어 있어도 이름만 적습니다. 심볼릭 링크는 따라가지 않습니다.
- `hiddenNames`: 가릴 이름 배열입니다. 비어 있으면 경고만 내고 이름 검사는 건너뜁니다. 이름은 검사 오류에 출력하지 않습니다.

`sourceRoots`는 훑을 뿌리 목록이고, `readPolicy`에 경로를 추가하는 것만으로 새 뿌리가 생기지는 않습니다. 개인 노트와 읽지 않는 폴더를 빠짐없이 설정한 뒤 실행합니다. 기본 금지 폴더 이름도 있지만 모든 개인 폴더를 스크립트가 알아낼 수는 없습니다.

`--root`와 `--topic-dir`는 뿌리를 더하되 같은 읽기 정책을 적용합니다. 다시 훑을 때도 앞 실행의 인자를 함께 줍니다. 이전 실행에서 빠진 항목은 삭제하지 않고 `removed: true`로 두며, 그 번호를 재사용하지 않습니다.

다시 훑은 목록은 같은 경로의 내용과 링크가 바뀌었을 수 있어 상태를 `이스타 확인 기다림`으로 둡니다. 원문 답을 반영하고 검사한 뒤 명시적으로 확정합니다.
