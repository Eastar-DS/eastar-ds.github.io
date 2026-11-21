# Cloudflare Worker: 노션 댓글과 PostHog 중계 (2026-11-21)

블로그(`https://eastar-ds.github.io`)는 정적 사이트라 서버가 없습니다. 댓글 저장과 방문 통계 중계는 Cloudflare Worker 하나가 맡습니다. 이 문서는 Worker의 구조, 경로, 노션 댓글 표의 칸, 무료 요금제 한도를 적습니다. 배포 순서는 [deploy-phase2.md](./deploy-phase2.md), 정한 정책은 [plan.md](./plan.md)의 「댓글」 · 「방문 통계」에 있습니다.

## 목차

1. 한눈에 보기
2. 경로
3. 노션 댓글 표 (세컨드 브레인도 읽음)
4. 댓글 쓰기의 검사 순서
5. 댓글 목록 저장해 두기
6. PostHog 중계
7. 설정 값과 비밀값
8. 무료 요금제 한도와 고른 이유
9. 폴더와 명령
10. 시험
11. 블로그 쪽

---

## 1. 한눈에 보기

```
방문자 브라우저
  ├─ 댓글 목록 · 쓰기 ──→ Worker /comments ──→ 노션 API (댓글 표)
  │                         └─ 쓰기 전에 Turnstile 확인 (challenges.cloudflare.com)
  ├─ Turnstile 위젯 ──→ challenges.cloudflare.com (Cloudflare 규칙상 직접 불러옴)
  └─ 방문 통계 ──→ Worker /bridge/* ──→ PostHog (us.i.posthog.com · us-assets.i.posthog.com)
```

- 이름: `eastar-blog`. 주소는 `https://eastar-blog.<계정 하위 도메인>.workers.dev`입니다.
- TypeScript와 Hono 4로 만들었습니다. 코드는 `worker/`에 있고, 블로그와 따로 설치 · 시험 · 배포합니다.
- 노션 토큰과 Turnstile 비밀 키는 Worker 비밀값에만 둡니다. 저장소 · 블로그 코드 · 로그에는 없습니다.

## 2. 경로

| 방법 | 경로 | 하는 일 | 응답 |
|---|---|---|---|
| `GET` | `/comments?postPath=/posts/{slug}/` | 글 하나의 보일 댓글. 최상위 댓글과 답글(한 단계)을 쓴 시각 순서로 묶어 줍니다 | `200 { comments, moderation }` |
| `POST` | `/comments` | 댓글 쓰기. 본문은 JSON `{ postPath, nickname, content, parentId?, turnstileToken, homepage }` | `201 { id, status }` (`status`: `published` 바로 보임 · `pending` 승인 뒤 보임) |
| `OPTIONS` | `/comments` | CORS 사전 요청 | `204` |
| 모두 | `/bridge/static/*`, `/bridge/array/*` | PostHog 정적 파일(SDK, 녹화 도구, 원격 설정). 정적 파일 서버로 넘기고 저장해 둠 | PostHog 응답 그대로 |
| 모두 | `/bridge/*` (위 둘 밖) | PostHog 이벤트 · 설정 · 녹화. API 서버로 넘김 | PostHog 응답 그대로 |
| 모두 | 그 밖 | 없음 | `404 { error: "not_found" }` |

- 목록 응답의 댓글 하나: `{ id, nickname, content, createdAt, isAuthor, replies: [...] }`. 「숨김」 · 「승인」 같은 관리 값과 글 주소는 보내지 않습니다. `isAuthor`가 `true`면 블로그가 「글쓴이」 표시를 합니다.
- 오류 응답은 `{ error: "<값>" }` 하나뿐이고 댓글 본문 · 토큰을 담지 않습니다. 값은 `worker/src/types/comment.ts`의 `CommentErrorCode`입니다.

| `error` | 상태 | 뜻 |
|---|---|---|
| `invalid_request` | 400 · 413 | 본문이 JSON이 아니거나, 글 주소 꼴이 아니거나, 16KB를 넘음 |
| `forbidden_origin` | 403 | 허용하지 않은 출처에서 쓰기 |
| `spam_suspected` | 400 | 숨은 입력 칸(`homepage`)이 채워짐 |
| `nickname_required` · `nickname_too_long` · `nickname_blocked` | 400 | 닉네임이 비었거나 20자를 넘거나 막힌 낱말 |
| `content_required` · `content_too_long` | 400 | 내용이 비었거나 1000자를 넘음 |
| `invalid_parent` | 400 | 부모 댓글이 같은 글의 보이는 최상위 댓글이 아님(두 단계 답글 등) |
| `too_many_requests` | 429 | 같은 곳에서 1분에 3번 넘게 씀. `Retry-After: 60` |
| `turnstile_failed` | 403 | Turnstile 확인 실패 |
| `not_configured` | 503 | 노션 토큰 · 표 id · Turnstile 비밀 키 가운데 빠진 것이 있음 |
| `storage_failed` | 502 | 노션 읽기 · 쓰기 실패 |

