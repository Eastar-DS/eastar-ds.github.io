import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { fileURLToPath } from "node:url";

import { transformerMetaHighlight } from "@shikijs/transformers";
import { defineConfig } from "astro/config";

import { IS_COMMENTS_ENABLED } from "./src/shared/constants/features";
import { POSTHOG_PROJECT_KEY, TURNSTILE_SITE_KEY, WORKER_URL } from "./src/shared/constants/services";
import codeLineNumbersTransformer from "./src/shared/content/codeLineNumbersTransformer";
import { CODE_THEMES } from "./src/shared/content/codeThemes";
import codeTitleTransformer from "./src/shared/content/codeTitleTransformer";
import isCommentsReady from "./src/shared/utils/isCommentsReady";
import shouldLoadAnalytics from "./src/shared/utils/shouldLoadAnalytics";

// 설정 값이 비어 있는 기능의 부품을 빈 부품으로 바꿔, 그 CSS와 스크립트가 빌드 결과에 실리지 않게 합니다.
// Astro는 그리지 않는 부품이라도 import만 되어 있으면 CSS와 스크립트를 빌드 결과(dist)에 넣고, 글꼴 만들기가 그 글자까지 모으기 때문입니다.
// - 댓글: Comments 위젯의 ./ui/CommentSection.astro
// - 방문 통계: Document의 ./ui/AnalyticsScript.astro
const EMPTY_PART = fileURLToPath(new URL("./scripts/EmptyPart.astro", import.meta.url));
const optionalPartAliases = [
  ...(isCommentsReady({ isEnabled: IS_COMMENTS_ENABLED, workerUrl: WORKER_URL, turnstileSiteKey: TURNSTILE_SITE_KEY })
    ? []
    : [{ find: /^\.\/ui\/CommentSection\.astro$/, replacement: EMPTY_PART }]),
  ...(shouldLoadAnalytics({ workerUrl: WORKER_URL, projectKey: POSTHOG_PROJECT_KEY })
    ? []
    : [{ find: /^\.\/ui\/AnalyticsScript\.astro$/, replacement: EMPTY_PART }]),
];

// https://astro.build/config
export default defineConfig({
  site: "https://eastar-ds.github.io",
  // GitHub Pages는 /posts/글-이름/ 을 posts/글-이름/index.html 로 내보내므로 주소 끝의 / 를 늘 붙입니다
  trailingSlash: "always",
  integrations: [mdx(), react(), sitemap()],
  vite: {
    resolve: {
      alias: optionalPartAliases,
    },
  },
  markdown: {
    shikiConfig: {
      // VS Code Light+ / Dark+에서 대비가 모자란 색만 고친 두 테마 (docs/design-system.md 2.3 「코드」)
      themes: CODE_THEMES,
      // 글자색과 바탕을 light-dark()로 내보내서 color-scheme만 바꾸면 코드 색도 함께 바뀝니다
      defaultColor: "light-dark()",
      transformers: [
        // ```ts {3,5-6} 처럼 적은 줄에 highlighted 클래스를 붙입니다
        transformerMetaHighlight(),
        codeTitleTransformer(),
        codeLineNumbersTransformer(),
      ],
    },
  },
});
