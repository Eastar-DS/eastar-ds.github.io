# 이스타의 개발 노트: 계획

## 정한 것 (2026-11-21)

- **목적:** 공부하며 배운 것과 만든 것을 읽기 좋은 글로 남깁니다. 포트폴리오용이 아니고, 수익 목적도 없어 무료로 운영합니다.
- **언어:** 한국어만 씁니다.
- **프레임워크:** Astro를 씁니다. 글 위주 사이트에 가장 알맞기 때문입니다. 기본으로 JavaScript를 보내지 않고, 움직이는 칸만 골라 살립니다.
- **주소와 배포:** `eastar-ds.github.io`(GitHub Pages)에 올립니다.
  - 저장소 이름은 `eastar-ds.github.io`입니다.
  - 글과 소스는 같은 공개 저장소에 둡니다. 공개되면 곤란한 초안은 저장소에 넣지 않습니다.
  - 글 주소는 `/posts/글-이름`입니다. 같은 도메인 아래에 다른 저장소의 Pages(a11y-airline 등)가 있어서, 그 이름과 겹치지 않게 하려는 것입니다.
- **글 원본:** 저장소의 MDX 파일 하나를 원본으로 둡니다.
- **아티팩트:** Claude 앱의 아티팩트는 글을 쓸 때마다 확인하고, 필요한 부분만 블로그 디자인에 맞게 다시 만들어 넣습니다. 디자인 기준은 아티팩트가 아니라 블로그 자체입니다.
- **댓글:** 로그인 없는 익명 댓글을 노션 DB에 저장합니다(2026-11-21 이스타 결정, giscus 대신).
  - 블로그 → Cloudflare Worker(PostHog 중계와 같은 Worker) → 노션 API. 노션 토큰은 Worker 비밀값에만 두고, 댓글 목록은 Worker가 잠깐 저장해 두고 보여 줍니다(노션 API는 초당 약 3회).
  - 공개 방식: 바로 보이고, 이스타가 노션에서 「숨김」을 체크하면 내려갑니다. 스팸이 늘면 설정 하나로 「승인 뒤 보임」으로 바꿉니다.
  - 처음부터 두는 최소 스팸 막기: Cloudflare Turnstile(무료), 숨은 입력 칸, 같은 곳에서 너무 자주 쓰면 잠시 막기, 글자 수 제한, 링크는 누를 수 없는 글로 보여 주기.
  - 댓글은 HTML이 아닌 글로만 보여 주고, IP는 저장하지 않습니다. 개인정보 처리 안내에 닉네임과 댓글을 노션에 저장한다고 적습니다.
  - 답글은 한 단계까지입니다. 이스타의 답글은 노션에서 직접 쓰고(「부모 댓글」 칸 + 「글쓴이 답글」 표시), 블로그에 「글쓴이」 표시로 나옵니다. 방문자 닉네임에서 「이스타」, 「글쓴이」는 막습니다.
  - 새 댓글 알림: 세컨드 브레인이 노션 댓글 표를 10분마다 확인해 기존 텔레그램 봇으로 알립니다(글 제목, 닉네임, 앞부분, 노션 줄 주소). 댓글은 남의 글이라 세컨드 브레인 기록으로는 넣지 않습니다.
  - 댓글 표는 세컨드 브레인이 읽는 노션 knot 페이지 밖에 둡니다.
- **방문 통계:** PostHog를 씁니다.
  - 광고 차단기를 피하려고 Cloudflare Workers 무료 요금제로 중계 주소를 둡니다.
  - 세션 리플레이는 일부 방문만 표본으로 녹화합니다.
  - 개인정보 처리 안내 페이지를 둡니다.
