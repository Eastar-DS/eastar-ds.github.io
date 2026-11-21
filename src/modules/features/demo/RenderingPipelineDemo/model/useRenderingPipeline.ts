import { useEffect, useRef, useState } from "react";

import { PLAY_DURATION_MS } from "@/modules/features/demo/RenderingPipelineDemo/constants/pipeline";
import type { CssPropertyId } from "@/modules/features/demo/RenderingPipelineDemo/types/pipeline";

/**
 * 렌더링 단계 데모의 상태입니다. 고른 속성, 진행 정도, 속성을 바꾼 프레임 수, 재생 여부를 다룹니다.
 * 슬라이더를 움직이거나 재생 중 한 프레임이 지날 때마다 프레임 수가 하나 늘어납니다.
 */
const useRenderingPipeline = () => {
  const [propertyId, setPropertyId] = useState<CssPropertyId>("width");
  const [progress, setProgress] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const frameIdRef = useRef<number | null>(null);

  const cancelFrame = () => {
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
  };

  useEffect(() => cancelFrame, []);

  const stop = () => {
    cancelFrame();
    setIsPlaying(false);
  };

  const play = () => {
    const startProgress = progress >= 100 ? 0 : progress;
    const startTime =
      performance.now() - (startProgress / 100) * PLAY_DURATION_MS;

    const tick = (now: number) => {
      const nextProgress = Math.min(
        100,
        ((now - startTime) / PLAY_DURATION_MS) * 100,
      );

      setProgress(nextProgress);
      setFrameCount((count) => count + 1);

      if (nextProgress < 100) {
        frameIdRef.current = requestAnimationFrame(tick);
      } else {
        frameIdRef.current = null;
        setIsPlaying(false);
      }
    };

    setIsPlaying(true);
    frameIdRef.current = requestAnimationFrame(tick);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  };

  const reset = () => {
    stop();
    setProgress(0);
    setFrameCount(0);
  };

  const changeProgress = (value: number) => {
    stop();
    setProgress(value);
    setFrameCount((count) => count + 1);
  };

  const selectProperty = (nextPropertyId: CssPropertyId) => {
    stop();
    setPropertyId(nextPropertyId);
    setProgress(0);
    setFrameCount(0);
  };

  return {
    propertyId,
    progress,
    frameCount,
    isPlaying,
    togglePlay,
    reset,
    changeProgress,
    selectProperty,
  };
};

export default useRenderingPipeline;
