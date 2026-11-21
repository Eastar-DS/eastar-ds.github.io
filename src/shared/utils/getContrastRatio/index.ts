interface GetContrastRatioParams {
  /** `#RRGGBB` 또는 `#RRGGBBAA` (투명도는 보지 않음) */
  foreground: string;
  background: string;
}

const toLinear = (channel: number) => {
  const value = channel / 255;

  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const toLuminance = (hex: string) => {
  const match = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})(?:[0-9a-f]{2})?$/i);

  if (!match) {
    throw new Error(`#RRGGBB 꼴의 색이 아닙니다: ${hex}`);
  }

  const [red, green, blue] = match.slice(1, 4).map((part) => toLinear(parseInt(part, 16)));

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

/** 두 색의 WCAG 대비 비율(1~21)을 셉니다. 글자는 4.5 이상, 큰 글자 · 조작 장치 경계는 3 이상이 기준입니다 */
const getContrastRatio = ({ foreground, background }: GetContrastRatioParams) => {
  const [lighter, darker] = [toLuminance(foreground), toLuminance(background)].sort(
    (a, b) => b - a,
  );

  return (lighter + 0.05) / (darker + 0.05);
};

export default getContrastRatio;
