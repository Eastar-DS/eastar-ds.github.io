import type { Context } from "hono";

import {
  POSTHOG_HOSTS,
  POSTHOG_PUBLIC_AUTHORIZATION_PATTERN,
  RELAY_ASSET_PATH_PATTERN,
  RELAY_PATH_PREFIX,
} from "../constants/relay";
import type { Env } from "../types/env";
import readConfig from "../utils/readConfig";

type AppContext = Context<{ Bindings: Env }>;

/**
 * PostHog로 넘길 요청 머리. 쿠키와 Host는 지우고, Authorization은 PostHog 공개 프로젝트 키(phc_ 등)일 때만 남깁니다.
 * Origin은 남깁니다. PostHog는 Origin을 보고 CORS 머리(Access-Control-Allow-Origin)를 돌려주기 때문입니다.
 */
const toForwardHeaders = (request: Request) => {
  const headers = new Headers(request.headers);
  const authorization = headers.get("Authorization");

  headers.delete("Cookie");
  headers.delete("Host");
  if (authorization && !POSTHOG_PUBLIC_AUTHORIZATION_PATTERN.test(authorization)) headers.delete("Authorization");

  return headers;
};

/**
 * 정적 파일의 저장 키. PostHog 정적 서버는 같은 주소라도 Origin마다 다른 CORS 머리를 주므로(Vary: Origin) 키에 Origin을 넣습니다.
 * Cloudflare 캐시는 Vary를 보지 않아서 키를 직접 나눕니다. 이 주소는 저장 키로만 쓰고 부르지 않습니다.
 */
export const toAssetCacheKey = (request: Request) => {
  const url = new URL(request.url);

  url.searchParams.set("__origin", request.headers.get("Origin") ?? "");

  return new Request(url.toString(), { method: "GET" });
};

/** 정적 파일(SDK, 녹화 도구, 원격 설정)은 정적 파일 서버에서 받아 이 데이터 센터에 저장해 두고 씁니다 */
const retrieveAsset = async ({ c, targetUrl }: { c: AppContext; targetUrl: string }) => {
  const headers = toForwardHeaders(c.req.raw);

  if (c.req.method !== "GET") return fetch(targetUrl, { method: c.req.method, headers });

  const cacheKey = toAssetCacheKey(c.req.raw);
  const cached = await caches.default.match(cacheKey);

  if (cached) return cached;

  const response = await fetch(targetUrl, { headers });

  if (response.ok) c.executionCtx.waitUntil(caches.default.put(cacheKey, response.clone()));

  return response;
};

/**
 * 이벤트 · 설정 · 녹화 요청은 PostHog API 서버로 그대로 넘깁니다.
 * PostHog 문서대로 방문자 IP를 X-Forwarded-For로 넘겨 PostHog가 대략의 위치를 알게 합니다.
 */
const forwardRequest = async ({ c, targetUrl }: { c: AppContext; targetUrl: string }) => {
  const headers = toForwardHeaders(c.req.raw);
  const clientIp = c.req.header("CF-Connecting-IP");

  if (clientIp) headers.set("X-Forwarded-For", clientIp);

  const hasBody = c.req.method !== "GET" && c.req.method !== "HEAD";

  return fetch(targetUrl, {
    method: c.req.method,
    headers,
    body: hasBody ? await c.req.raw.arrayBuffer() : undefined,
    redirect: "manual",
  });
};

/**
 * PostHog 중계. `/bridge/static/*` · `/bridge/array/*`는 정적 파일 서버로, 나머지 `/bridge/*`는 API 서버로 넘깁니다.
 * PostHog 응답의 CORS 머리는 PostHog가 정하므로 그대로 돌려줍니다.
 */
const relay = (c: AppContext) => {
  const url = new URL(c.req.url);
  const path = url.pathname.slice(RELAY_PATH_PREFIX.length) || "/";
  const hosts = POSTHOG_HOSTS[readConfig(c.env).posthogRegion];

  if (RELAY_ASSET_PATH_PATTERN.test(path)) {
    return retrieveAsset({ c, targetUrl: `https://${hosts.asset}${path}${url.search}` });
  }

  return forwardRequest({ c, targetUrl: `https://${hosts.api}${path}${url.search}` });
};

export default relay;
