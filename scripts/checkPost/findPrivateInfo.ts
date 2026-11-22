// 글과 데모 코드에서 공개되면 안 되는 값을 찾는 순수 함수입니다(docs/content-guide.md 11장).
// 게시 전 점검과 개인 정보 훅(.claude/hooks/blockPrivateInfo.ts)이 함께 씁니다.
// 찾은 값은 결과에 그대로 쓰지 않고 앞 몇 글자만 남겨 가립니다. CI 기록(공개 저장소의 Actions 로그)에 값이 남지 않게 하려는 것입니다.

export type PrivateInfoKind = "local-path" | "email" | "token" | "private-ip" | "phone";

export interface PrivateInfoMatch {
  line: number;
  kind: PrivateInfoKind;
  /** 가린 값. 예: `ghp_…(40자)` */
  masked: string;
}

export const PRIVATE_INFO_LABELS: Record<PrivateInfoKind, string> = {
  "local-path": "로컬 경로",
  email: "이메일",
  token: "토큰 꼴",
  "private-ip": "사설 IP",
  phone: "전화번호",
};

/**
 * 토큰 꼴. 서비스가 공개한 접두어가 있는 것만 봅니다. 접두어가 없는 키(Cloudflare API 토큰 등)는 기계로 가를 수 없습니다.
 * - 노션 `ntn_`, 옛 노션 `secret_`, GitHub `ghp_` · `gho_` · `ghu_` · `ghs_` · `ghr_` · `github_pat_`
 * - OpenAI · Anthropic 꼴 `sk-`(`sk-ant-`, `sk-proj-` 포함), Stripe `sk_live_` · `rk_live_`, PostHog `phc_`(프로젝트 키) · `phx_`(개인 키)
 * - Slack `xox?-`, AWS `AKIA`, Google API `AIza`, 개인 키 파일 머리, JWT
 */
const TOKEN_PATTERNS = [
  /\bntn_[A-Za-z0-9]{20,}/g,
  /\bsecret_[A-Za-z0-9]{30,}/g,
  /\bgh[pousr]_[A-Za-z0-9]{30,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{40,}/g,
  /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}/g,
  /\b[sr]k_live_[A-Za-z0-9]{16,}/g,
  /\bph[cx]_[A-Za-z0-9]{20,}/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{35}/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
];

/** 사람의 컴퓨터 안 경로. 사용자 이름과 폴더 구조가 드러납니다 */
const LOCAL_PATH_PATTERNS = [
  /\/Users\/[^/\s"'`)]+/g,
  /\/home\/[^/\s"'`)]+/g,
  /\b[A-Za-z]:\\Users\\[^\\\s"'`)]+/g,
  /\/(?:private\/)?var\/folders\/[^\s"'`)]+/g,
];

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

/** 예시용으로 정해진 이메일 도메인(RFC 2606)과 사람 주소가 아닌 것 */
const NON_PERSONAL_EMAIL = /@(?:example\.(?:com|org|net)|[\w-]+\.example)$|^git@github\.com$/i;

/** `logo@2x.png`처럼 이메일 꼴인 파일 이름 */
const FILE_LIKE_EMAIL = /\.(?:png|jpe?g|gif|webp|avif|svg|ico)$/i;

const PRIVATE_IP_PATTERN = /(?<![\d.])(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?![\d.]*\d)/g;

/** 한국 휴대전화 번호 꼴 (010-1234-5678, 01012345678) */
const PHONE_PATTERN = /(?<!\d)01[016789]-?\d{3,4}-?\d{4}(?!\d)/g;

const mask = (value: string) => `${value.slice(0, 4)}…(${value.length}자)`;

const maskEmail = (value: string) => {
  const [local = "", domain = ""] = value.split("@");

  return `${local.slice(0, 1)}…@${domain}`;
};

const isValidIp = (value: string) => value.split(".").every((part) => Number(part) <= 255);

interface FindPrivateInfoParams {
  text: string;
  /** 공개해도 되는 이메일. 사이트 연락처(`SITE.author.email`)를 넘깁니다 */
  allowedEmails?: readonly string[];
  /** 줄 번호를 이 값부터 셉니다. 기본은 1 */
  firstLine?: number;
}

/** 글에서 로컬 경로, 이메일, 토큰 꼴, 사설 IP, 전화번호를 찾습니다 */
const findPrivateInfo = ({ text, allowedEmails = [], firstLine = 1 }: FindPrivateInfoParams) => {
  const allowed = new Set(allowedEmails.map((email) => email.toLowerCase()));

  return text.split(/\r?\n/).flatMap((line, index) => {
    const lineNumber = firstLine + index;
    const matches: PrivateInfoMatch[] = [];
    const push = (kind: PrivateInfoKind, masked: string) => matches.push({ line: lineNumber, kind, masked });

    LOCAL_PATH_PATTERNS.forEach((pattern) => {
      [...line.matchAll(pattern)].forEach((match) => push("local-path", `${match[0].split(/[\\/]/).slice(0, 2).join("/")}/…`));
    });

    [...line.matchAll(EMAIL_PATTERN)].forEach(([email]) => {
      if (allowed.has(email.toLowerCase()) || NON_PERSONAL_EMAIL.test(email) || FILE_LIKE_EMAIL.test(email)) return;

      push("email", maskEmail(email));
    });

    TOKEN_PATTERNS.forEach((pattern) => {
      [...line.matchAll(pattern)].forEach(([token]) => push("token", mask(token)));
    });

    [...line.matchAll(PRIVATE_IP_PATTERN)].forEach(([ip]) => {
      if (isValidIp(ip)) push("private-ip", `${ip.split(".").slice(0, 2).join(".")}.…`);
    });

    [...line.matchAll(PHONE_PATTERN)].forEach(([phone]) => push("phone", `${phone.slice(0, 3)}…`));

    return matches;
  });
};

export default findPrivateInfo;
