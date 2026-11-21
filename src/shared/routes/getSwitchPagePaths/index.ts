/**
 * 기능 스위치로 켜고 끄는 고정 주소 페이지(이력서 · 포트폴리오)의 `getStaticPaths` 값을 만듭니다.
 *
 * 고정 주소 페이지(`pages/resume/index.astro`)에서는 `getStaticPaths`를 쓸 수 없어서,
 * 페이지를 `pages/resume/[...path]/index.astro`처럼 나머지 매개변수 폴더에 두고 `path`를 비워 폴더 주소(`/resume/`) 하나만 만듭니다.
 * 꺼져 있으면 빈 배열이라 배포 빌드에 페이지가 생기지 않고, 사이트맵에도 들어가지 않습니다.
 */
const getSwitchPagePaths = (isShown: boolean) =>
  isShown ? [{ params: { path: undefined } }] : [];

export default getSwitchPagePaths;
