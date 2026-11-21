# 2차 배포 안내: 노션 댓글과 방문 통계 켜기

이스타가 그대로 따라 하면 Cloudflare Worker가 배포되고 블로그에 댓글과 방문 통계(PostHog)가 켜집니다. 코드는 이미 준비되어 있고, 여기서는 계정을 만들고 값을 넣는 일만 합니다. 구조와 칸 목록은 [worker.md](./worker.md)에 있습니다.

## 먼저 알아 둘 것

- **비밀값(노션 토큰, Turnstile 비밀 키)은 채팅 · 파일 · 메모에 적지 않습니다.** 화면에서 복사한 뒤, 명령이 「Enter a secret value:」나 「노션 토큰을 붙여 넣고 Enter」처럼 물을 때 바로 붙여 넣습니다. 이때 입력한 글자는 화면에 보이지 않고 명령 기록에도 남지 않습니다.
- 공개되는 값(Turnstile 사이트 키, PostHog 프로젝트 토큰, Worker 주소, 노션 데이터 소스 id)은 저장소에 적어도 됩니다. 브라우저나 Worker 설정으로 어차피 드러나는 값입니다.
- 모든 서비스를 무료 요금제로 씁니다. 결제 수단을 넣으라는 화면이 나오면 Free 요금제를 고른 것이 맞는지 다시 봅니다.
- 명령은 모두 저장소 폴더 안에서 돌립니다. `worker`라고 적힌 단계는 `cd worker`로 들어간 뒤 돌립니다.
- 화면 이름과 버튼 이름은 2026-11-21 각 서비스 공식 문서 기준입니다. 이름이 조금 다르면 비슷한 이름을 고릅니다.

## 순서 한눈에

1. Cloudflare 무료 계정 만들기
2. wrangler 로그인
3. Turnstile 위젯 만들기
4. 노션 connection 확인하기
5. 노션 댓글 표 만들기
6. Worker 비밀값 넣기
7. Worker 배포
8. 블로그 상수 채우고 댓글 켜기
9. PostHog 프로젝트 키 넣기
10. 배포하고 확인하기

---

## 0. 준비 (한 번)

터미널에서:

```sh
cd <저장소 폴더>
pnpm install
pnpm --dir worker install
```

- `pnpm --dir worker install`은 Worker 도구(wrangler 등)를 `worker/node_modules`에 설치합니다. 블로그 설치와 따로입니다.

## 1. Cloudflare 무료 계정 만들기

1. 브라우저에서 `https://dash.cloudflare.com/sign-up/workers-and-pages`를 엽니다.
2. 이메일과 비밀번호를 넣고 가입합니다. 받은 메일의 확인 링크를 누릅니다.
3. 요금제를 묻는 화면이 나오면 **Free**를 고릅니다.
4. (먼저 해 둬도 되고, 7단계에서 해도 됩니다) 대시보드 왼쪽 메뉴의 **Workers & Pages**에서 **Your subdomain** 옆 **Change**를 눌러 계정 하위 도메인을 정합니다.
   - Worker 주소가 `https://eastar-blog.<하위 도메인>.workers.dev`가 됩니다.
   - `analytics`, `posthog`, `track`처럼 광고 차단 목록에 걸리기 쉬운 낱말은 넣지 않습니다. 예: `eastar`

## 2. wrangler 로그인

```sh
cd worker
pnpm exec wrangler login
```

1. 브라우저가 열리고 Cloudflare 로그인 화면이 나옵니다. 1단계의 계정으로 로그인합니다.
2. wrangler에 권한을 줄지 묻는 화면에서 허용(**Allow**)을 누릅니다.
3. 터미널에 `Successfully logged in.`이 나오면 끝입니다.
4. 확인: `pnpm exec wrangler whoami`에 계정 이메일이 나옵니다.

## 3. Turnstile 위젯 만들기

Turnstile은 댓글을 사람이 쓰는지 확인하는 Cloudflare의 무료 기능입니다(위젯 20개, 위젯마다 hostname 10개까지).

1. Cloudflare 대시보드 왼쪽 메뉴에서 **Turnstile**을 엽니다.
2. **Add widget**을 누릅니다.
3. 칸을 채웁니다.
   - **Widget name**: `eastar-blog 댓글`
   - **Region**: **Rest of World** (나중에 바꿀 수 없습니다)
   - **Hostname management**: `eastar-ds.github.io`를 더합니다. `localhost`는 넣지 않습니다(로컬 개발은 Cloudflare의 시험용 키를 씁니다).
   - **Widget mode**: **Managed**
   - **Pre-clearance support**: 쓰지 않음(기본값)
