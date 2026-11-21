import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { transformerMetaHighlight } from "@shikijs/transformers";
import { defineConfig } from "astro/config";

import codeLineNumbersTransformer from "./src/shared/content/codeLineNumbersTransformer";
import { CODE_THEMES } from "./src/shared/content/codeThemes";
import codeTitleTransformer from "./src/shared/content/codeTitleTransformer";

// https://astro.build/config
export default defineConfig({
  site: "https://eastar-ds.github.io",
  // GitHub Pages는 /posts/글-이름/ 을 posts/글-이름/index.html 로 내보내므로 주소 끝의 / 를 늘 붙입니다
  trailingSlash: "always",
  integrations: [mdx(), react(), sitemap()],
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
