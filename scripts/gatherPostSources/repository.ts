import { execFileSync } from "node:child_process";
import { existsSync, lstatSync } from "node:fs";
import path from "node:path";
import { extractLinks, isUnopenable } from "./material.ts";
import type { SourceItem, SourceLink, SourceScan } from "./types.ts";
interface RepoOptions {
  name: string; repo: string; topics: string[]; prs: string[]; issues: string[]; branch?: string;
  metadata: (file: string, root: string, inTopicDir: boolean) => SourceItem | null;
  clean: (text: string) => string;
}
/** GitHub 응답은 메모리에서만 읽고, 본문과 작성자 정보는 결과 JSON에 저장하지 않습니다. */
export const collectRepo = ({ name, repo, topics, prs, issues, branch, metadata, clean }: RepoOptions) => {
  const items: SourceItem[] = [];
  const links: SourceLink[] = [];
  const warnings: string[] = [];
  const repos: SourceScan["repos"] = [];
  const command = (tool: string, args: string[]) => execFileSync(tool, args, { encoding: "utf8", timeout: 30000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] }).trim();
  const git = (args: string[]) => command("git", ["-C", repo, ...args]);
  const gh = (args: string[]) => JSON.parse(command("gh", args)) as Record<string, unknown>;
  let owner = "";
  try {
    const remote = git(["config", "--get", "remote.origin.url"]);
    const match = remote.match(/github\.com[/:]([\w.-]+\/[\w.-]+?)(?:\.git)?$/);
    owner = match?.[1] ?? "";
  } catch { warnings.push("저장소 remote를 확인하지 못했습니다"); }
  let isPrivate: boolean | null = null;
  if (owner) {
    try { isPrivate = gh(["repo", "view", owner, "--json", "isPrivate"]).isPrivate === true; }
    catch { warnings.push("gh가 없거나 인증되지 않아 공개 여부를 확인하지 못했습니다"); }
  }
  const use = isPrivate === false ? "써도 됨" : "이스타 확인";
  const virtual = (location: string, kind: string, title: string): SourceItem => ({ id: "", kind, path: location, root: clean(name), title: clean(title), bytes: 0, modifiedAt: "", topicHits: 1, inTopicDir: false, read: "읽음", defaultUse: use, hiddenNameCount: 0, unopenable: false, removed: false });
  const entry: SourceScan["repos"][number] = { name: clean(name), isPrivate };
  repos.push(entry);
  const commitLines = new Set<string>();
  try {
    for (const topic of topics) git(["log", "--all", "-i", "--fixed-strings", `--grep=${topic}`, "--format=%H%x09%ad%x09%s", "--date=short"]).split("\n").filter(Boolean).forEach((line) => commitLines.add(line));
    if (branch && /^[\w./-]+$/.test(branch) && !branch.startsWith("-")) git(["log", "--format=%H%x09%ad%x09%s", "--date=short", "--end-of-options", branch, "--"]).split("\n").filter(Boolean).forEach((line) => commitLines.add(line));
  } catch { warnings.push("관련 커밋의 일부를 확인하지 못했습니다"); }
  const addFile = (relative: string, kind = "코드") => {
    const file = path.resolve(repo, relative);
    if (!file.startsWith(`${path.resolve(repo)}${path.sep}`) || !existsSync(file) || lstatSync(file).isSymbolicLink()) return;
    const item = metadata(file, repo, false);
    if (item) { item.kind = item.unopenable ? item.kind : kind; item.defaultUse = item.unopenable || item.read === "단서만" ? item.defaultUse : use; items.push(item); }
  };
  if (owner) for (const number of prs) {
    if (!/^\d+$/.test(number)) { warnings.push("PR 번호의 형식이 올바르지 않습니다"); continue; }
    try {
      // 구버전 gh에는 closingIssuesReferences JSON 칸이 없어 GraphQL로 따로 읽습니다.
      const pr = gh(["pr", "view", number, "--repo", owner, "--json", "number,title,body,url,mergedAt,headRefName,files,commits,reviews"]);
      const files = (pr.files ?? []) as { path: string }[];
      const commits = (pr.commits ?? []) as { oid: string; messageHeadline: string; committedDate?: string }[];
      let linkedIssues: { number: number }[] = [];
      try {
        const [repoOwner, repoName] = owner.split("/");
        const query = "query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){closingIssuesReferences(first:100){nodes{number} totalCount}}}}";
        const response = gh(["api", "graphql", "-f", `query=${query}`, "-f", `owner=${repoOwner}`, "-f", `name=${repoName}`, "-F", `number=${number}`]) as { data: { repository: { pullRequest: { closingIssuesReferences: { nodes: { number: number }[]; totalCount: number } } } } };
        linkedIssues = response.data.repository.pullRequest.closingIssuesReferences.nodes;
        if (response.data.repository.pullRequest.closingIssuesReferences.totalCount > linkedIssues.length) warnings.push("이어진 이슈가 100개를 넘어 일부만 확인했습니다");
      } catch { warnings.push("PR에 이어진 이슈를 확인하지 못했습니다"); }
      const url = String(pr.url);
      items.push(virtual(url, "PR", String(pr.title)));
      links.push(...extractLinks(String(pr.body ?? ""), url));
      for (const file of files) addFile(file.path);
      for (const commit of commits) commitLines.add(`${commit.oid}\t${commit.committedDate?.slice(0, 10) ?? ""}\t${commit.messageHeadline}`);
      let reviewCommentCount = 0;
      try { reviewCommentCount = Number(command("gh", ["api", `repos/${owner}/pulls/${number}/comments`, "--paginate", "--jq", "length"]).split("\n").reduce((sum, n) => sum + Number(n), 0)); }
      catch { warnings.push("PR 리뷰 댓글 수를 확인하지 못했습니다"); }
      const prSummary = { number: Number(number), fileCount: files.length, commitCount: commits.length, reviewCount: Array.isArray(pr.reviews) ? pr.reviews.length : 0, reviewCommentCount, issueCount: linkedIssues.length };
      if (!entry.pr) entry.pr = prSummary;
      else repos.push({ name: clean(name), isPrivate, pr: prSummary });
      for (const issue of linkedIssues) if (!issues.includes(String(issue.number))) issues.push(String(issue.number));
    } catch { warnings.push(`PR ${number}의 본문과 바뀐 파일을 확인하지 못했습니다`); }
  }
  if (owner) for (const number of new Set(issues)) {
    if (!/^\d+$/.test(number)) continue;
    try {
      const issue = gh(["issue", "view", number, "--repo", owner, "--json", "number,title,body,url"]);
      items.push(virtual(String(issue.url), "이슈", String(issue.title)));
      links.push(...extractLinks(String(issue.body ?? ""), String(issue.url)));
    } catch { warnings.push(`이슈 ${number}을 확인하지 못했습니다`); }
  }
  for (const line of commitLines) {
    const [hash, date, ...subject] = line.split("\t");
    if (!/^[a-f0-9]{40}$/.test(hash)) continue;
    const item = virtual(owner ? `https://github.com/${owner}/commit/${hash}` : `git:${name}:${hash}`, "커밋", subject.join("\t"));
    item.modifiedAt = date; items.push(item);
  }
  try {
    for (const relative of git(["ls-files"]).split("\n").filter((file) => /(?:^|\/)adr\//i.test(file))) {
      const file = path.join(repo, relative);
      if (!existsSync(file) || isUnopenable(file) || lstatSync(file).isSymbolicLink() || lstatSync(file).size > 2 * 1024 * 1024) continue;
      // metadata가 읽기 금지 경로도 먼저 거릅니다.
      const item = metadata(file, repo, false);
      if (item?.topicHits) { item.kind = "ADR과 결정 문서"; item.defaultUse = item.read === "단서만" ? "단서만" : use; items.push(item); }
    }
  } catch { warnings.push("ADR 파일을 확인하지 못했습니다"); }
  return { items, links, warnings, repos };
};
