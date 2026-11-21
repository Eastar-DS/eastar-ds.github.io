import getPosts from "@/shared/content/getPosts";
import toSeriesList from "@/shared/content/toSeriesList";

/** 시리즈 목록을 가져옵니다 */
const getSeriesList = async () => toSeriesList(await getPosts());

export default getSeriesList;
