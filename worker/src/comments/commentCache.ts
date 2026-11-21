import type { CommentListResponse, ModerationMode } from "../types/comment";

/**
 * 글별 댓글 목록을 잠깐 저장해 둡니다. 노션 API는 초당 약 3회라서, 같은 글을 여러 사람이 열어도 노션은 한 번만 부르게 합니다.
 *
 * 두 겹으로 둡니다.
 * 1. Worker 인스턴스의 메모리: 어느 주소(workers.dev 포함)에서나 됩니다. 인스턴스마다 따로이고, 인스턴스가 내려가면 사라집니다.
 * 2. Cloudflare Cache API(caches.default): 같은 데이터 센터의 인스턴스가 함께 씁니다.
 *    Cloudflare 문서는 사용자 도메인에서 동작한다고 적고 workers.dev는 따로 적지 않아서, workers.dev에서는 동작하지 않을 수 있습니다.
 *
 * 비우기(쓴 뒤)는 이 데이터 센터에만 닿습니다(Cache API의 delete도 같음). 다른 곳의 저장분은 저장 시간(기본 60초)이 지나면 새로 읽습니다.
 */

// 메모리에 둘 글 수의 끝. 넘으면 가장 오래 둔 것부터 지웁니다
const MEMORY_MAX_ENTRIES = 200;

const memoryCache = new Map<string, { expiresAt: number; body: CommentListResponse }>();

interface CacheKeyParams {
  /** Worker가 받은 요청의 주소. 저장 키를 같은 주소 아래에 만듭니다 */
  requestUrl: string;
  postPath: string;
  moderation: ModerationMode;
}

/** 저장 키. 공개 방식이 바뀌면 다른 키를 쓰도록 공개 방식도 넣습니다 */
export const toCommentCacheKey = ({ requestUrl, postPath, moderation }: CacheKeyParams) => {
  const url = new URL("/__cache/comments", requestUrl);

  url.searchParams.set("postPath", postPath);
  url.searchParams.set("moderation", moderation);

  return url.toString();
};

const rememberInMemory = ({ cacheKey, body, ttlSeconds }: { cacheKey: string; body: CommentListResponse; ttlSeconds: number }) => {
  memoryCache.delete(cacheKey);
  memoryCache.set(cacheKey, { expiresAt: Date.now() + ttlSeconds * 1000, body });

  while (memoryCache.size > MEMORY_MAX_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;

    if (oldestKey === undefined) break;
    memoryCache.delete(oldestKey);
  }
};

export const readCommentCache = async ({ cacheKey, ttlSeconds }: { cacheKey: string; ttlSeconds: number }) => {
  const remembered = memoryCache.get(cacheKey);

  if (remembered && remembered.expiresAt > Date.now()) return remembered.body;
  memoryCache.delete(cacheKey);

  const cached = await caches.default.match(cacheKey);

  if (!cached) return null;

  const body = (await cached.json()) as CommentListResponse;

  rememberInMemory({ cacheKey, body, ttlSeconds });

  return body;
};

export const writeCommentCache = async ({
  cacheKey,
  body,
  ttlSeconds,
}: {
  cacheKey: string;
  body: CommentListResponse;
  ttlSeconds: number;
}) => {
  rememberInMemory({ cacheKey, body, ttlSeconds });
  await caches.default.put(
    cacheKey,
    new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json", "Cache-Control": `max-age=${ttlSeconds}` },
    }),
  );
};

export const purgeCommentCache = async (cacheKey: string) => {
  memoryCache.delete(cacheKey);
  await caches.default.delete(cacheKey);
};
