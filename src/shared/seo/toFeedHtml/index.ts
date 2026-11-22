import {
  DOCUMENT_NODE,
  ELEMENT_NODE,
  TEXT_NODE,
  h,
  parse,
  renderSync,
  type CommentNode,
  type DoctypeNode,
  type DocumentNode,
  type ElementNode,
  type TextNode,
} from "ultrahtml";

import toDisplayUrl from "@/shared/utils/toDisplayUrl";

type HtmlNode = DocumentNode | ElementNode | TextNode | CommentNode | DoctypeNode;

interface ToFeedHtmlParams {
  /** 글 페이지의 본문 부품이 그린 HTML */
  html: string;
  /** 글의 절대 주소. 안쪽 링크와 데모 안내 링크가 이 주소를 씁니다 */
  postUrl: string;
}

/** 안의 내용까지 통째로 버리는 요소. RSS 리더에서 움직이지 않거나(단추, 스크립트) 화면 모양에만 쓰는 것(스타일) */
const DROPPED_ELEMENTS = new Set(["script", "style", "link", "meta", "noscript", "template", "button", "form", "input"]);

/** 껍데기만 벗기고 안의 내용은 살리는 요소. Astro가 섬 안의 슬롯에 붙이는 요소입니다 */
const UNWRAPPED_ELEMENTS = new Set(["astro-slot", "astro-static-slot"]);

/** 그림 · 표 · 코드처럼 RSS에서도 그대로 보이는 내용. `<figure>`에 이것이 없으면 도식으로 보고 안내 글로 바꿉니다 */
const READABLE_MEDIA = new Set(["img", "picture", "video", "audio", "table", "pre"]);

/** 남기는 속성. 클래스 · 인라인 스타일 · data-* · tabindex처럼 화면에만 쓰는 속성은 버립니다 */
const KEPT_ATTRIBUTES = new Set([
  "href",
  "src",
  "srcset",
  "alt",
  "title",
  "id",
  "width",
  "height",
  "colspan",
  "rowspan",
  "scope",
  "start",
  "datetime",
  "lang",
  "cite",
]);

/** 링크에만 남기는 속성. 각주 링크의 「1번 각주로 돌아가기」 같은 이름을 살립니다. 다른 요소의 이름(aria-label)은 role을 버리면 뜻이 없어집니다 */
const LINK_ATTRIBUTES = new Set(["aria-label", "aria-describedby"]);

/** 안을 다듬고 나서 비면 버리는 요소. 단추와 아이콘을 뺀 뒤 남는 빈 껍데기입니다 */
const REMOVED_IF_EMPTY = new Set(["span", "div"]);

const URL_ATTRIBUTES = new Set(["href", "src", "cite"]);

const PLACEHOLDER_TEXTS = {
  demo: "이 자리의 데모는 글에서 직접 움직여 볼 수 있습니다: ",
  diagram: "이 자리의 도식은 글에서 볼 수 있습니다: ",
} as const;

type PlaceholderKind = keyof typeof PLACEHOLDER_TEXTS;

const HTML_ENTITIES: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" };

