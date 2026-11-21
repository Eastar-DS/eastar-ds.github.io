/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// Astro의 Vite 설정(경로 별칭 @/ 등)을 그대로 써서 단위 테스트를 돌립니다
export default getViteConfig({
  test: {
    include: ["src/**/test.ts", "src/**/*.test.ts"],
  },
});
