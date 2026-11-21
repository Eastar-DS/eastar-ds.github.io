/**
 * IndexNow(https://www.indexnow.org) 설정입니다.
 *
 * - 키는 규격상 공개되는 값입니다. 검색 엔진이 사이트 맨 위의 `{키}.txt`(public/ 아래 같은 이름 파일)를 읽어 사이트 주인인지 확인합니다.
 *   키를 바꾸면 public/의 키 파일 이름과 내용도 함께 바꿉니다(시험이 둘이 같은지 봅니다).
 * - 참여 검색 엔진은 받은 주소를 서로 나누므로 한 곳에만 보냅니다(IndexNow 문서 「Requirement for search engines」, FAQ 「How Do I Submit a URL」).
 *   한국어 블로그라 네이버에 보내고, Bing 등 다른 참여 엔진은 네이버가 나눠 줍니다.
 */
export const INDEXNOW_KEY = "f101b9946c36460af3a62be900194718";

/** 접수 주소. 다른 참여 엔진으로 바꾸려면 https://www.indexnow.org/searchengines.json 의 api 값을 씁니다 */
export const INDEXNOW_ENDPOINT = "https://searchadvisor.naver.com/indexnow";

/** 배포한 페이지마다 글의 해시를 적은 파일. 다음 배포 때 이 파일과 견줘 바뀐 페이지만 고릅니다 */
export const PAGE_MANIFEST_FILE = "indexnow-pages.json";

/** 한 번에 보낼 수 있는 주소 수 (IndexNow 문서 「Submitting set of URLs」) */
export const MAX_URLS_PER_REQUEST = 10_000;
