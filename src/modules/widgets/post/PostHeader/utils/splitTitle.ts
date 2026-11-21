/**
 * 제목을 첫 `: ` 뒤에서 두 덩어리로 나눕니다. 콜론이 없으면 한 덩어리입니다.
 * 덩어리마다 inline-block으로 그려서, 줄을 바꿔야 할 때 콜론 뒤에서 먼저 바꾸게 합니다.
 */
const splitTitle = (title: string) => {
  const index = title.indexOf(": ");

  if (index === -1) return [title];

  return [title.slice(0, index + 1), title.slice(index + 2)];
};

export default splitTitle;