- 허용 출처(CORS): `https://eastar-ds.github.io`와 로컬 개발 주소(`http://localhost:<포트>`, `http://127.0.0.1:<포트>`)뿐입니다. 쓰기(`POST`)는 Origin 머리가 이 가운데 하나가 아니면 403으로 막습니다.

## 3. 노션 댓글 표 (세컨드 브레인도 읽음)

`worker/scripts/createNotionCommentsTable.ts`가 만듭니다. 부모 페이지는 `41f0627daae580229183f2ea9025bde8`이고(세컨드 브레인이 읽는 knot 페이지 밖), 표 이름은 「블로그 댓글」입니다. 칸 이름과 종류는 Worker(`worker/src/constants/notion.ts`의 `COMMENT_COLUMNS`)와 세컨드 브레인의 새 댓글 알림이 그대로 읽으므로 **노션에서 칸 이름을 바꾸지 않습니다.**

| 칸 | 노션 종류 | 누가 채움 | 값 |
|---|---|---|---|
| 내용 | 제목(`title`) | Worker | 댓글 본문. 줄바꿈 포함, 최대 1000자 |
| 닉네임 | 텍스트(`rich_text`) | Worker | 최대 20자. 이스타 답글은 비워 두면 블로그에 「이스타」로 보임 |
| 글 주소 | 텍스트(`rich_text`) | Worker | `/posts/{slug}/`. 전체 주소는 `https://eastar-ds.github.io` + 이 값 |
| 부모 댓글 | 관계(`relation`, 같은 표, 한쪽만) | Worker · 이스타 | 답글이면 최상위 댓글 하나. 최상위 댓글이면 비어 있음 |
| 글쓴이 답글 | 체크박스(`checkbox`) | 이스타 | 이스타가 노션에서 직접 쓴 답글 |
| 숨김 | 체크박스(`checkbox`) | 이스타 | 체크하면 블로그에서 내려감(저장해 둔 목록이 지나면, 기본 60초 안) |
| 승인 | 체크박스(`checkbox`) | 이스타 | 「승인 뒤 보임」 방식에서만 씀. 바로 보임 방식에서는 무시 |
| 작성 시각 | 만든 시각(`created_time`) | 노션 | 줄을 만든 시각. 손으로 바꿀 수 없음 |

- **제목 칸을 「내용」으로 둔 이유:** 노션 표에는 제목 칸이 꼭 하나 있어야 합니다. 이스타가 노션에서 답글의 「부모 댓글」을 고를 때 노션은 줄을 제목으로 보여 주므로, 제목이 댓글 내용이어야 어느 댓글인지 알아볼 수 있습니다. 닉네임을 제목으로 두면 같은 닉네임이 여럿일 때 고를 수 없습니다. 세컨드 브레인 알림도 제목만 읽으면 앞부분을 보여 줄 수 있습니다.
- 「부모 댓글」을 관계 칸으로 둔 이유: 이스타가 페이지 id를 붙여 넣지 않고 목록에서 고를 수 있습니다. 반대쪽 칸(답글 목록)은 만들지 않아 칸이 위 여덟 개로 고정됩니다.
- 「작성 시각」을 만든 시각 종류로 둔 이유: 이스타가 노션에서 답글을 쓸 때도 노션이 채웁니다. 세컨드 브레인은 `{"timestamp": "created_time", "created_time": {"after": "<지난 확인 시각>"}}`로 새 댓글만 고를 수 있습니다.
- **노션 API 판:** `Notion-Version: 2026-03-11`(2026-11-21 기준 최신)을 씁니다.
  - 2025-09-03 판부터 표(database)와 데이터 소스(data source)가 나뉘었습니다. 칸 정의는 데이터 소스에 있고, 질의는 `POST /v1/data_sources/{id}/query`, 줄 만들기는 `parent: { type: "data_source_id", data_source_id }`입니다. 그래서 Worker 설정에는 표 id가 아니라 **데이터 소스 id**를 넣습니다.
  - 표 만들기(`POST /v1/databases`)는 칸을 `initial_data_source.properties`에 넣습니다. 같은 표를 가리키는 관계 칸은 데이터 소스 id가 생긴 뒤에야 만들 수 있어서, 스크립트가 `PATCH /v1/data_sources/{id}`로 「부모 댓글」을 따로 더합니다.
  - 2026-03-11 판은 `archived`를 `in_trash`로 바꿨습니다. Worker는 휴지통에 간 줄을 숨김으로 봅니다.
