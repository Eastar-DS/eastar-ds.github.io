import getPosts from "@/shared/content/getPosts";
import getSeriesList from "@/shared/content/getSeriesList";
import toSeriesParts from "@/shared/content/toSeriesParts";

/** 공개한 편이 있는 시리즈의 소개와 전체 편 목록을 읽습니다. */
const getSeries = async (id: string) => {
  const series = (await getSeriesList()).find((item) => item.id === id);

  if (!series) throw new Error(`시리즈가 없습니다: ${id}`);

  return { ...series, parts: toSeriesParts({ posts: await getPosts({ includeDrafts: true }), id }) };
};

export default getSeries;
