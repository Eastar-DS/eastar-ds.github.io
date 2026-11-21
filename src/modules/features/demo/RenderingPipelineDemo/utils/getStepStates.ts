import { PIPELINE_STEPS } from "@/modules/features/demo/RenderingPipelineDemo/constants/pipeline";
import type {
  CssPropertyId,
  StepId,
  StepState,
} from "@/modules/features/demo/RenderingPipelineDemo/types/pipeline";

import findCssProperty from "./findCssProperty";

interface GetStepStatesParams {
  propertyId: CssPropertyId;
  /** 속성을 바꾼 프레임 수. 다시 하는 단계는 프레임마다 한 번씩 돕니다 */
  frameCount: number;
}

/** 고른 속성에 따라 네 단계 각각을 다시 하는지, 몇 번 했는지 정합니다 */
const getStepStates = ({ propertyId, frameCount }: GetStepStatesParams) => {
  const rerunStepIds: readonly StepId[] =
    findCssProperty(propertyId).rerunStepIds;

  return PIPELINE_STEPS.map((step) => {
    const isRerun = rerunStepIds.includes(step.id);
    const state: StepState = {
      id: step.id,
      label: step.label,
      isRerun,
      runCount: isRerun ? frameCount : 0,
    };

    return state;
  });
};

export default getStepStates;