- 노션 API 한도: 통합 하나에 평균 초당 3회(분당 180회), 데이터 소스 질의도 따로 초당 약 3회입니다. 429면 `Retry-After`를 따릅니다(Worker는 한 번만, 2초 안에서 다시 시도). 글자 칸 하나는 2000자까지라 Worker는 긴 글을 나눠 넣습니다(내용은 1000자라 한 칸).
- 세컨드 브레인이 이 표를 읽으려면 세컨드 브레인의 노션 통합도 이 표(또는 부모 페이지)에 연결해야 합니다.

## 4. 댓글 쓰기의 검사 순서

비용이 적은 검사부터 하고, 실패하면 바로 멈춥니다.

1. **출처:** Origin이 허용 출처가 아니면 403.
2. **설정:** 비밀값 · 표 id가 없으면 503.
3. **본문 크기 · 꼴:** 16KB 넘음 413, JSON이 아니면 400.
4. **숨은 입력 칸:** `homepage`가 채워졌으면 스팸(400). 사람에게는 보이지 않는 칸이라 사람은 채우지 않습니다.
5. **다듬기와 글자 수:** 유니코드 정규화(NFC), 제어 문자 · 보이지 않는 방향 바꿈 글자 지우기, 앞뒤 공백 지우기, 빈 줄 셋 이상을 둘로. 닉네임 1~20자, 내용 1~1000자(글자 단위, 그림 문자 하나도 한 글자).
6. **막힌 닉네임:** 「이스타」 · 「글쓴이」 · `eastar`가 닉네임 어디에든 들어 있으면 막습니다(`worker/src/comments/isBlockedNickname.ts`).
   - 같은 낱말로 보는 것: 띄어쓰기 · 기호 · 보이지 않는 글자(「이 스 타」, 「이.스.타」), 자모 나눠 쓰기(「ㅇㅣㅅㅡㅌㅏ」), 연음(「글쓰니」), 된소리 · 거센소리(「이쓰타」, 「이스따」), 비슷한 꼴 글자(「ㅇl스타」), 전각 글자(「ｅａｓｔａｒ」), 숫자로 바꿔 쓴 영문(「3a5t4r」).
   - 막지 않는 것: 「기스타」, 「미스터」, 「시스템」처럼 소리가 다른 낱말.
   - 낱말을 더하려면 `worker/src/constants/comments.ts`의 `BLOCKED_NICKNAME_WORDS`에 넣습니다.
7. **빈도:** 같은 곳(IP)에서 1분에 3번을 넘으면 429. 키는 IP를 SHA-256으로 바꾼 값이고, 셈은 Cloudflare의 빈도 제한 기능 안에서만 잠깐 남습니다. Worker는 IP를 어디에도 저장하지 않고, Workers Logs도 끕니다.
8. **Turnstile:** 토큰을 Cloudflare `siteverify`로 확인합니다(방문자 IP는 보내지 않음). 결과의 hostname이 `eastar-ds.github.io`가 아니면 막습니다.
9. **답글 한 단계:** `parentId`가 있으면 같은 글의 보이는 최상위 댓글인지 봅니다(저장해 둔 목록으로). 답글에 다는 답글, 숨긴 댓글, 다른 글의 댓글이면 400.
10. **노션에 쓰기:** 「글쓴이 답글」 · 「숨김」 · 「승인」은 모두 꺼진 채로 씁니다.
11. **저장해 둔 목록 비우기:** 그 글의 목록을 비워 다음 목록 요청이 노션을 새로 읽게 합니다.

- 로그에는 노션 상태 코드 · 노션 오류 코드 · Turnstile 오류 코드만 남깁니다. 댓글 본문, 닉네임, 토큰은 남기지 않습니다.
- 이스타의 답글은 Worker를 거치지 않습니다. 노션에서 새 줄을 만들고 「내용」을 쓰고, 「부모 댓글」에서 최상위 댓글을 고르고, 「글쓴이 답글」을 체크하고, 「글 주소」에 같은 글 주소를 적습니다. 「닉네임」은 비워 두면 「이스타」로 보입니다. 이스타가 답글의 답글을 부모로 골라도 블로그는 그 최상위 댓글 아래에 둡니다(늘 한 단계).

