import type { CSSProperties } from "react";

import type { CssPropertyId } from "@/modules/features/demo/RenderingPipelineDemo/types/pipeline";

interface GetPreviewStyleParams {
  propertyId: CssPropertyId;
  /** 진행 정도 (0~100) */
  progress: number;
}

// 미리보기 상자의 처음 폭(px). index.module.css의 .box 폭과 같아야 합니다
const BOX_SIZE = 48;

/** 미리보기 상자에 고른 속성만 바꿔 넣습니다. 실제로 그 속성이 바뀌므로 브라우저도 같은 단계를 다시 합니다 */
const getPreviewStyle = ({ propertyId, progress }: GetPreviewStyleParams) => {
  const ratio = Math.min(Math.max(progress, 0), 100) / 100;
  let style: CSSProperties = {};

  switch (propertyId) {
    case "width":
      style = { width: `calc(${BOX_SIZE}px + (100% - ${BOX_SIZE}px) * ${ratio})` };
      break;
    case "background-color":
      style = {
        backgroundColor: `color-mix(in oklab, var(--color-accent) ${Math.round(ratio * 100)}%, var(--color-accent-soft))`,
      };
      break;
    case "transform":
      style = {
        transform: `translateX(calc((100cqw - ${BOX_SIZE}px) * ${ratio}))`,
      };
      break;
  }

  return style;
};

export default getPreviewStyle;
