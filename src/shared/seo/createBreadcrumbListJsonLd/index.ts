import { SITE } from "@/shared/constants/site";
import type { JsonLd } from "@/shared/types/seo";

interface BreadcrumbItem {
  name: string;
  /** 사이트 안의 주소. 예: `/` */
  path: string;
}

/** 페이지의 위치를 알리는 BreadcrumbList 구조화 데이터를 만듭니다. 앞에서부터 상위 페이지 순서입니다 */
const createBreadcrumbListJsonLd = (items: BreadcrumbItem[]) => {
  const jsonLd: JsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, SITE.url).href,
    })),
  };

  return jsonLd;
};

export default createBreadcrumbListJsonLd;
