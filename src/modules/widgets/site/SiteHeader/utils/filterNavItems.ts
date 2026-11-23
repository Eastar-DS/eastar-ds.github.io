import { PATHS } from "@/shared/routes/paths";

interface NavItem {
  label: string;
  href: string;
}

interface FilterNavItemsParams<T extends NavItem> {
  items: readonly T[];
  /** 시리즈가 하나라도 있는지. 없으면 시리즈 목록 페이지를 만들지 않습니다 */
  hasSeries: boolean;
}

const SERIES_HREF = PATHS.series;

/**
 * 머리말에 보일 메뉴를 고릅니다. 시리즈가 없으면 목록 페이지(`/series/`)도 없어 메뉴에서 뺍니다.
 */
const filterNavItems = <T extends NavItem>({
  items,
  hasSeries,
}: FilterNavItemsParams<T>) =>
  items.filter((item) => hasSeries || item.href !== SERIES_HREF);

export default filterNavItems;
