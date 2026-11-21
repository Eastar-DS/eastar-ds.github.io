/** 브라우저가 화면을 그리는 네 단계. 순서대로 놓습니다 */
export const PIPELINE_STEPS = [
  { id: "style", label: "스타일" },
  { id: "layout", label: "레이아웃" },
  { id: "paint", label: "페인트" },
  { id: "composite", label: "합성" },
] as const;

/**
 * 데모에서 고를 수 있는 CSS 속성과, 그 속성을 바꿨을 때 다시 하는 단계.
 * transform은 요소가 자기 레이어에 올라가 있을 때(애니메이션 중이거나 will-change가 있을 때)를 기준으로 합니다.
 */
export const CSS_PROPERTIES = [
  {
    id: "width",
    rerunStepIds: ["style", "layout", "paint", "composite"],
    summary:
      "width를 바꾸면 크기와 자리를 다시 계산해야 해서 네 단계를 모두 다시 합니다.",
  },
  {
    id: "background-color",
    rerunStepIds: ["style", "paint", "composite"],
    summary:
      "background-color를 바꾸면 자리는 그대로라서 레이아웃을 건너뛰고 페인트부터 다시 합니다.",
  },
  {
    id: "transform",
    rerunStepIds: ["style", "composite"],
    summary:
      "transform을 바꾸면 레이아웃과 페인트를 건너뛰고 합성만 다시 합니다.",
  },
] as const;

/** 재생 버튼을 눌렀을 때 처음부터 끝까지 움직이는 시간 */
export const PLAY_DURATION_MS = 2000;
