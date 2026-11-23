import { satteri } from "@astrojs/markdown-satteri";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { fileURLToPath } from "node:url";

import { transformerMetaHighlight, transformerNotationDiff } from "@shikijs/transformers";
import { defineConfig } from "astro/config";

import { IS_COMMENTS_ENABLED } from "./src/shared/constants/features";
import { POSTHOG_PROJECT_KEY, TURNSTILE_SITE_KEY, WORKER_URL } from "./src/shared/constants/services";
import codeLineNumbersTransformer from "./src/shared/content/codeLineNumbersTransformer";
import { CODE_THEMES } from "./src/shared/content/codeThemes";
import codeTitleTransformer from "./src/shared/content/codeTitleTransformer";
import readPostLastmods from "./src/shared/content/readPostLastmods";
import addPostLastmod from "./src/shared/seo/addPostLastmod";
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

// 사이트맵의 글 주소에 붙일 lastmod(고친 날, 없으면 쓴 날). 사이트맵 통합은 콘텐츠 모음을 읽지 못해 글 원본의 앞머리를 직접 읽습니다
const postLastmods = readPostLastmods();

// https://astro.build/config
export default defineConfig({
  site: "https://eastar-ds.github.io",
  // GitHub Pages는 /posts/글-이름/ 을 posts/글-이름/index.html 로 내보내므로 주소 끝의 / 를 늘 붙입니다
  trailingSlash: "always",
  build: {
    // CSS를 따로 받지 않고 HTML 안에 넣어, 첫 그림이 미리 받는 글꼴과 대역폭을 나누지 않게 합니다(docs/design-system.md 10장).
    // 2026-11-22 Lighthouse 휴대폰으로 잼: 데모 없는 글 FCP 1.05초 → 0.75~0.80초, 첫 화면 0.75초 → 0.60초.
    // 대신 페이지마다 HTML이 gzip 3~7KB 커지고 CSS를 페이지 사이에 캐시하지 못합니다. 전역 CSS를 크게 늘릴 때 다시 잽니다
    inlineStylesheets: "always",
  },
  integrations: [
    mdx(),
    react(),
    // 글 주소에만 lastmod를 붙이고, 글이 아닌 페이지에는 붙이지 않습니다(빌드 시각을 넣지 않음, docs/content-guide.md 9장)
    sitemap({ serialize: (item) => addPostLastmod({ item, lastmods: postLastmods }) }),
  ],
  vite: {
    resolve: {
      alias: optionalPartAliases,
    },
  },
  markdown: {
    // Astro 7 기본 마크다운 처리기(Sätteri)에 각주 문구를 한국어로 넘깁니다. MDX도 이 처리기를 물려받습니다.
    // markdown.remarkRehype.footnoteLabel은 unified 처리기용이라 Sätteri에서는 쓰지 않습니다
    processor: satteri({
      features: {
        gfm: {
          footnotes: {
            label: "각주",
            backContent: "↩",
            // 같은 각주를 여러 곳에서 달면 두 번째부터 링크 글이 「↩²」처럼 자리 번호를 보이므로, 그 숫자를 따로 된 낱말로 이름 끝에 둡니다.
            // 보이는 글(2)이 이름에 그대로 들어 있어야 음성으로 고르는 사람이 부를 수 있습니다(WCAG 2.5.3). 괄호 안 글은 이름 비교에서 빠지므로 괄호로 감싸지 않습니다
            backLabel: (referenceNumber, rerunIndex) =>
              rerunIndex > 1
                ? `${referenceNumber}번 각주를 단 곳으로 돌아가기, ${rerunIndex}`
                : `${referenceNumber}번 각주를 단 곳으로 돌아가기`,
          },
        },
      },
    }),
    shikiConfig: {
      // VS Code Light+ / Dark+에서 대비가 모자란 색만 고친 두 테마 (docs/design-system.md 2.3 「코드」)
      themes: CODE_THEMES,
      // 글자색과 바탕을 light-dark()로 내보내서 color-scheme만 바꾸면 코드 색도 함께 바뀝니다
      defaultColor: "light-dark()",
      transformers: [
        // ```ts {3,5-6} 처럼 적은 줄에 highlighted 클래스를 붙입니다
        transformerMetaHighlight(),
        transformerNotationDiff(),
        codeTitleTransformer(),
        codeLineNumbersTransformer(),
      ],
    },
  },
});