## 5. 댓글 목록 저장해 두기

- 노션 API가 초당 약 3회라서, 글별 목록을 기본 60초(`COMMENTS_CACHE_TTL_SECONDS`, 10~600초) 동안 저장해 두고 노션을 다시 부르지 않습니다.
- 두 겹입니다.
  1. Worker 인스턴스의 메모리: 어느 주소에서나 됩니다. 인스턴스마다 따로이고 인스턴스가 내려가면 사라집니다.
  2. Cloudflare Cache API(`caches.default`): 같은 데이터 센터의 인스턴스가 함께 씁니다. Cloudflare 문서는 「사용자 도메인의 Worker는 Cache API가 동작한다」고 적고 `workers.dev`는 따로 적지 않아서, `workers.dev`에서는 이 겹이 동작하지 않을 수 있습니다. 그래도 1번 겹이 남습니다.
- 쓰기 뒤 비우기는 그 데이터 센터에만 닿습니다(Cache API의 `delete`도 같음). 다른 데이터 센터의 저장분은 저장 시간이 지나면 새로 읽습니다. 쓴 사람은 블로그가 방금 쓴 댓글을 화면에 바로 더해 보여 줍니다.
- 「숨김」을 체크하거나 「승인」을 체크한 결과도 저장 시간(기본 60초) 안에 블로그에 반영됩니다.

## 6. PostHog 중계

PostHog 공식 문서 「Cloudflare reverse proxy」 방식을 따릅니다.

- 경로 이름은 `/bridge`입니다. 광고 차단 목록에 걸리기 쉬운 이름(`analytics`, `tracking`, `telemetry`, `posthog`, `ph`, `ingest`)을 피했습니다. Worker 이름 `eastar-blog`도 같은 까닭으로 지었습니다.
- `/bridge/static/*` · `/bridge/array/*` → `us-assets.i.posthog.com`(EU면 `eu-assets.i.posthog.com`). Worker가 데이터 센터에 저장해 둡니다. PostHog 정적 서버는 같은 주소라도 Origin마다 CORS 머리가 달라서(`Vary: Origin`), 저장 키에 Origin을 넣습니다.
- 그 밖의 `/bridge/*` → `us.i.posthog.com`(EU면 `eu.i.posthog.com`). 본문은 그대로 넘깁니다.
- 머리: 쿠키는 지우고, Authorization은 PostHog 공개 프로젝트 키(`phc_` 등)일 때만 넘기고, 방문자 IP를 `X-Forwarded-For`로 넘깁니다(PostHog가 대략의 위치를 알도록. PostHog 문서와 같음). IP를 PostHog가 저장하지 않게 하려면 PostHog 프로젝트 설정의 「IP data capture configuration」에서 버리기를 고릅니다(deploy-phase2.md 9단계). 버려도 PostHog는 버리기 전에 대략의 위치(나라 · 도시)를 붙여 둡니다.
- 지역은 `POSTHOG_REGION`(`us` · `eu`)으로 고릅니다.

## 7. 설정 값과 비밀값

| 이름 | 종류 | 기본값 | 넣는 곳 |
|---|---|---|---|
| `NOTION_TOKEN` | 비밀값 | — | `wrangler secret put NOTION_TOKEN` |
| `TURNSTILE_SECRET_KEY` | 비밀값 | — | `wrangler secret put TURNSTILE_SECRET_KEY` |
| `NOTION_DATA_SOURCE_ID` | 설정 값 | 빈 값 | `worker/wrangler.jsonc` (표 만들기 스크립트가 알려 줌. 비밀값 아님) |
| `COMMENT_MODERATION` | 설정 값 | `immediate` | `approval`로 바꾸면 「승인 뒤 보임」 |
| `COMMENTS_CACHE_TTL_SECONDS` | 설정 값 | `60` | 목록 저장 시간 |
| `TURNSTILE_EXPECTED_HOSTNAMES` | 설정 값 | `eastar-ds.github.io` | 쉼표로 나눔. 비우면 검사하지 않음 |
| `POSTHOG_REGION` | 설정 값 | `us` | PostHog 프로젝트 지역 |
| `NOTION_API_BASE` | 로컬 전용 | 빈 값 | `.dev.vars`에서만. 가짜 노션 서버 주소 |
| `COMMENT_RATE_LIMITER` | 바인딩 | 1분에 3번 | `wrangler.jsonc`의 `ratelimits` |

