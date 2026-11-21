/** 목차의 항목 하나 */
export interface TocItem {
  /** 제목의 id. 링크는 #id를 가리킵니다 */
  id: string;
  text: string;
  /** 2는 h2, 3은 h3입니다 */
  depth: 2 | 3;
}

/** 지금 읽는 곳을 고를 때 쓰는 제목의 위치 */
export interface HeadingTop {
  id: string;
  /** 화면 맨 위에서 제목까지의 거리(px). 화면 위로 지나가면 음수입니다 */
  top: number;
}
