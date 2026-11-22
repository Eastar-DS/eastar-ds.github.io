/** 이미 쓴 글의 전체와 h2별 분량. 글은 고치지 않습니다. node scripts/measurePosts.ts [--json] */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { countPostCharacters } from "./postRules/countCharacters.ts";
import { outsideFences } from "./postWork/markdown.ts";
import { REPO_ROOT, runCli } from "./postWork/io.ts";
export const measureBody = (body: string) => {
  const visible = outsideFences(body).split("\n");
  const lines = body.split("\n");
  const headings = visible.flatMap((line, index) => line.startsWith("## ") ? [{ title: line.slice(3), index }] : []);
  return { total: countPostCharacters(body), sections: headings.map((heading, at) => ({ heading: heading.title, characters: countPostCharacters(lines.slice(heading.index + 1, headings[at + 1]?.index).join("\n")) })) };
};
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) runCli(() => {
  const { values } = parseArgs({ options: { json: { type: "boolean" } } });
  const root = path.join(REPO_ROOT, "src/content/posts");
  const posts = readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => {
    const raw = readFileSync(path.join(root, entry.name, "index.mdx"), "utf8");
    return { slug: entry.name, ...measureBody(raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")) };
  });
  console.log(values.json ? JSON.stringify(posts, null, 2) : ["| 글 | 절 | 글자 수 |", "|---|---|---|", ...posts.flatMap((post) => [`| ${post.slug} | 전체 | ${post.total} |`, ...post.sections.map((section) => `| ${post.slug} | ${section.heading.replace(/\|/g, "\\|")} | ${section.characters} |`)])].join("\n"));
});
