import type { ShikiConfig } from "astro";

type ShikiTransformer = NonNullable<ShikiConfig["transformers"]>[number];

/** 코드 칸 메타 문자열에서 `title="파일 이름"`을 읽습니다. 없으면 undefined입니다 */
export const parseCodeTitle = (meta: string | undefined) => {
  const match = meta?.match(/title=(?:"([^"]*)"|'([^']*)'|(\S+))/);

  return match?.[1] ?? match?.[2] ?? match?.[3];
};

/**
 * ```ts title="resize.ts" 처럼 적은 파일 이름을 `<pre data-title>`로 옮기는 Shiki transformer입니다.
 * 글 화면의 코드 칸 컴포넌트가 이 값으로 파일 이름 줄을 그립니다.
 */
const codeTitleTransformer = () => {
  const transformer: ShikiTransformer = {
    name: "code-title",
    pre(node) {
      const title = parseCodeTitle(this.options.meta?.__raw);

      if (title) {
        node.properties.dataTitle = title;
      }
    },
  };

  return transformer;
};

export default codeTitleTransformer;
