import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { makeSourceAccess } from "./sourceAccess.ts";
import { assertWorkOutsideRepo } from "../blogWork/pathSafety.ts";
const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));
it("허용 뿌리 안의 일반 파일만 열고 단서, 금지, 비밀 파일과 링크 우회를 막는다", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "fact-access-")); dirs.push(dir);
  const root = path.join(dir, "public"); const clue = path.join(root, "clue"); mkdirSync(clue, { recursive: true });
  const good = path.join(root, "source.txt"); const note = path.join(clue, "note.md"); const outside = path.join(dir, "outside.txt");
  for (const file of [good, note, outside, path.join(root, ".env.local"), path.join(root, "private.log")]) writeFileSync(file, "test");
  symlinkSync(outside, path.join(root, "link.txt"));
  const access = makeSourceAccess({ roots: [root], readPolicy: [{ path: clue, read: "단서만" }], unopenedNames: ["private.log"] });
  expect(access.read(good)).toBe("test"); expect(access.resolve("source.txt")).toBe(good);
  for (const file of [note, outside, path.join(root, ".env.local"), path.join(root, "private.log"), path.join(root, "link.txt")]) expect(access.read(file)).toBeNull();
});
it("작업 폴더가 링크로 저장소 안을 가리키면 거절한다", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "fact-work-")); dirs.push(dir);
  const repo = path.join(dir, "repo"); mkdirSync(repo); symlinkSync(repo, path.join(dir, "work"));
  expect(() => assertWorkOutsideRepo(path.join(dir, "work", "new", "claims.json"), repo)).toThrow();
});

it("HTML 스트림의 NUL은 받되 일반 바이너리는 읽지 않는다", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "fact-html-")); dirs.push(dir);
  const html = path.join(dir, "page.html"); const binary = path.join(dir, "binary.txt");
  writeFileSync(html, "<!DOCTYPE html><html>966ms\0</html>"); writeFileSync(binary, "966ms\0binary");
  const access = makeSourceAccess({ roots: [dir], readPolicy: [], unopenedNames: [] });
  expect(access.read(html)).toContain("966ms"); expect(access.read(binary)).toBeNull();
});