- 로컬 개발 값은 `worker/.dev.vars`(저장소에 올리지 않음)에 둡니다. `worker/.dev.vars.example`을 복사하면 가짜 노션 서버와 Turnstile 공개 시험 키로 바로 돌아갑니다.

## 8. 무료 요금제 한도와 고른 이유

모두 2026-11-21 공식 문서 기준입니다.

| 서비스 | 무료 한도 | 이 블로그에서 |
|---|---|---|
| Cloudflare Workers (Free) | 하루 요청 10만(UTC 자정에 초기화, 넘으면 오류 1027), 요청 하나에 CPU 10ms, 하위 요청 50, Worker 100개 | 댓글 쓰기 한 번은 하위 요청 2~3개(Turnstile, 노션). PostHog 이벤트 · 녹화 요청도 Worker 요청으로 셉니다. 녹화 중인 방문은 몇 초마다 요청을 보내므로 표본 비율로 줄입니다 |
| Workers Rate Limiting | 요금제 제한 언급 없음(문서에 Free · Paid 구분 없음). 기간은 10초나 60초, 데이터 센터마다 따로 세는 대략의 한도 | 1분에 3번. 정확한 전역 한도가 필요하면 Durable Objects를 써야 하는데, 댓글 스팸 막기에는 대략이면 충분합니다 |
| Cloudflare Cache API | Free는 요청 하나에 50번(하위 요청과 함께 셈). 데이터 센터마다 따로 | 목록 한 번에 1~2번 |
| Cloudflare Turnstile (Free) | 위젯 20개, 위젯 하나에 hostname 10개, 확인 횟수 제한 없음 | 위젯 하나, hostname `eastar-ds.github.io` |
| 노션 API | 통합 하나에 평균 초당 3회 | 목록을 60초 저장해 둬서 글마다 1분에 한 번 넘게 부르지 않음 |
| PostHog (Free) | 공식 가격 페이지 수치를 docs/deploy-phase2.md 9단계에 적음 | 세션 리플레이는 표본 10%로 시작 |

- **Workers KV를 쓰지 않은 이유:** 무료 쓰기가 하루 1,000번이고, 지우기가 전역에 퍼지는 데 최대 60초가 걸려 「쓴 뒤 비우기」가 더 늦어집니다. 메모리 + Cache API면 무료 한도 걱정이 없습니다.
- **Durable Objects를 쓰지 않은 이유:** 정확한 빈도 제한과 전역 저장이 되지만 설정이 늘고, 이 정도 댓글 양에는 대략의 빈도 제한으로 충분합니다.
- **Workers Logs(observability)를 끈 이유:** 켜면 요청 정보가 Cloudflare에 남습니다. IP를 남기지 않는다는 약속을 지키려고 끄고, 문제를 볼 때는 `pnpm exec wrangler tail`로 그때그때 봅니다.

## 9. 폴더와 명령

```plaintext
worker/
├── wrangler.jsonc                 # Worker 설정(이름, vars, 빈도 제한)
├── .dev.vars.example              # 로컬 개발 값의 예(가짜 노션, Turnstile 시험 키)
├── src/
│   ├── index.ts                   # Hono 앱: /comments, /bridge/*
│   ├── routes/comments.ts         # 댓글 목록 · 쓰기, CORS
│   ├── routes/relay.ts            # PostHog 중계
│   ├── comments/                  # 입력 검사, 막힌 닉네임, 답글 묶기, 목록 저장 (단위 시험 옆에)
│   ├── notion/                    # 노션 API 호출과 칸 바꾸기
│   ├── turnstile/verifyTurnstile.ts
│   ├── constants/                 # 노션 칸 이름, 댓글 규칙, 중계 경로
│   ├── types/                     # Env, 댓글 응답 타입
│   └── utils/                     # 설정 읽기, 허용 출처, 빈도 제한 키
├── scripts/
│   ├── createNotionCommentsTable.ts  # 노션 댓글 표 만들기(처음 한 번)
│   └── fakeNotionServer.ts           # 로컬 개발용 가짜 노션 서버
└── test/                          # 경로 통합 시험(댓글, CORS, 저장 비우기, 중계)
```

