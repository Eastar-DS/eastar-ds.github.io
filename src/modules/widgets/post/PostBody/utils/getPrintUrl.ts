import toDisplayUrl from "@/shared/utils/toDisplayUrl";

/**
 * 본문 링크를 인쇄할 때 링크 글 뒤에 붙일 주소를 돌려줍니다. 종이에서는 링크를 누를 수 없기 때문입니다.
 * 다른 사이트로 가는 링크(`http(s)://`)만 `https://`를 뗀 주소로 돌려주고, 사이트 안 링크 · 각주 링크(`/…`, `#…`)는 `undefined`입니다.
 * 이력서의 「관련 글」 인쇄(docs/design-system.md 7.25)와 같은 꼴입니다.
 */
const getPrintUrl = (href: string | undefined) => {
  if (!href || !/^https?:\/\//i.test(href)) return undefined;

  return toDisplayUrl(href);
};

export default getPrintUrl;
