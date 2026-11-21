import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { INDEXNOW_ENDPOINT, INDEXNOW_KEY } from "./constants.ts";

describe("IndexNow 키", () => {
  it("규격대로 8~128자의 영문, 숫자, 하이픈이다", () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-zA-Z0-9-]{8,128}$/);
  });

  it("사이트 맨 위에 키 이름의 파일이 있고, 내용이 키와 같다", () => {
    const keyFile = path.resolve(import.meta.dirname, "../../public", `${INDEXNOW_KEY}.txt`);

    expect(readFileSync(keyFile, "utf8").trim()).toBe(INDEXNOW_KEY);
  });

  it("접수 주소는 IndexNow 참여 엔진의 /indexnow 주소다", () => {
    expect(INDEXNOW_ENDPOINT).toMatch(/^https:\/\/[^/]+\/indexnow$/);
  });
});
