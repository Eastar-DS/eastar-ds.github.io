/** 설계 F1 4.6의 사본을 저장소 밖 _evals에 만듭니다. 원문이 바뀌면 조용히 다른 곳을 고치지 않고 실패합니다. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClaimsFile, sha256Text } from "./factCheck/extractClaims.ts";
import { assertOutsideRepo, REPO_ROOT, runCli, workContext } from "./postWork/io.ts";
const replaceRequired = (source: string, before: string, after: string) => {
  if (!source.includes(before)) throw new Error("평가 재료의 바꿀 문장이 원본에 없습니다");
  return source.replace(before, after);
};
export const makeFactCheckFixtures = (base: string) => {
  assertOutsideRepo(base);
  const first = "virtualized-document-list";
  const specs = [
    { id: 0, name: "f0-untouched", slug: first, edit: (s: string) => s },
    { id: 1, name: "f1-number-swap", slug: first, edit: (s: string) => replaceRequired(s, "가운데값이 966ms에서 46ms로 95%", "가운데값이 996ms에서 46ms로 95%") },
    { id: 2, name: "f2-unsourced-number", slug: first, edit: (s: string) => replaceRequired(s, "\n## 정리\n", "\n스크롤 중 메모리 사용량은 38MB에서 12MB로 줄었습니다.\n\n## 정리\n") },
    { id: 3, name: "f3-code-name", slug: "virtual-list-row-range", edit: (s: string) => { if (!s.includes("getRowOffsets")) throw new Error("함수 이름이 바뀌었습니다"); return s.replaceAll("getRowOffsets", "getRowOffset"); } },
    { id: 4, name: "f4-doc-behavior", slug: "virtual-list-accessibility", edit: (s: string) => replaceRequired(s, "React 17부터 `onBlur`는", "React 18부터 `onBlur`는") },
    { id: 5, name: "f5-dead-link", slug: "virtual-list-back-navigation", edit: (s: string) => replaceRequired(s, "https://react.dev/reference/react-dom/flushSync", "https://react.dev/reference/react-dom/flushSync-nope") },
  ];
  const fixtures = specs.map(({ id, name, slug, edit }) => {
    const original = path.join("src/content/posts", slug, "index.mdx");
    const raw = readFileSync(path.join(REPO_ROOT, original), "utf8"); const source = edit(raw);
    const dir = assertOutsideRepo(path.join(base, name)); mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "index.mdx"); writeFileSync(file, source);
    writeFileSync(path.join(dir, "claims.json"), JSON.stringify(createClaimsFile({ source, slug: name, file, generatedAt: new Date().toISOString() }), null, 2) + "\n");
    const metadata = { id, name, original, originalSha256: sha256Text(raw), fixtureSha256: sha256Text(source) };
    writeFileSync(path.join(dir, "fixture.json"), JSON.stringify(metadata, null, 2) + "\n");
    return { ...metadata, file };
  });
  writeFileSync(path.join(base, "fixtures.json"), JSON.stringify(fixtures, null, 2) + "\n");
  return { base, fixtures };
};
if (import.meta.url === pathToFileURL(process.argv[1]).href) runCli(() => console.log(JSON.stringify(makeFactCheckFixtures(path.join(workContext("_evals", true).dir, `f1-eval-${Date.now()}`)), null, 2)));
