import { afterEach, describe, expect, it, vi } from "vitest";

import { callWorker, createTestEnv, fakeServices, WORKER_ORIGIN } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PostHog 중계 /bridge/*", () => {
  it("정적 파일(/static/)은 정적 파일 서버로 넘기고, 두 번째부터는 저장해 둔 것을 준다", async () => {
    const services = fakeServices();
    const url = `${WORKER_ORIGIN}/bridge/static/array.js?v=1`;

    const first = await callWorker(new Request(url));
    const second = await callWorker(new Request(url));

    expect(first.status).toBe(200);
    expect(await first.text()).toBe("posthog:/static/array.js");
    expect(await second.text()).toBe("posthog:/static/array.js");
    expect(services.requests.map((request) => request.url)).toEqual(["https://us-assets.i.posthog.com/static/array.js?v=1"]);
  });

  it("정적 파일 요청의 Origin을 넘기고, 저장분은 Origin마다 따로 둔다(PostHog가 Origin마다 CORS 머리를 달리 줌)", async () => {
    const services = fakeServices();
    const url = `${WORKER_ORIGIN}/bridge/array/phc_test/config`;
    const from = (origin: string) => new Request(url, { headers: { Origin: origin, Cookie: "a=b" } });

    await callWorker(from("https://eastar-ds.github.io"));
    await callWorker(from("https://eastar-ds.github.io"));
    await callWorker(from("http://localhost:4321"));

    expect(services.requests.map((request) => request.headers.get("Origin"))).toEqual([
      "https://eastar-ds.github.io",
      "http://localhost:4321",
    ]);
    expect(services.requests[0]?.headers.get("Cookie")).toBeNull();
  });

  it("원격 설정(/array/)도 정적 파일 서버로 넘긴다", async () => {
    const services = fakeServices();

    await callWorker(new Request(`${WORKER_ORIGIN}/bridge/array/phc_test/config.js`));

    expect(services.requests[0]?.url).toBe("https://us-assets.i.posthog.com/array/phc_test/config.js");
  });

  it("이벤트는 API 서버로 본문 그대로 넘기고, 쿠키는 지우고, 방문자 IP를 X-Forwarded-For로 넘긴다", async () => {
    const services = fakeServices();
    const payload = JSON.stringify({ event: "$pageview" });

    await callWorker(
      new Request(`${WORKER_ORIGIN}/bridge/e/?ip=0&compression=none`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "session=secret",
          Authorization: "Basic dXNlcjpwYXNz",
          "CF-Connecting-IP": "203.0.113.9",
        },
        body: payload,
      }),
    );

    const forwarded = services.requests[0];

    expect(forwarded?.url).toBe("https://us.i.posthog.com/e/?ip=0&compression=none");
    expect(forwarded?.method).toBe("POST");
    expect(forwarded?.body).toBe(payload);
    expect(forwarded?.headers.get("Cookie")).toBeNull();
    expect(forwarded?.headers.get("Authorization")).toBeNull();
    expect(forwarded?.headers.get("X-Forwarded-For")).toBe("203.0.113.9");
  });

  it("PostHog 공개 프로젝트 키의 Authorization은 넘긴다", async () => {
    const services = fakeServices();

    await callWorker(
      new Request(`${WORKER_ORIGIN}/bridge/flags/?v=2`, {
        method: "POST",
        headers: { Authorization: "Bearer phc_public_key" },
        body: "{}",
      }),
    );

    expect(services.requests[0]?.headers.get("Authorization")).toBe("Bearer phc_public_key");
  });

  it("EU 지역이면 EU 서버로 넘긴다", async () => {
    const services = fakeServices();
    const testEnv = createTestEnv({ POSTHOG_REGION: "eu" });

    await callWorker(new Request(`${WORKER_ORIGIN}/bridge/static/recorder.js`), testEnv);
    await callWorker(new Request(`${WORKER_ORIGIN}/bridge/s/`, { method: "POST", body: "x" }), testEnv);

    expect(services.requests.map((request) => request.url)).toEqual([
      "https://eu-assets.i.posthog.com/static/recorder.js",
      "https://eu.i.posthog.com/s/",
    ]);
  });

  it("접두어가 다른 경로는 넘기지 않는다", async () => {
    const services = fakeServices();
    const response = await callWorker(new Request(`${WORKER_ORIGIN}/bridgeX/static/array.js`));

    expect(response.status).toBe(404);
    expect(services.requests).toHaveLength(0);
  });
});
