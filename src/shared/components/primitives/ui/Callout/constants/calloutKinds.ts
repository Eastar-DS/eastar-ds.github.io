import type { IconName } from "@/shared/components/primitives/ui/Icon/types/icon";
import type { CalloutKind } from "@/shared/components/primitives/ui/Callout/types/callout";

/** 종류마다 보이는 제목과 아이콘. 색만으로 종류를 알리지 않으려고 둘을 함께 씁니다 */
export const CALLOUT_KINDS: Record<
  CalloutKind,
  { title: string; icon: IconName }
> = {
  key: { title: "핵심", icon: "lightbulb" },
  warn: { title: "주의", icon: "triangleAlert" },
  note: { title: "참고", icon: "info" },
};