4. **Create**를 누릅니다.
5. 화면에 **Site Key**와 **Secret Key**가 나옵니다.
   - **Site Key**(공개 값): 8단계에서 블로그에 넣습니다. 이 창을 열어 두거나, 나중에 위젯을 눌러 다시 봅니다.
   - **Secret Key**(비밀값): 어디에도 적지 않습니다. 6단계에서 복사해 바로 붙여 넣습니다. 나중에 다시 보려면 위젯을 열고 **Settings**에서 봅니다.

## 4. 노션 connection 확인하기

이스타가 2026-11-21에 블로그 워크스페이스에 connection 두 개를 이미 만들어 「DB」 페이지(`https://www.notion.so/41f0627daae580229183f2ea9025bde8`)에 붙여 두었습니다. 새로 만들지 않고 이 둘을 씁니다. 토큰도 그때 따로 저장해 두었습니다.

| connection | 쓰는 곳 | 기능(Capabilities) |
|---|---|---|
| `blog-comments-worker` | Worker, 5단계 표 만들기 스크립트 | Read content, Insert content (표 만들 때만 Update content를 잠깐 켬) |
| `second-brain-comment-alert` | 세컨드 브레인의 새 댓글 알림 | Read content |

1. 브라우저에서 `https://app.notion.com/developers/connections`를 열고 `blog-comments-worker`를 누릅니다.
2. **Configuration** 탭의 기능에서 **Update content**를 켜고 저장합니다. 5단계 스크립트가 표에 「부모 댓글」 관계 칸을 더할 때 이 권한이 필요합니다. 5단계가 끝나면 다시 끕니다. Worker는 읽기와 넣기만 합니다.
3. 댓글 기능(**Read comments**, **Insert comments**)은 꺼 둡니다. 노션 페이지 댓글이 아니라 표의 줄을 쓰기 때문입니다. 사용자 정보는 **No user information**입니다.
4. 「DB」 페이지 오른쪽 위 **•••** → **Connections**에 두 connection이 모두 보이는지 확인합니다. 없으면 **+ Add connection**으로 붙입니다. 표는 이 페이지 아래에 생기므로, 페이지에 붙어 있으면 표에도 접근할 수 있습니다.
5. 토큰을 잃어버렸으면 **Configuration** 탭에서 다시 발급할 수 있습니다. 다시 발급하면 옛 토큰은 못 쓰게 되니, 이미 넣은 곳(Worker 비밀값)도 다시 넣습니다.

## 5. 노션 댓글 표 만들기

```sh
cd worker
pnpm notion:create-table
```

1. `노션 토큰을 붙여 넣고 Enter (화면에 보이지 않습니다):`가 나오면, `blog-comments-worker`의 토큰을 붙여 넣고 Enter를 누릅니다. 글자가 보이지 않는 것이 맞습니다.
2. `1/3`, `2/3`, `3/3`이 차례로 나오고 끝에 **표 주소**와 **데이터 소스 id**가 나옵니다.
3. `worker/wrangler.jsonc`를 열어 `"NOTION_DATA_SOURCE_ID": ""`의 따옴표 안에 데이터 소스 id를 넣고 저장합니다. (비밀값이 아니라 저장소에 올려도 됩니다)
4. 노션에서 표 주소를 열어, 부모 페이지 아래에 「블로그 댓글」 표가 생겼고 칸이 여덟 개인지 봅니다: 내용(제목) · 닉네임 · 글 주소 · 부모 댓글 · 글쓴이 답글 · 숨김 · 승인 · 작성 시각.
5. 노션 표에서 **칸 이름을 바꾸지 않습니다.** Worker와 세컨드 브레인 알림이 칸 이름으로 읽습니다.
6. `blog-comments-worker`의 **Update content**를 다시 끕니다(4단계 2번).

- `object_not_found`나 `restricted_resource` 오류가 나면 4단계 4번(페이지에 connection 연결)이 빠진 것입니다. 관계 칸을 더하는 `3/3`에서 권한 오류가 나면 4단계 2번(Update content)이 빠진 것입니다.
- 다시 돌리면 표가 하나 더 생깁니다. 잘못 만들었으면 노션에서 지우고 다시 돌립니다.
- 세컨드 브레인의 새 댓글 알림은 `second-brain-comment-alert`로 이 표를 읽습니다. 「DB」 페이지에 붙어 있으면 따로 할 일은 없습니다.

## 6. Worker 비밀값 넣기

```sh
cd worker
pnpm exec wrangler secret put NOTION_TOKEN
```

