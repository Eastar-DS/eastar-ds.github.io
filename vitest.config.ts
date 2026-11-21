/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// Astro의 Vite 설정(경로 별칭 @/ 등)을 그대로 써서 단위 테스트를 돌립니다
export default getViteConfig({
  test: {
    include: ["src/**/test.ts", "src/**/*.test.ts", "scripts/**/*.test.ts"],
    // vitest는 CSS를 빈 글로 바꿔 불러옵니다. 공유 미리보기 그림이 tokens.css의 색을 ?raw로 읽으므로 이 파일만 그대로 둡니다
    css: { include: [/tokens\.css/] },
  },
});
