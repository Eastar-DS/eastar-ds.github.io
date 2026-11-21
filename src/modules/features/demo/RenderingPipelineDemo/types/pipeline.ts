import type {
  CSS_PROPERTIES,
  PIPELINE_STEPS,
} from "@/modules/features/demo/RenderingPipelineDemo/constants/pipeline";

export type StepId = (typeof PIPELINE_STEPS)[number]["id"];

export type CssPropertyId = (typeof CSS_PROPERTIES)[number]["id"];

/** 데모에 그리는 단계 하나의 상태 */
export interface StepState {
  id: StepId;
  label: string;
  isRerun: boolean;
  /** 지금까지 이 단계를 다시 한 횟수(프레임 수) */
  runCount: number;
}
