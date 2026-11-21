/**
 * 공유 미리보기 그림(og:image)의 크기와 형식입니다. docs/content-guide.md 6.2를 따릅니다.
 * Facebook, LinkedIn, X, 카카오톡이 큰 카드로 보여 주는 1.91:1 비율이고, 파일은 300KB 이하로 둡니다.
 */
export const OG_IMAGE = {
  width: 1200,
  height: 630,
  type: "image/png",
  maxBytes: 300 * 1024,
} as const;
