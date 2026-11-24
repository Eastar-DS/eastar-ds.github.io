interface ToFootnoteBackrefParams {
  referenceNumber: number;
  rerunIndex: number;
}

/**
 * 각주 끝 돌아가기 링크의 보이는 글(`content`)과 이름(`label`)을 만듭니다(docs/design-system.md 7.28).
 * `astro.config.ts`가 Sätteri의 각주 설정(`backContent` · `backLabel`)에 넘깁니다.
 * 같은 각주를 여러 곳에서 달면 두 번째부터 보이는 글 끝에 자리 번호를 따로 된 낱말로 붙입니다.
 * 이름은 보이는 글에서 화살표만 뺀 글로 시작해야 음성으로 고르는 사람이 부를 수 있습니다(WCAG 2.5.3).
 */
const toFootnoteBackref = ({ referenceNumber, rerunIndex }: ToFootnoteBackrefParams) => {
  if (rerunIndex > 1) {
    return {
      content: `↑ 읽던 곳으로 ${rerunIndex}`,
      label: `읽던 곳으로 ${rerunIndex}, ${referenceNumber}번 각주를 단 ${rerunIndex}번째 자리`,
    };
  }

  return {
    content: "↑ 읽던 곳으로",
    label: `읽던 곳으로, ${referenceNumber}번 각주를 단 문장`,
  };
};

export default toFootnoteBackref;