const decodeAttribute = (value: string) =>
  value.replace(/&(amp|quot|#39|lt|gt);/g, (entity) => HTML_ENTITIES[entity] ?? entity);

const encodeAttribute = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const isElement = (node: HtmlNode): node is ElementNode => node.type === ELEMENT_NODE;

/** 파싱한 글자를 그대로 잇는 글자 노드. 파싱한 글자는 이미 HTML로 이스케이프되어 있어서 `h()`에 넘기면 두 번 이스케이프됩니다 */
const createRawText = (value: string) => ({ type: TEXT_NODE, value }) as TextNode;

/** 주소 앞에 scheme(`https:`, `mailto:`)이 없으면 글 주소를 기준으로 절대 주소로 바꿉니다. RSS 리더는 글 페이지 밖에서 본문을 보여 주기 때문입니다 */
const toAbsoluteUrl = ({ value, postUrl }: { value: string; postUrl: string }) => {
  const url = decodeAttribute(value).trim();

  return encodeAttribute(/^[a-z][a-z\d+.-]*:/i.test(url) ? url : new URL(url, postUrl).href);
};

const toAbsoluteSrcset = ({ value, postUrl }: { value: string; postUrl: string }) =>
  value
    .split(",")
    .map((candidate) => {
      const [url = "", ...descriptors] = candidate.trim().split(/\s+/);

      return [toAbsoluteUrl({ value: url, postUrl }), ...descriptors].join(" ");
    })
    .join(", ");

const cleanAttributes = ({ element, postUrl }: { element: ElementNode; postUrl: string }) =>
  Object.fromEntries(
    Object.entries(element.attributes)
      .filter(([name]) => KEPT_ATTRIBUTES.has(name) || (element.name === "a" && LINK_ATTRIBUTES.has(name)))
      .map(([name, value]) => {
        if (URL_ATTRIBUTES.has(name)) return [name, toAbsoluteUrl({ value, postUrl })];
        if (name === "srcset") return [name, toAbsoluteSrcset({ value, postUrl })];

        return [name, value];
      }),
  );

const someDescendant = ({ node, test }: { node: ElementNode; test: (element: ElementNode) => boolean }): boolean =>
  node.children.some((child) => isElement(child) && (test(child) || someDescendant({ node: child, test })));

const findDescendant = ({ node, name }: { node: ElementNode; name: string }): ElementNode | undefined => {
  for (const child of node.children) {
    if (!isElement(child)) continue;
    if (child.name === name) return child;

    const found = findDescendant({ node: child, name });

    if (found) return found;
  }

  return undefined;
};

/** 요소 안의 글자만 모읍니다. 파싱한 글자는 이미 HTML로 이스케이프된 상태라 그대로 잇습니다 */
const collectText = (node: HtmlNode): string => {
  if (node.type === TEXT_NODE) return node.value;
  if (isElement(node) || node.type === DOCUMENT_NODE) return node.children.map(collectText).join("");

  return "";
};

/** 데모 · 도식 자리에 넣는 안내 문단. 글 주소를 링크로 겁니다 */
const createPlaceholder = ({ kind, postUrl }: { kind: PlaceholderKind; postUrl: string }) =>
  h("p", null, PLACEHOLDER_TEXTS[kind], h("a", { href: encodeAttribute(postUrl) }, toDisplayUrl(postUrl)));

/** React 데모 섬을 안내 문단으로 바꿉니다. 데모 틀의 설명(figcaption)이 있으면 그림 설명으로 살립니다 */
const replaceIsland = ({ node, postUrl }: { node: ElementNode; postUrl: string }) => {
  const caption = findDescendant({ node, name: "figcaption" });
  const placeholder = createPlaceholder({ kind: "demo", postUrl });

  if (!caption) return [placeholder];

  return [h("figure", null, placeholder, h("figcaption", null, createRawText(collectText(caption).trim())))];
};

const cleanChildren = ({ nodes, postUrl }: { nodes: HtmlNode[]; postUrl: string }): HtmlNode[] =>
  nodes.flatMap((node) => cleanNode({ node, postUrl }));

/** 그림 · 표 · 코드가 없는 `<figure>`(도식)는 그림 설명만 남기고 그림 자리를 안내 문단으로 바꿉니다 */
const cleanDiagramFigure = ({ node, postUrl }: { node: ElementNode; postUrl: string }) => {
  const kind: PlaceholderKind = someDescendant({ node, test: (element) => element.name === "astro-island" }) ? "demo" : "diagram";
  let hasPlaceholder = false;
  const children = node.children.flatMap((child): HtmlNode[] => {
    if (!isElement(child)) return child.type === TEXT_NODE ? [child] : [];
    if (child.name === "figcaption") return cleanNode({ node: child, postUrl });
    if (hasPlaceholder) return [];

    hasPlaceholder = true;

    return [createPlaceholder({ kind, postUrl })];
  });

  return [h("figure", null, ...children)];
};

const cleanNode = ({ node, postUrl }: { node: HtmlNode; postUrl: string }): HtmlNode[] => {
  if (node.type === TEXT_NODE) return [node];
  if (!isElement(node)) return [];

  const { name } = node;

  if (DROPPED_ELEMENTS.has(name)) return [];
  if (UNWRAPPED_ELEMENTS.has(name)) return cleanChildren({ nodes: node.children, postUrl });
  if (name === "astro-island") return replaceIsland({ node, postUrl });
  // 아이콘(꾸밈 SVG)은 버리고, 뜻이 있는 SVG는 도식으로 봅니다
  if (name === "svg") return node.attributes["aria-hidden"] === "true" ? [] : [createPlaceholder({ kind: "diagram", postUrl })];
  // 코드 칸은 Shiki가 칠한 색(인라인 스타일)을 빼고 글자만 남깁니다
  if (name === "pre") return [h("pre", null, h("code", null, createRawText(collectText(node))))];
  if (name === "figure" && !someDescendant({ node, test: (element) => READABLE_MEDIA.has(element.name) })) {
    return cleanDiagramFigure({ node, postUrl });
  }

  const children = cleanChildren({ nodes: node.children, postUrl });

  const isEmpty = children.map(collectText).join("").trim() === "" && !children.some(isElement);

  // 아이콘만 있던 링크(제목 앵커)는 아이콘을 버리면 빈 링크가 되므로 함께 버립니다
  if (name === "a" && children.map(collectText).join("").trim() === "") return [];
  if (REMOVED_IF_EMPTY.has(name) && isEmpty) return [];

  return [h(name, cleanAttributes({ element: node, postUrl }), ...children)];
};

/**
 * 글 페이지의 본문 HTML을 RSS 본문(content:encoded)으로 다듬습니다.
 * - RSS 리더는 사이트의 CSS와 JavaScript를 쓰지 않으므로 스크립트 · 스타일 · 단추 · 아이콘과 화면용 속성(class, style, data-*)을 뺍니다.
 * - React 데모와 도식(그림 · 표 · 코드가 없는 `<figure>`)은 RSS에서 그려지지 않아서, 그 자리에 「글에서 직접 움직여 볼 수 있습니다」 안내와 글 주소를 둡니다. 설명(figcaption)은 남깁니다.
 * - 안쪽 링크(`/posts/…`, `#각주`)와 그림 주소는 글 주소를 기준으로 절대 주소로 바꿉니다.
 */
const toFeedHtml = ({ html, postUrl }: ToFeedHtmlParams) => {
  const document: DocumentNode = parse(html);
  const nodes = cleanChildren({ nodes: document.children, postUrl });

  return nodes
    .map((node) => renderSync(node))
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export default toFeedHtml;
