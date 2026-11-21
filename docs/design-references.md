# 디자인 레퍼런스 (2026-11-21 조사)

블로그 16곳을 넓은 화면(1440px)과 휴대폰(390px)으로 보고, 브라우저가 실제로 적용한 값을 읽었습니다. 화면 파일은 다른 사이트의 것이라 저장소에 올리지 않고 `.references/`에만 둡니다.

## 블로그별 기록

| 묶음 | 블로그 | 글 폭 · 한 줄 | 본문 글자 | 가져올 점 | 피할 점 |
|---|---|---|---|---|---|
| 해외 개인 | [overreacted.io](https://overreacted.io) | 632px · 약 80자 | Merriweather 16px · 1.75 | 군더더기 없는 목록과 본문, llms.txt | 목차 없음, 구조화 데이터 없음 |
| 해외 개인 | [brandur.org](https://brandur.org) | 660px · 약 80자 | 세리프 18px · 1.78 | 3단 배치(글 정보 · 본문 · 번호 목차), 종이색 바탕 | 96px 제목은 한글 긴 제목에 안 맞음 |
| 해외 개인 | [antfu.me](https://antfu.me) | 656px · 약 85자 | Inter 16px · 1.75 | 연도별 글 목록, 밝은 코드 칸 | 회색이 옅어 대비 약함 |
| 해외 개인 | [tkdodo.eu/blog](https://tkdodo.eu/blog) | 960px · 100자 넘음 | 20px | 시리즈 묶음 상자, Astro 사이트맵 | 넓은 화면에서 줄이 너무 김 |
| 인터랙티브 | [joshwcomeau.com](https://www.joshwcomeau.com) | 686px · 약 80자 | Wotfard 18px · 1.5 | 데모 상자, 좋은 예 · 나쁜 예 칩, 오른쪽 목차 | 장식 많음, 유료 글꼴 |
| 인터랙티브 | [ciechanow.ski](https://ciechanow.ski) | 704px · 약 80자 | IBM Plex Sans 19.2px · 1.6 | 멈춤 버튼 + 슬라이더, 본문 낱말과 데모의 색 맞추기 | 데모가 무거워 처음 로딩이 보임 |
| 인터랙티브 | [redblobgames.com](https://www.redblobgames.com) | 660px · 약 74자 | Iowan Old Style 20px | 글 속 기호와 데모 기호 맞추기, 썸네일 목록 | 휴대폰 본문 13.9px, 오래된 디자인 |
| 인터랙티브 | [samwho.dev](https://samwho.dev) | - | Seravek 18.7px | 단순한 데모 카드, 메타 정보 충실(BlogPosting, RSS) | 휴대폰에서 제목 영역이 첫 화면을 다 차지 |
| 한국어 | [toss.tech](https://toss.tech) | 700px · 한글 약 41자 | 17px · 1.6 | 한글 41자 폭, 굵은 강조문 | 목차 없음, 구조화 데이터 없음 |
| 한국어 | [tech.kakao.com](https://tech.kakao.com) | 748px · 한글 약 47자 | 16px · 1.75 | 오른쪽 번호 목차, 1.75 줄 간격, BlogPosting | 휴대폰 제목이 너무 큼, h1 두 개 |
| 한국어 | [yceffort.kr](https://yceffort.kr) | 960px · 한글 약 60자 | 시스템 16px · 1.8 | SEO · AEO 전부(BlogPosting, BreadcrumbList, RSS, llms.txt), 목차 상자 | 본문이 너무 넓음 |
| 한국어 | [jbee.io](https://jbee.io) | 608px · 한글 약 38자 | Pretendard 16px · 1.7 | 한글 본문 기본값이 가장 가까움 | 개성이 약함 |
| 문서 · 가든 | [maggieappleton.com](https://maggieappleton.com) | 한 줄 약 100자 | Canela Text 22px · 2.0 | 성장 단계 표시, 「마지막 손본 날」, 거르기 목록 | 유료 글꼴, 본문이 너무 넓음 |
| 문서 · 가든 | [notes.andymatuschak.org](https://notes.andymatuschak.org) | 561px · 약 75자 | 시스템 17px · 1.41 | 링크 중심 연결 탐색 | 줄 간격이 한글에 좁음, description 없음 |
| 문서 · 가든 | [gwern.net](https://gwern.net) | - | Source Serif 4 19px | 글 머리 메타 정보, 옆주석, 각주 미리보기 | 정보가 너무 빽빽함 |
| 문서 · 가든 | [react.dev/blog](https://react.dev/blog) | 896px · 약 110자 | 17px · 1.76 | 접는 「DEEP DIVE」 칸, 「Copy page」 | 블로그 글에 목차 없음, 넓음 |

배민 기술 블로그는 자동 브라우저를 막아서(403) 뺐습니다.

## 공통으로 좋은 점

- 한글 본문은 한 줄 38~47자(608~748px), 줄 간격 1.7~1.8이 편했습니다. 영어 블로그의 1.5는 한글에 좁습니다.
- 긴 글은 넓은 화면에서 고정 목차가 표준입니다.
- 데모는 본문 폭의 둥근 상자에 넣고, 조작은 슬라이더와 재생 버튼 한두 개로 적게 둡니다. 본문 낱말과 데모를 같은 색이나 기호로 이으면 이해가 빠릅니다.
- 어두운 화면은 순검정보다 짙은 회색이나 남색 계열이 편했습니다.
- 16곳 중 구조화 데이터가 있는 곳은 4곳, llms.txt는 3곳뿐입니다. yceffort.kr이 SEO와 AEO의 가장 좋은 본보기입니다.

## 두 방향

### A. 차분한 문서형

- 글꼴: Pretendard Variable(본문, 제목), JetBrains Mono(코드)
- 본문: 17px, 줄 간격 1.75, 글 폭 680px(한글 약 40자). 휴대폰 16px
- 제목: h1 36px/700, h2 26px/700, h3 20px/600
- 색(밝은 화면): 바탕 #FFFFFF, 글자 #1F2328, 보조 #59636E, 선 #E5E7EB, 강조 #2457D6
- 색(어두운 화면): 바탕 #0F1115, 칸 #171A21, 글자 #E6E8EB, 보조 #9AA4B2, 강조 #7AA2FF
- 목차: 1200px 이상에서 오른쪽 고정, 그보다 좁으면 제목 아래 접는 상자
- 코드 칸: 밝은 칸, 1px 선, 모서리 8px, 파일 이름 줄과 복사 버튼
- 데모 틀: 본문 폭 figure 상자, 아래 조작 줄과 한 줄 설명
- 글 목록: 연도별 텍스트 목록(날짜 · 제목 · 한 줄 요약 · 읽는 시간)

### B. 조금 개성 있는 형

- 글꼴: 마루 부리(제목, 본문), Pretendard(화면 글자), IBM Plex Mono(코드)
- 본문: 18px, 줄 간격 1.85, 글 폭 700px(한글 약 39자). 휴대폰 17px
- 색(밝은 화면): 종이색 바탕 #F7F5EF, 글자 #2A2723, 보조 #6B645A, 강조 주홍 #C2410C
- 색(어두운 화면): 바탕 #1A1814, 글자 #E8E2D6, 강조 #FF8A5B
- 목차: 1280px 이상에서 왼쪽 고정, 오른쪽 여백에 옆주석
- 글 머리: 쓴 날 · 마지막 손본 날 · 시리즈
- 코드 칸: 두 화면 모두 어두운 칸, 강조 줄은 주홍 왼쪽 선
- 데모 틀: 본문보다 넓게(960px) 튀어나오게, 본문 낱말과 데모 색 맞추기
- 글 목록: 주제 · 시리즈 칩 거르기, 대표 글은 데모 썸네일 카드

## SEO와 AEO (두 방향 공통)

`lang="ko"`, 글마다 BlogPosting(작성자, 발행일, 수정일)과 BreadcrumbList, canonical, 글별 og:image, RSS, 사이트맵, llms.txt, 제목 앵커, 페이지마다 h1 하나.
