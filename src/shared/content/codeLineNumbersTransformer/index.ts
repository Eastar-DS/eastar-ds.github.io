import type { ShikiConfig } from "astro";

type ShikiTransformer = NonNullable<ShikiConfig["transformers"]>[number];

// 이보다 긴 코드에만 줄 번호를 둡니다. 짧은 코드는 줄 번호가 읽기를 방해합니다 (docs/design-system.md 2.3 「가독성 값」)
const MIN_LINES_EXCLUSIVE = 20;

/** 줄 번호를 붙일 만큼 긴 코드인지 판단합니다 */
export const shouldShowLineNumbers = (lineCount: number) => lineCount > MIN_LINES_EXCLUSIVE;

/**
 * 20줄 넘는 코드 칸의 `<pre>`에 `data-line-numbers`를 붙이는 Shiki transformer입니다.
 * 줄 번호 자체는 CSS counter(`::before`)가 그려서 코드를 복사해도 섞이지 않습니다.
 */
const codeLineNumbersTransformer = () => {
  const transformer: ShikiTransformer = {
    name: "code-line-numbers",
    pre(node) {
      if (shouldShowLineNumbers(this.tokens.length)) {
        node.properties.dataLineNumbers = "";
      }
    },
  };

  return transformer;
};

export default codeLineNumbersTransformer;
