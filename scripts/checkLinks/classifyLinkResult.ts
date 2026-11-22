// 바깥 링크의 응답을 「통과 · 깨짐 · 확인 못 함」으로 가르는 순수 함수입니다.
// 깨짐은 주소가 사라진 것이 분명할 때(404, 410, 없는 도메인)만이고, 봇을 막거나(401, 403) 잠시 막히거나(429, 5xx, 시간 초과) 하면 「확인 못 함」입니다.
// 깨짐이 있을 때만 워크플로가 실패해서, 바깥 사이트가 잠시 흔들려도 빨간 표시가 나지 않게 합니다.

export type LinkVerdict = "ok" | "broken" | "unknown";

interface ClassifyLinkResultParams {
  /** 응답 코드. 응답을 받지 못했으면 없음 */
  status?: number;
  /** 응답을 받지 못한 까닭(네트워크 오류 코드나 메시지) */
  error?: string;
}

const GONE_STATUSES = [404, 410];
const MISSING_HOST_ERRORS = ["ENOTFOUND", "EAI_NONAME"];

const classifyLinkResult = ({ status, error }: ClassifyLinkResultParams) => {
  let verdict: LinkVerdict = "unknown";

  if (status !== undefined && status >= 200 && status < 400) verdict = "ok";
  else if (status !== undefined && GONE_STATUSES.includes(status)) verdict = "broken";
  else if (status === undefined && MISSING_HOST_ERRORS.some((code) => error?.includes(code))) verdict = "broken";

  return verdict;
};

export default classifyLinkResult;
