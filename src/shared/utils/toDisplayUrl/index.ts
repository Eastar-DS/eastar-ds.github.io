/**
 * 주소를 화면과 인쇄물에 보일 짧은 글자로 바꿉니다. 앞의 `https://`와 끝의 `/`를 뺍니다.
 * 이력서는 종이로 뽑아도 주소를 읽을 수 있게 링크 글자에 주소를 그대로 씁니다.
 * @example toDisplayUrl("https://github.com/eastar-DS") // "github.com/eastar-DS"
 */
const toDisplayUrl = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/\/$/, "");

export default toDisplayUrl;
