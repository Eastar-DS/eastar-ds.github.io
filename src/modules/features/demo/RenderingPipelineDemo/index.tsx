import DemoControls from "@/shared/components/primitives/ui/DemoControls";
import DemoFrame from "@/shared/components/primitives/ui/DemoFrame";

import useRenderingPipeline from "./model/useRenderingPipeline";
import PipelineStep from "./ui/PipelineStep";
import PreviewBox from "./ui/PreviewBox";
import PropertyPicker from "./ui/PropertyPicker";
import findCssProperty from "./utils/findCssProperty";
import getPreviewStyle from "./utils/getPreviewStyle";
import getStepStates from "./utils/getStepStates";
import styles from "./index.module.css";

/**
 * CSS 속성을 바꿀 때 브라우저가 렌더링의 네 단계(스타일 · 레이아웃 · 페인트 · 합성) 중 어디를 다시 하는지 보여 주는 데모입니다.
 * 속성을 고르고 재생하거나 슬라이더를 움직이면, 미리보기 상자의 그 속성이 실제로 바뀌고 단계별로 다시 한 횟수가 쌓입니다.
 * 글에서는 `<RenderingPipelineDemo client:visible />`로 씁니다.
 * 「다시 함」 단계는 「고른 것」과 같은 강조색으로 표시하고, 글자로도 함께 알립니다.
 * @design design/blog.pen 「데모 틀」 M3NVPX 안의 단계 그림, 화면 「A · 글 화면 · 휴대폰」 CoBjY의 세로 단계
 */
export default function RenderingPipelineDemo() {
  const {
    propertyId,
    progress,
    frameCount,
    isPlaying,
    togglePlay,
    reset,
    changeProgress,
    selectProperty,
  } = useRenderingPipeline();
  const steps = getStepStates({ propertyId, frameCount });
  const roundedProgress = Math.round(progress);

  return (
    <DemoFrame
      caption="width를 바꾸면 네 단계를 모두 다시 하고, transform을 고르면 레이아웃과 페인트를 건너뜁니다."
      controls={
        <DemoControls
          isPlaying={isPlaying}
          onPlayToggle={togglePlay}
          onReset={reset}
          value={roundedProgress}
          onValueChange={changeProgress}
          sliderLabel={`${propertyId} 바꾸기`}
          sliderValueText={`진행 ${roundedProgress}%`}
          status={`${isPlaying ? "재생 중" : "멈춤"} · ${propertyId} ${roundedProgress}%`}
        />
      }
    >
      <div className={styles.container}>
        <PropertyPicker value={propertyId} onChange={selectProperty} />
        <PreviewBox boxStyle={getPreviewStyle({ propertyId, progress })} />
        <ol className={styles.pipeline} aria-label="렌더링 단계">
          {steps.map((step, index) => (
            <PipelineStep
              key={step.id}
              step={step}
              isLast={index === steps.length - 1}
            />
          ))}
        </ol>
        <p className={styles.summary} aria-live="polite">
          {findCssProperty(propertyId).summary}
        </p>
      </div>
    </DemoFrame>
  );
}
