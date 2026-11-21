const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface SiteverifyResponse {
  success: boolean;
  hostname?: string;
  "error-codes"?: string[];
}

interface VerifyTurnstileParams {
  token: string;
  secretKey: string;
  /** 받아들일 hostname. 비어 있으면 검사하지 않습니다 */
  expectedHostnames: string[];
}

/**
 * Turnstile 토큰을 Cloudflare에 확인합니다. 토큰은 한 번만 쓸 수 있고 5분 동안만 유효합니다.
 * 방문자 IP(remoteip)는 보내지 않습니다(선택 값). 로그에는 오류 코드만 남깁니다.
 */
const verifyTurnstile = async ({ token, secretKey, expectedHostnames }: VerifyTurnstileParams) => {
  const response = await fetch(SITEVERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: secretKey, response: token, idempotency_key: crypto.randomUUID() }),
  });

  if (!response.ok) {
    console.warn("Turnstile 확인 요청 실패", { status: response.status });
    return false;
  }

  const result = (await response.json()) as SiteverifyResponse;

  if (!result.success) {
    console.warn("Turnstile 확인 실패", { errorCodes: result["error-codes"] ?? [] });
    return false;
  }
  if (expectedHostnames.length > 0 && !expectedHostnames.includes(result.hostname ?? "")) {
    console.warn("Turnstile hostname이 다름");
    return false;
  }

  return true;
};

export default verifyTurnstile;