1. 처음이라 Worker가 아직 없으면 `There doesn't seem to be a Worker called "eastar-blog". Do you want to create a new Worker with that name and add secrets to it?`라고 묻습니다. `y`를 누릅니다.
2. `Enter a secret value:`가 나오면 `blog-comments-worker`의 토큰을 붙여 넣고 Enter를 누릅니다(보이지 않습니다).
3. `✨ Success! Uploaded secret NOTION_TOKEN`이 나오면 됩니다.

이어서 Turnstile 비밀 키를 넣습니다.

```sh
pnpm exec wrangler secret put TURNSTILE_SECRET_KEY
```

- `Enter a secret value:`에 3단계의 **Secret Key**를 붙여 넣고 Enter를 누릅니다.
- 확인: `pnpm exec wrangler secret list`에 이름 두 개(`NOTION_TOKEN`, `TURNSTILE_SECRET_KEY`)가 나옵니다. 값은 나오지 않습니다.

## 7. Worker 배포

```sh
cd worker
pnpm test        # Worker 시험이 모두 통과하는지 먼저 봅니다
pnpm deploy
```

1. 계정 하위 도메인이 아직 없으면 `Would you like to register a workers.dev subdomain now?`라고 묻습니다. `y`를 누르고, `What would you like your workers.dev subdomain to be?`에 1단계 4번에서 정한 이름(예: `eastar`)을 넣습니다.
2. 끝에 Worker 주소가 나옵니다: `https://eastar-blog.<하위 도메인>.workers.dev`. 8단계에서 씁니다.
3. 확인: 브라우저에서 아래 주소를 엽니다.

   ```
   https://eastar-blog.<하위 도메인>.workers.dev/comments?postPath=/posts/browser-layout-and-paint/
   ```

   `{"comments":[],"moderation":"immediate"}`가 나오면 노션과 잘 이어진 것입니다.
   - `{"error":"not_configured"}`: 비밀값이나 `NOTION_DATA_SOURCE_ID`가 빠졌습니다(5 · 6단계).
   - `{"error":"storage_failed"}`: 노션 토큰이 틀렸거나 표에 connection이 연결되지 않았습니다.

## 8. 블로그 상수 채우고 댓글 켜기

1. `src/shared/constants/services/index.ts`를 엽니다.
   - `WORKER_URL`: 7단계의 Worker 주소. 끝에 `/`를 붙이지 않습니다. 예: `"https://eastar-blog.eastar.workers.dev"`
   - `TURNSTILE_SITE_KEY`: 3단계의 **Site Key**
2. `src/shared/constants/features/index.ts`에서 `IS_COMMENTS_ENABLED`를 `true`로 바꿉니다.
3. `src/modules/widgets/site/PrivacyNotice/index.astro`의 `effectiveDate`(시행일)를 켜는 날로 바꿉니다. 개인정보 처리 안내의 댓글 문단은 1번 값이 들어가면 저절로 보입니다.
4. 확인:

   ```sh
   pnpm check && pnpm test && pnpm build
   ```

   - `pnpm build`가 댓글 화면의 글자를 글꼴에 더하므로 `src/shared/styles/fonts/`가 바뀝니다. 함께 커밋합니다.
   - 로컬(`pnpm dev`)에서는 쓰기가 Turnstile에서 막힙니다(위젯의 hostname이 `eastar-ds.github.io`뿐이라서). 쓰기는 10단계에서 배포한 블로그에서 확인합니다.

## 9. PostHog 프로젝트 키 넣기

1. `https://app.posthog.com/signup`에서 가입합니다. 지역(US · EU)을 고르는 칸이 있으면 고르고, 고른 지역을 기억합니다. 기본은 US입니다.
2. 프로젝트 설정(**Settings** → **Project**)에서 **Project token**(`phc_`로 시작)을 복사합니다. 공개 값입니다.
3. `src/shared/constants/services/index.ts`의 `POSTHOG_PROJECT_KEY`에 넣습니다.
   - EU를 골랐으면 같은 파일의 `POSTHOG_UI_HOST`를 `"https://eu.posthog.com"`으로, `worker/wrangler.jsonc`의 `POSTHOG_REGION`을 `"eu"`로 바꾸고 `cd worker && pnpm deploy`를 다시 합니다.
