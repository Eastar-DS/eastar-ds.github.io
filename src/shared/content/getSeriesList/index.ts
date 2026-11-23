import getPosts from "@/shared/content/getPosts";
import toSeriesList from "@/shared/content/toSeriesList";

/** 시리즈 목록을 가져옵니다 */
const getSeriesList = async () => {
  const visibleIds = new Set((await getPosts()).map((post) => post.series?.id));

  return toSeriesList(await getPosts({ includeDrafts: true })).filter((series) => visibleIds.has(series.id));
};

export default getSeriesList;
