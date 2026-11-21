/**
 * 빈도 제한에 쓸 키를 만듭니다. IP 원문을 넘기지 않고 SHA-256 해시만 넘깁니다.
 * 이 키는 Cloudflare 빈도 제한 기능의 1분짜리 셈에만 쓰이고, Worker는 IP와 키를 어디에도 저장하지 않습니다.
 */
const toRateLimitKey = async (clientIp: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`comment:${clientIp}`));

  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

export default toRateLimitKey;