- **SEO와 AEO:**
  - `lang="ko"`
  - 글마다 BlogPosting(작성자, 발행일, 수정일)과 BreadcrumbList
  - canonical, 글별 og:image, RSS, 사이트맵, llms.txt
  - 제목 앵커, 페이지마다 h1 하나
  - 답을 먼저 쓰는 문단
  - 네이버 서치어드바이저와 Google Search Console 등록
    - 둘 다 HTML 메타 태그로 소유를 확인합니다. 값은 이스타가 등록할 때 받아 `src/shared/constants/site`의 `verification.google` · `verification.naver`에 넣습니다. 비어 있으면 메타 태그를 그리지 않습니다.
  - **robots.txt는 모든 로봇을 허용합니다**(2026-11-21). `/robots.txt`는 `src/shared/seo/createRobotsTxt`가 만들고 사이트맵 주소(`/sitemap-index.xml`)를 적습니다.
    - 이유: 이 블로그의 목표가 검색(SEO)과 AI 답변에 인용되기(AEO)라서, 글을 읽어 가는 로봇을 막을 까닭이 없습니다. 공개 글만 있고, 초안은 저장소에 넣지 않습니다.
    - `User-agent: *`로 모두 허용하고, AI 로봇은 막지 않는다는 뜻을 분명히 하려고 이름을 따로 적어 허용합니다.
      - 검색: Googlebot, Bingbot, Yeti(네이버), Daumoa(다음), Applebot, DuckDuckBot
      - AI 검색 · 답변(질문에 답할 때 글을 읽고 출처로 걸어 줌): OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-SearchBot, Claude-User
      - AI 학습 · 수집: GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot
    - 학습용 수집까지 허용하는 까닭: 학습 데이터에 들어간 글이 AI 답변의 배경 지식이 되고, 막아도 이미 공개된 글은 다른 경로로 수집되기 때문입니다. 마음이 바뀌면 학습용 로봇만 `Disallow`로 바꿉니다.
- **배포:** 두 번에 나눕니다(2026-11-21).
  - 1차: 글과 화면만. `.github/workflows/deploy.yml`이 main에 올라올 때 타입 검사 · 단위 테스트 · 빌드(사이트 글자로 글꼴 만들기와 빠진 글자 검사 포함)를 거쳐 GitHub Pages에 배포합니다. 댓글 자리는 `src/shared/constants/features`의 `IS_COMMENTS_ENABLED`로 꺼 둡니다.
  - 2차: Cloudflare Worker(노션 댓글, PostHog 중계)를 붙이고 댓글을 켭니다.
- **세컨드 브레인 연결:**
  - 먼저 게시한 글을 세컨드 브레인 기록으로 넣습니다.
  - 글감 제안은 글을 몇 편 쓴 뒤에 합니다.
  - 게시는 늘 이스타가 확인한 뒤에 합니다.

## 디자인

- 레퍼런스 16곳의 조사는 [design-references.md](./design-references.md)에 있습니다.
- 시안은 `design/blog.pen`에 있습니다.
  - A안(차분한 문서형)과 B안(조금 개성 있는 형)을 각각 글 화면(넓은 화면, 어두운 화면, 휴대폰)과 글 목록으로 그렸습니다.
  - 시안의 글꼴은 Pencil이 쓸 수 있는 구글 글꼴로 대신했습니다(Pretendard 대신 Noto Sans KR, 마루 부리 대신 Noto Serif KR).
  - 레퍼런스 보드는 다른 사이트의 화면을 `.references/`에서 불러옵니다. 그 화면 파일은 저장소에 올리지 않습니다.

## 다음 할 일

1. 이스타가 시안을 보고 방향을 고릅니다(A, B, 섞기).
2. 고른 방향의 디자인 기준값을 CSS 변수로 옮겨 Astro 틀을 만듭니다.
3. 시험 글 한 편을 넣어 실제 브라우저로 확인합니다.
4. GitHub 저장소를 만들고 Pages로 배포합니다. 이 단계는 이스타의 확인을 받고 합니다.
5. SEO 구성(글별 og:image, llms.txt), 노션 댓글과 Cloudflare Worker(PostHog 중계 겸용), 세컨드 브레인의 새 댓글 텔레그램 알림을 붙입니다.
