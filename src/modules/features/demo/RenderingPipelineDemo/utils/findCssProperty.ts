import { CSS_PROPERTIES } from "@/modules/features/demo/RenderingPipelineDemo/constants/pipeline";
import type { CssPropertyId } from "@/modules/features/demo/RenderingPipelineDemo/types/pipeline";

/** 속성 id로 데모의 속성 정보(다시 하는 단계, 한 줄 설명)를 찾습니다 */
const findCssProperty = (propertyId: CssPropertyId) =>
  CSS_PROPERTIES.find((property) => property.id === propertyId) ??
  CSS_PROPERTIES[0];

export default findCssProperty;
