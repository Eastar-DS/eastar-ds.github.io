import { describe, expect, it } from "vitest";

import findPrivateInfo from "./findPrivateInfo.ts";

const kinds = (text: string, allowedEmails: string[] = []) => findPrivateInfo({ text, allowedEmails }).map((match) => `${match.kind} ${match.masked}`);

describe("findPrivateInfo", () => {
  it("로컬 경로를 사용자 이름 없이 알린다", () => {
    expect(kinds("cat /Users/someone/.knot/log.txt")).toEqual(["local-path /Users/…"]);
    expect(kinds("/home/dev/project")).toEqual(["local-path /home/…"]);
    expect(kinds("C:\\Users\\dev\\file")).toEqual(["local-path C:/Users/…"]);
  });

  it("이메일은 허용한 주소, 예시 도메인, 그림 파일 이름을 넘긴다", () => {
    expect(kinds("연락: person@gmail.com")).toEqual(["email p…@gmail.com"]);
    expect(kinds("blog@eastar.dev", ["blog@eastar.dev"])).toEqual([]);
    expect(kinds("user@example.com git@github.com:x/y logo@2x.png")).toEqual([]);
  });

  it("서비스 접두어가 있는 토큰 꼴을 앞 네 글자만 남겨 알린다", () => {
    const tokens = [`ntn_${"a".repeat(40)}`, `ghp_${"B".repeat(36)}`, `sk-ant-${"c".repeat(30)}`, `phc_${"d".repeat(30)}`, `AKIA${"E".repeat(16)}`];

    expect(kinds(tokens.join(" "))).toEqual(["token ntn_…(44자)", "token ghp_…(40자)", "token sk-a…(37자)", "token phc_…(34자)", "token AKIA…(20자)"]);
  });

  it("사설 IP를 알리고 공인 IP, 버전 번호, 루프백은 넘긴다", () => {
    expect(kinds("서버 192.168.0.12, 10.1.2.3, 172.20.0.1")).toEqual(["private-ip 192.168.…", "private-ip 10.1.…", "private-ip 172.20.…"]);
    expect(kinds("8.8.8.8 127.0.0.1 172.32.0.1 버전 10.0.0.1.2")).toEqual([]);
  });

  it("휴대전화 번호 꼴을 알린다", () => {
    expect(kinds("010-1234-5678")).toEqual(["phone 010…"]);
    expect(kinds("1,939개, 128,317px, 2026-11-21")).toEqual([]);
  });

  it("줄 번호를 붙인다", () => {
    expect(findPrivateInfo({ text: "첫 줄\n/Users/a/b", firstLine: 10 })[0]?.line).toBe(11);
  });
});
