import type { Measurement } from "@/modules/features/demo/VirtualizationResultChart/types/measurement";

/**
 * Knot PR #1142 본문의 「개선 전과 후」 그림에 실린 값입니다(2026년 11월 12일 PR).
 * 조건: 문서 1,939개 워크스페이스, CPU 4배 느림. 개선 전은 develop 11ac67db, 개선 후는 PR #1142입니다.
 * 시간은 가운데값이고, 컴포넌트 수는 React Profiler로 셌습니다.
 * https://github.com/woowacourse-teams/2026-Knot/pull/1142
 */
export const MEASUREMENTS: Measurement[] = [
  {
    label: "문서 목록 탭을 누른 뒤 목록이 보일 때까지",
    condition: "세션 녹화 없음",
    before: 966,
    after: 46,
    unit: "ms",
  },
  {
    label: "문서 목록 탭을 누른 뒤 목록이 보일 때까지",
    condition: "세션 녹화 켬",
    before: 1729,
    after: 67,
    unit: "ms",
  },
  {
    label: "탭에 들어간 뒤 화면 요소 수",
    before: 17696,
    after: 354,
    unit: "개",
  },
  {
    label: "탭에 들어갈 때 마운트한 컴포넌트 수",
    condition: "React Profiler",
    before: 37168,
    after: 558,
    unit: "개",
  },
];
