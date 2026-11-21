/**
 * 제목을 첫 `: ` 뒤에서 두 덩어리로 나눕니다. 콜론이 없으면 한 덩어리입니다.
 * 글 머리(`PostHeader`)는 덩어리마다 inline-block으로 그려서 줄을 바꿔야 할 때 콜론 뒤에서 먼저 바꾸고,
 * 공유 미리보기 그림(`shared/seo/createOgImage`)은 덩어리마다 줄을 나눠 그립니다.
 */
const splitTitle = (title: string) => {
  const index = title.indexOf(": ");

  if (index === -1) return [title];

  return [title.slice(0, index + 1), title.slice(index + 2)];
};

export default splitTitle;
