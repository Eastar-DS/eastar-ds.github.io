interface ToCommentsUrlParams {
  /** WORKER_URL. 끝에 / 가 붙어 있어도 됩니다 */
  workerUrl: string;
  /** 목록을 받을 글 주소. 쓰기 주소를 만들 때는 넣지 않습니다 */
  postPath?: string;
}

/** Worker의 댓글 경로 주소를 만듭니다. 목록은 `/comments?postPath=…`, 쓰기는 `/comments` */
const toCommentsUrl = ({ workerUrl, postPath }: ToCommentsUrlParams) => {
  const url = new URL(`${workerUrl.replace(/\/+$/, "")}/comments`);

  if (postPath) url.searchParams.set("postPath", postPath);

  return url.toString();
};

export default toCommentsUrl;
