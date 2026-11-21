import {
  DOCUMENT_TITLES,
  ROW_COUNT,
  ROW_HEIGHT_PX,
} from "@/modules/features/demo/VirtualListDemo/constants/virtualList";

import styles from "./DocumentRows.module.css";

interface DocumentRowsProps {
  /** 그릴 첫 행 */
  start: number;
  /** 그릴 행이 끝난 다음 행. 그리지 않습니다 */
  end: number;
}

/**
 * 스크롤 칸 안의 문서 목록입니다. `start`부터 `end` 앞까지의 행만 `li`로 그립니다.
 * 목록은 행을 모두 그린 높이를 갖고, 그리지 않은 위쪽 행의 높이만큼 위쪽 여백을 둬서 그린 행이 제자리에 놓입니다.
 * 행마다 목록 안 순서와 전체 행 수를 알려, 일부만 그려도 스크린 리더가 「2,000개 중 42번째」처럼 읽게 합니다.
 * 부모가 구간이 바뀔 때만 새로 만들어서(useMemo), 가상화를 끄고 2,000행을 모두 그린 채 스크롤해도 목록은 다시 그리지 않습니다.
 */
export default function DocumentRows({ start, end }: DocumentRowsProps) {
  const indexes = Array.from({ length: end - start }, (_, k) => start + k);

  return (
    <ul
      className={styles.list}
      aria-label="문서 목록"
      style={{
        height: ROW_COUNT * ROW_HEIGHT_PX,
        paddingTop: start * ROW_HEIGHT_PX,
      }}
    >
      {indexes.map((index) => (
        <li
          key={index}
          className={styles.row}
          aria-posinset={index + 1}
          aria-setsize={ROW_COUNT}
        >
          <span className={styles.number}>
            {(index + 1).toLocaleString("ko-KR")}
          </span>
          <span className={styles.title}>
            {DOCUMENT_TITLES[index % DOCUMENT_TITLES.length]}
          </span>
        </li>
      ))}
    </ul>
  );
}
