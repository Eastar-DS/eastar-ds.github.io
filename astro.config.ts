import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import codeTitleTransformer from "./src/shared/content/codeTitleTransformer";

// https://astro.build/config
export default defineConfig({
  site: "https://eastar-ds.github.io",
  // GitHub Pages는 /posts/글-이름/ 을 posts/글-이름/index.html 로 내보내므로 주소 끝의 / 를 늘 붙입니다
  trailingSlash: "always",
  integrations: [mdx(), react(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: { light: "github-light-default", dark: "github-dark-default" },
      // 글자색을 light-dark()로 내보내서 color-scheme만 바꾸면 코드 색도 함께 바뀝니다
      defaultColor: "light-dark()",
      transformers: [codeTitleTransformer()],
    },
  },
});