| 명령 (worker 폴더) | 하는 일 |
|---|---|
| `pnpm install` | Worker 의존성 설치(블로그와 따로) |
| `pnpm dev` | 로컬 Worker(`http://127.0.0.1:8787`). `.dev.vars`가 필요함 |
| `pnpm dev:fake-notion` | 가짜 노션 서버(`http://127.0.0.1:8790`). 시험 글에 댓글 몇 개를 넣어 둠 |
| `pnpm test` | Worker 시험(vitest + Cloudflare Workers 시험 도구) |
| `pnpm typecheck` | 타입 검사 |
| `pnpm notion:create-table` | 노션 댓글 표 만들기 |
| `pnpm deploy` | 배포(`wrangler deploy`) |

루트에서는 `pnpm test:worker`, `pnpm check:worker`, 모두 한 번에 `pnpm test:all`(블로그 타입 검사 · 시험 + Worker 타입 검사 · 시험)을 씁니다. 먼저 `pnpm --dir worker install`이 되어 있어야 합니다. GitHub Pages 배포(`.github/workflows/deploy.yml`)는 Worker를 건드리지 않습니다.

## 10. 시험

- 도구: vitest 5 + `@cloudflare/vitest-plugin`(Cloudflare가 `@cloudflare/vitest-pool-workers` 대신 내놓은 새 이름). 시험은 실제 Workers 실행 환경(workerd)에서 돕니다. 노션 · Turnstile · PostHog 호출은 `fetch`를 가짜로 바꿔 확인하고, 부른 요청의 본문과 머리를 검사합니다.
- 경로 시험(`worker/test/`): 정상 쓰기(노션에 쓰는 칸 값, 응답과 로그에 본문 · 토큰 없음), 숨은 칸, 빈도 초과(가짜 빈도 제한과 실제 바인딩 둘 다), IP 대신 해시 키, 글자 수 경계, 막힌 닉네임, Turnstile 실패 · hostname 다름, 노션 실패, 두 단계 답글 · 숨긴 부모 · 다른 글 부모, 숨김 · 승인 방식, CORS(허용 · 거부 · 출처 없는 쓰기), 목록 저장과 쓰기 뒤 비우기, PostHog 경로 넘기기(정적 · API · EU · 머리 · Origin별 저장).
- 단위 시험(`worker/src/**/*.test.ts`): 막힌 닉네임(막는 꼴 26개, 막지 않는 꼴 11개), 입력 다듬기, 답글 묶기, 노션 칸 읽기 · 나누기.

## 11. 블로그 쪽

- 상수: `src/shared/constants/services`의 `WORKER_URL`, `TURNSTILE_SITE_KEY`, `POSTHOG_PROJECT_KEY`, `POSTHOG_RELAY_PATH`(= Worker의 `/bridge`), `POSTHOG_UI_HOST`, `SESSION_REPLAY_SAMPLE_RATE`. 댓글은 `src/shared/constants/features`의 `IS_COMMENTS_ENABLED`도 켜야 그립니다.
- 값이 비어 있으면 `astro.config.ts`가 댓글 칸(`CommentSection`)과 방문 통계 스크립트(`AnalyticsScript`)를 빈 부품(`scripts/EmptyPart.astro`)으로 바꿉니다. Astro는 그리지 않는 부품이라도 import만 되어 있으면 CSS와 스크립트를 빌드 결과에 넣고, 글꼴 만들기가 그 글자까지 모으기 때문입니다. 그래서 지금 배포 빌드에는 댓글 · PostHog 코드가 한 줄도 실리지 않습니다.
- 댓글 화면: `src/modules/widgets/post/Comments`. 페이지에는 「댓글 칸이 다가오는지」만 보는 작은 코드(gzip 약 1.2KB)를 싣고, 칸이 화면 아래 200px 안으로 오면 댓글 코드(`model/mountComments`, gzip 약 3.1KB)를 받아 목록을 불러옵니다. Turnstile 스크립트는 목록을 그린 뒤 쓰기 칸이 화면에 들어오거나 쓰기 칸에 포커스가 갈 때만 불러옵니다.
- 방문 통계: `Document/ui/AnalyticsScript`가 페이지를 다 받은 뒤 브라우저가 한가할 때(늦어도 3초) Worker 중계 주소의 `/static/array.js`를 받아 PostHog를 켭니다. npm 패키지를 묶지 않아 블로그 번들이 커지지 않습니다. 쿠키 없이 localStorage만 쓰고, 「추적 안 함」을 따르고, 세션 리플레이는 세션 id로 뽑힌 10%만 녹화하며 입력 칸은 가립니다.
