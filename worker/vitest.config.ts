import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// 시험은 실제 Workers 실행 환경(workerd, Miniflare)에서 돕니다. 비밀값은 시험용 가짜 값을 넣고, 바깥 호출(노션 · Turnstile · PostHog)은 시험 안에서 가짜로 바꿉니다
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          NOTION_TOKEN: "test-notion-token",
          TURNSTILE_SECRET_KEY: "test-turnstile-secret",
          NOTION_DATA_SOURCE_ID: "0f0e0d0c-0b0a-4908-8706-050403020100",
          NOTION_API_BASE: "",
          COMMENT_MODERATION: "immediate",
          COMMENTS_CACHE_TTL_SECONDS: "60",
          TURNSTILE_EXPECTED_HOSTNAMES: "eastar-ds.github.io",
          POSTHOG_REGION: "us",
        },
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
