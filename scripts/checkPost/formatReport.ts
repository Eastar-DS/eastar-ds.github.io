// 점검 결과를 사람이 읽는 표, JSON, GitHub Actions 알림 줄로 바꾸는 순수 함수입니다.
import type { PostMaterial } from "./collectMaterial.ts";
import type { CheckResult, CheckStatus } from "./types.ts";

export interface PostReport {
  slug: string;
  /** 저장소 안 경로(저장소 밖 사본이면 절대 경로) */
  file: string;
  title?: string;
  draft: boolean;
  results: CheckResult[];
  material?: PostMaterial;
}

export const STATUS_LABELS: Record<CheckStatus, string> = {
  fail: "실패",
  warn: "경고",
  skip: "건너뜀",
  pass: "통과",
};

const STATUS_ORDER: CheckStatus[] = ["fail", "warn", "skip", "pass"];

/** 터미널에서 차지하는 칸 수. 한글과 전각 문자는 두 칸입니다 */
export const displayWidth = (text: string) =>
  [...text].reduce((width, char) => {
    const code = char.codePointAt(0) ?? 0;
    const isWide =
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe4f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6);

    return width + (isWide ? 2 : 1);
  }, 0);

const pad = ({ text, width }: { text: string; width: number }) => `${text}${" ".repeat(Math.max(0, width - displayWidth(text)))}`;

export const countStatuses = (results: CheckResult[]) =>
  Object.fromEntries(STATUS_ORDER.map((status) => [status, results.filter((result) => result.status === status).length])) as Record<CheckStatus, number>;

const MAX_FINDINGS = 8;

/** 「건너뜀」이 한글 세 자라 결과 칸을 여덟 칸으로 둡니다 */
const STATUS_WIDTH = 8;

interface FormatTextParams {
  reports: PostReport[];
  /** 통과한 항목도 한 줄씩 보입니다 */
  isVerbose?: boolean;
}

/** 사람이 읽는 표. 실패, 경고, 건너뜀은 한 줄씩 찾은 곳과 고칠 방법을 함께 보이고, 통과는 이름만 모읍니다 */
export const formatText = ({ reports, isVerbose = false }: FormatTextParams) => {
  const blocks = reports.map((report) => {
    const counts = countStatuses(report.results);
    const skipped = report.results.filter((result) => result.status === "skip");
    const shown = report.results
      .filter((result) => (isVerbose || result.status !== "pass") && result.status !== "skip")
      .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
    const sectionWidth = Math.max(4, ...shown.map((result) => displayWidth(result.section ?? "")));
    const labelWidth = Math.max(4, ...shown.map((result) => displayWidth(result.label)));
    const indent = " ".repeat(2 + STATUS_WIDTH + sectionWidth + 2 + labelWidth + 2);
    const rows = shown.flatMap((result) => {
      const head = `  ${pad({ text: STATUS_LABELS[result.status], width: STATUS_WIDTH })}${pad({ text: result.section ?? "", width: sectionWidth + 2 })}${pad({ text: result.label, width: labelWidth + 2 })}${result.summary}`;

      if (result.status === "pass") return [head];

      const findings = result.findings.slice(0, MAX_FINDINGS).map((finding) => `${indent}${finding.line ? `${finding.line}줄  ` : ""}${finding.message}`);
      const more = result.findings.length > MAX_FINDINGS ? [`${indent}… 외 ${result.findings.length - MAX_FINDINGS}곳 (--json으로 모두 봄)`] : [];
      const fix = result.fix ? [`${indent}고칠 방법: ${result.fix}`] : [];

      return [head, ...findings, ...more, ...fix, `${indent}근거: ${result.basis}`];
    });
    const passed = report.results.filter((result) => result.status === "pass");
    const passLine = !isVerbose && passed.length > 0 ? [``, `  통과 ${passed.length}개: ${passed.map((result) => result.label).join(", ")}`] : [];
    const skipLine =
      skipped.length > 0 ? [``, `  건너뜀 ${skipped.length}개(${skipped[0]?.summary ?? ""}): ${skipped.map((result) => result.label).join(", ")}`] : [];
    const header = [
      `■ ${report.slug}${report.draft ? " (초안)" : ""}${report.title ? ` 「${report.title}」` : ""}`,
      `  ${report.file}`,
      `  실패 ${counts.fail} · 경고 ${counts.warn} · 건너뜀 ${counts.skip} · 통과 ${counts.pass}`,
    ];

    return [...header, ...(rows.length > 0 ? ["", `  ${pad({ text: "결과", width: STATUS_WIDTH })}${pad({ text: "절", width: sectionWidth + 2 })}${pad({ text: "항목", width: labelWidth + 2 })}내용`, ...rows] : []), ...skipLine, ...passLine].join("\n");
  });

  return blocks.join("\n\n");
};

/** `--json` 출력. 통과한 항목까지 모두 내보냅니다 */
export const formatJson = (reports: PostReport[]) => {
  const all = reports.flatMap((report) => report.results);

  return JSON.stringify(
    {
      version: 1,
      summary: { posts: reports.length, ...countStatuses(all) },
      posts: reports.map((report) => ({ ...report, summary: countStatuses(report.results) })),
    },
    null,
    2,
  );
};

const escapeAnnotation = (text: string) => text.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

/** GitHub Actions의 오류 알림 줄. 실패한 검사만 커밋 화면의 글 줄에 붙입니다 */
export const formatGithubAnnotations = (reports: PostReport[]) =>
  reports.flatMap((report) =>
    report.results
      .filter((result) => result.status === "fail")
      .flatMap((result) =>
        (result.findings.length > 0 ? result.findings : [{ message: result.summary }]).map(
          (finding) =>
            `::error file=${report.file}${"line" in finding && finding.line ? `,line=${finding.line}` : ""},title=${escapeAnnotation(result.label)}::${escapeAnnotation(finding.message)}`,
        ),
      ),
  );
