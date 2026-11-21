import { PATHS, SERIES_SECTION_ID } from "@/shared/routes/paths";

interface NavItem {
  label: string;
  href: string;
}

interface FilterNavItemsParams<T extends NavItem> {
  items: readonly T[];
  /** 시리즈가 하나라도 있는지. 없으면 글 목록에 시리즈 구획이 그려지지 않습니다 */
  hasSeries: boolean;
}

const SERIES_HREF = `${PATHS.home}#${SERIES_SECTION_ID}`;

/**
 * 머리말에 보일 메뉴를 고릅니다. 시리즈가 없으면 「시리즈」 메뉴가 갈 구획(`/#series`)이 없어서 메뉴에서 뺍니다.
 */
const filterNavItems = <T extends NavItem>({
  items,
  hasSeries,
}: FilterNavItemsParams<T>) =>
  items.filter((item) => hasSeries || item.href !== SERIES_HREF);

export default filterNavItems;
