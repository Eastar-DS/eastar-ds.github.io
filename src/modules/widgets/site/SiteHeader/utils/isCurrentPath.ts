interface IsCurrentPathParams {
  /** 지금 페이지의 주소. 예: `/about/` */
  pathname: string;
  /** 메뉴 링크의 주소. `#`이 붙은 링크는 페이지 안의 자리라서 지금 페이지로 보지 않습니다 */
  href: string;
}

const withTrailingSlash = (path: string) =>
  path.endsWith("/") ? path : `${path}/`;

/** 메뉴 링크가 지금 페이지를 가리키는지 판단합니다 */
const isCurrentPath = ({ pathname, href }: IsCurrentPathParams) => {
  if (href.includes("#")) return false;

  if (href === "/series/" && pathname.startsWith(href)) return true;

  return withTrailingSlash(pathname) === withTrailingSlash(href);
};

export default isCurrentPath;
