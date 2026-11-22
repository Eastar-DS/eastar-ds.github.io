import { describe, expect, it } from "vitest";

import toFeedHtml from ".";

const postUrl = "https://eastar-ds.github.io/posts/sample-post/";
const toFeed = (html: string) => toFeedHtml({ html, postUrl });

describe("toFeedHtml", () => {
  it("스크립트 · 스타일 · 단추 · 꾸밈 아이콘과 화면용 속성을 뺀다", () => {
    const html =
      '<div class="container" data-astro-cid-x><p class="title"><svg aria-hidden="true"><path d="M0"/></svg>핵심</p>' +
      '<button type="button">복사</button><script type="module" src="/a.js"></script><style>p{}</style></div>';

    expect(toFeed(html)).toBe("<div><p>핵심</p></div>");
  });

  it("제목 앵커처럼 아이콘만 있던 링크는 함께 빼고, 제목의 id는 남긴다", () => {
    const html = '<h2 id="표" class="container">표<a class="anchor" href="#표" aria-label="「표」"><svg aria-hidden="true"></svg></a></h2>';

    expect(toFeed(html)).toBe('<h2 id="표">표</h2>');
  });

  it("안쪽 링크와 각주 링크를 글 주소 기준의 절대 주소로 바꾸고, 바깥 링크는 그대로 둔다", () => {
    const html =
      '<p><a href="/posts/other-post/">다른 글</a> <a href="#user-content-fn-1" data-footnote-ref>1</a> ' +
      '<a href="https://developer.mozilla.org">MDN</a> <a href="mailto:hello@example.com">메일</a></p>';

    expect(toFeed(html)).toBe(
      '<p><a href="https://eastar-ds.github.io/posts/other-post/">다른 글</a> ' +
        '<a href="https://eastar-ds.github.io/posts/sample-post/#user-content-fn-1">1</a> ' +
        '<a href="https://developer.mozilla.org">MDN</a> <a href="mailto:hello@example.com">메일</a></p>',
    );
  });

  it("그림 주소(src, srcset)도 절대 주소로 바꾼다", () => {
    const html = '<img src="/_astro/a.webp" srcset="/_astro/a.webp 1x, /_astro/b.webp 2x" alt="그림" width="680" height="400" loading="lazy">';

    expect(toFeed(html)).toBe(
      '<img src="https://eastar-ds.github.io/_astro/a.webp" srcset="https://eastar-ds.github.io/_astro/a.webp 1x, https://eastar-ds.github.io/_astro/b.webp 2x" alt="그림" width="680" height="400">',
    );
  });

  it("React 데모 섬은 안내 문단과 글 주소로 바꾸고, 데모 설명은 그림 설명으로 남긴다", () => {
    const html =
      '<astro-island uid="1" component-url="/demo.js" ssr><figure class="_container"><div><button>재생</button></div>' +
      '<figcaption class="_caption">width를 바꾸면 네 단계를 &quot;모두&quot; 다시 합니다.</figcaption></figure></astro-island>';

    expect(toFeed(html)).toBe(
      "<figure><p>이 자리의 데모는 글에서 직접 움직여 볼 수 있습니다: " +
        '<a href="https://eastar-ds.github.io/posts/sample-post/">eastar-ds.github.io/posts/sample-post</a></p>' +
        "<figcaption>width를 바꾸면 네 단계를 &quot;모두&quot; 다시 합니다.</figcaption></figure>",
    );
  });

  it("그림 · 표 · 코드가 없는 figure(도식)는 그림 설명만 남기고 그림 자리를 안내 문단으로 바꾼다", () => {
    const html =
      '<figure class="container"><div class="media"><div class="box"><p>main 스크롤 영역</p><div><p>폴더</p></div></div></div>' +
      '<figcaption class="caption">그림 1. DOM 구조입니다.</figcaption></figure>';

    expect(toFeed(html)).toBe(
      "<figure><p>이 자리의 도식은 글에서 볼 수 있습니다: " +
        '<a href="https://eastar-ds.github.io/posts/sample-post/">eastar-ds.github.io/posts/sample-post</a></p>' +
        "<figcaption>그림 1. DOM 구조입니다.</figcaption></figure>",
    );
  });

  it("표를 감싼 figure는 표와 설명을 그대로 둔다", () => {
    const html =
      '<figure class="container"><figcaption class="caption">표 1. 견준 방법</figcaption><div class="media">' +
      '<div class="root" role="region" aria-label="표" tabindex="0"><table class="table"><tr><th scope="col">방법</th></tr></table></div></div></figure>';

    expect(toFeed(html)).toBe(
      '<figure><figcaption>표 1. 견준 방법</figcaption><div><div><table><tr><th scope="col">방법</th></tr></table></div></div></figure>',
    );
  });

  it("코드 칸은 Shiki 색을 빼고 글자만 남긴다", () => {
    const html =
      '<pre class="astro-code" style="background-color:light-dark(#fff, #000)" tabindex="0"><code>' +
      '<span class="line"><span style="color:red">const</span><span> a = &quot;안녕&quot;;</span></span>\n' +
      '<span class="line"><span>a &lt; b</span></span></code></pre>';

    expect(toFeed(html)).toBe('<pre><code>const a = &quot;안녕&quot;;\na &lt; b</code></pre>');
  });

  it("단추와 아이콘을 빼고 비어 버린 span · div는 버리고, 빈 표 칸은 남긴다", () => {
    const html =
      '<figure><figcaption><span class="label">hello.ts</span><span class="container"><button>복사</button><span role="status"></span></span></figcaption>' +
      '<pre><code>a</code></pre></figure><table><tr><td></td><td>1</td></tr></table>';

    expect(toFeed(html)).toBe(
      "<figure><figcaption><span>hello.ts</span></figcaption><pre><code>a</code></pre></figure><table><tr><td></td><td>1</td></tr></table>",
    );
  });

  it("aria-label은 링크에만 남긴다", () => {
    const html = '<p><a href="#fnref-1" aria-label="1번 각주를 단 곳으로 돌아가기">↩</a></p><div aria-label="표"><table></table></div>';

    expect(toFeed(html)).toBe(
      '<p><a href="https://eastar-ds.github.io/posts/sample-post/#fnref-1" aria-label="1번 각주를 단 곳으로 돌아가기">↩</a></p><div><table></table></div>',
    );
  });
});
