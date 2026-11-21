import type { StepState } from "@/modules/features/demo/RenderingPipelineDemo/types/pipeline";

import styles from "./PipelineStep.module.css";

interface PipelineStepProps {
  step: StepState;
  /** 마지막 단계에는 다음 단계로 가는 화살표를 그리지 않습니다 */
  isLast: boolean;
}

/** 렌더링 단계 하나를 그립니다. 다시 하는 단계는 강조색으로, 건너뛰는 단계는 옅게 보입니다 */
export default function PipelineStep({ step, isLast }: PipelineStepProps) {
  const statusText = step.isRerun ? "다시 함" : "건너뜀";

  return (
    <li className={styles.container}>
      <div
        className={[styles.card, step.isRerun ? styles.isRerun : ""].join(" ")}
      >
        <span className={styles.label}>{step.label}</span>
        <span className={styles.status}>
          {statusText}
          {step.runCount > 0 && ` · ${step.runCount}번`}
        </span>
      </div>
      {!isLast && (
        <svg
          className={styles.arrow}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      )}
    </li>
  );
}
