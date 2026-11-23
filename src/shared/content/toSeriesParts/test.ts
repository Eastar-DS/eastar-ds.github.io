import { expect, it } from "vitest";
import type { Post } from "@/shared/types/post";
import toSeriesParts from ".";

const post = (order: number, draft = false): Post => ({
  slug: `part-${order}`, title: `${order}편`, description: "소개", category: "React",
  publishedAt: new Date("2026-11-13"), updatedAt: new Date("2026-11-13"), readingMinutes: 1,
  series: { id: "virtual-list", name: "목록 가상화", order }, draft,
});

it("배포에서는 순서대로 보이되 초안 편의 주소를 주지 않는다", () => {
  const posts = [post(3, true), post(1), { ...post(2), series: { id: "other", name: "다른 시리즈", order: 1 } }];
  expect(toSeriesParts({ posts, id: "virtual-list", isDev: false })).toEqual([
    { title: "1편", order: 1, slug: "part-1" },
    { title: "3편", order: 3, slug: undefined },
  ]);
  expect(posts[0]?.slug).toBe("part-3");
});

it("개발 서버에서는 초안 편도 읽을 수 있다", () => {
  expect(toSeriesParts({ posts: [post(2, true)], id: "virtual-list", isDev: true })[0]?.slug).toBe("part-2");
});
