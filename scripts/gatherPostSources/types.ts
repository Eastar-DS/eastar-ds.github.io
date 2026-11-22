import type { ReadPolicy } from "../blogWork/resolveWorkDir.ts";
export const SOURCE_KINDS = ["해설 아티팩트", "아티팩트 링크", "노션 원고", "PR", "PR 그림과 도식", "이슈", "커밋", "ADR과 결정 문서", "코드", "측정 기록", "팀 보고와 발표 자료", "에이전트 지시문과 작업 메모", "개인 노트", "화면 캡처와 영상", "바깥 자료", "이미 쓴 블로그 글"] as const;
export const USES = ["써도 됨", "다시 써서 씀", "단서만", "이스타 확인", "쓰면 안 됨", "열지 않음", "관련 없음"] as const;
export interface SourceItem {
  id: string; kind: string; path: string; root: string; title: string; bytes: number;
  modifiedAt: string; topicHits: number; inTopicDir: boolean; read: ReadPolicy["read"];
  defaultUse: string; hiddenNameCount: number; unopenable: boolean; removed: boolean;
  headingLines?: number[]; fileCount?: number;
}
export interface SourceLink { type: string; url: string; text: string; foundIn: string }
export interface ArtifactPair { url: string; text: string; localId: string | null; state: string; candidates?: string[] }
export interface SourceScan {
  work: string; scannedAt: string; topics: string[];
  roots: { name: string; kind: string; read: string; exists: boolean; itemCount: number }[];
  items: SourceItem[]; folders: SourceItem[]; links: SourceLink[]; artifactPairs: ArtifactPair[];
  unpairedLocalArtifacts: string[]; missingKinds: string[]; warnings: string[];
  repos: { name: string; isPrivate: boolean | null; pr?: { number: number; fileCount: number; commitCount: number; reviewCount: number; reviewCommentCount: number; issueCount: number } }[];
}