4. IP를 저장하지 않게 합니다: **Settings** → **Project** → **General**의 **IP data capture configuration**에서 IP를 버리는 쪽(discard)을 고릅니다.
   - 개인정보 처리 안내가 「PostHog 설정에서 IP 주소를 저장하지 않도록 둡니다」라고 적고 있으므로 꼭 합니다.
   - IP를 버려도 PostHog는 버리기 전에 대략의 위치(나라 · 도시)를 붙여 둡니다. 위치도 남기기 싫으면 PostHog의 GeoIP 변환(transformation)을 끕니다.
5. 세션 리플레이를 켭니다: 프로젝트 설정의 세션 리플레이(**Session replay**) 항목에서 녹화를 켭니다.
   - 녹화 조건(`https://app.posthog.com/replay/settings#selectedSetting=replay-triggers`, EU면 `eu.posthog.com`)의 **Trigger groups**는 기본값 「Record all sessions」(100%) 그대로 둡니다. 어느 방문을 녹화할지는 블로그 코드(`SESSION_REPLAY_SAMPLE_RATE`, 기본 10%)가 세션 id로 고르므로, PostHog에서도 비율을 낮추면 두 번 줄어듭니다.
6. 무료 한도는 `https://posthog.com/pricing`에서 봅니다(제품 분석 이벤트 · 세션 리플레이의 월 무료 양). 이 문서를 쓸 때는 가격 페이지를 읽지 못해 수치를 적지 못했습니다. 한도에 가까워지면 `SESSION_REPLAY_SAMPLE_RATE`를 낮춥니다.

## 10. 배포하고 확인하기

1. 바뀐 파일을 커밋합니다: `worker/wrangler.jsonc`(데이터 소스 id, 지역), `src/shared/constants/services/index.ts`, `src/shared/constants/features/index.ts`, `PrivacyNotice`, `src/shared/styles/fonts/`. 비밀값이 들어간 파일이 없는지 `git diff`로 한 번 봅니다.
2. main에 올리면 `.github/workflows/deploy.yml`이 검사 · 빌드 · GitHub Pages 배포를 합니다.
3. 배포된 글(`https://eastar-ds.github.io/posts/browser-layout-and-paint/`)에서 봅니다.
   - 아래로 내리면 「댓글」 칸에 「아직 댓글이 없습니다」가 나옵니다.
   - 닉네임과 댓글을 적어 남기면 목록에 바로 보이고, 노션 「블로그 댓글」 표에 줄이 생깁니다.
   - 노션에서 그 줄의 「숨김」을 체크하고 1분쯤 뒤 새로 고치면 블로그에서 내려갑니다.
   - `/privacy/`에 댓글 · 방문 통계 문단이 보입니다.
   - PostHog의 **Activity**(또는 Web analytics)에 방문이 들어옵니다(몇 분 걸릴 수 있음).

## 운영할 때

- **댓글 내리기:** 노션 표에서 「숨김」 체크. 1분(저장 시간) 안에 블로그에서 내려갑니다.
- **이스타 답글 쓰기:** 노션 표에 새 줄 → 「내용」에 답글 → 「부모 댓글」에서 답할 댓글 고르기 → 「글쓴이 답글」 체크 → 「글 주소」에 그 글 주소(예: `/posts/browser-layout-and-paint/`). 「닉네임」은 비워 두면 「이스타」로 보이고 「글쓴이」 표시가 붙습니다.
- **스팸이 늘면 「승인 뒤 보임」으로:** `worker/wrangler.jsonc`의 `COMMENT_MODERATION`을 `"approval"`로 바꾸고 `cd worker && pnpm deploy`. 그 뒤로는 「승인」을 체크한 댓글만 보이고(이스타 답글은 체크 없이 보임), 쓴 사람에게는 「이스타가 확인한 뒤 보입니다」가 나옵니다.
- **막을 닉네임 더하기:** `worker/src/constants/comments.ts`의 `BLOCKED_NICKNAME_WORDS`에 더하고 `pnpm test` 뒤 `pnpm deploy`.
- **Worker 로그 보기:** 로그를 남기지 않게 해 두었습니다. 문제가 있을 때만 `cd worker && pnpm exec wrangler tail`로 그때그때 봅니다(댓글 본문 · 토큰은 로그에 나오지 않습니다).
- **노션 토큰 바꾸기:** connection의 **Configuration** 탭에서 토큰을 새로 만들고 6단계처럼 `wrangler secret put NOTION_TOKEN`을 다시 합니다.
- **무료 한도를 넘으면:** Worker는 하루 10만 요청을 넘으면 그날(UTC 기준) 남은 시간 동안 오류를 줍니다. 요금이 붙지는 않습니다. PostHog 녹화가 요청을 많이 쓰면 `SESSION_REPLAY_SAMPLE_RATE`를 낮춥니다.
