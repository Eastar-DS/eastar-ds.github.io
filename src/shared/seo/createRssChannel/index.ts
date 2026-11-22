import { SITE } from "@/shared/constants/site";
import { PATHS } from "@/shared/routes/paths";

const ATOM_NAMESPACE = "http://www.w3.org/2005/Atom";

/**
 * RSS 채널 머리에 더할 값(`@astrojs/rss`의 xmlns · customData)을 만듭니다.
 * 언어와 함께, 피드가 제 주소를 알리는 `<atom:link rel="self">`를 넣습니다. W3C 피드 검사기가 RSS 2.0에 권하는 줄입니다.
 * @see https://validator.w3.org/feed/docs/warning/MissingAtomSelfLink.html
 */
const createRssChannel = () => {
  const feedUrl = new URL(PATHS.rss, SITE.url).href;

  return {
    xmlns: { atom: ATOM_NAMESPACE },
    customData: `<language>${SITE.language}</language><atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>`,
  };
};

export default createRssChannel;
