import { describe, expect, it } from "vitest";
import { demoPasswordFor } from "../src/db/seed/seed";

describe("데모 계정 비밀번호", () => {
  it("알려진 기본값은 인메모리 DB 에서만, 영속 DB 는 SEED_DEMO_PASSWORD 가 있어야 만든다", () => {
    expect(demoPasswordFor({ configured: "", memoryDb: true })).toBe("demo1234");
    expect(demoPasswordFor({ configured: "", memoryDb: false })).toBe("");
    expect(demoPasswordFor({ configured: "S3cret-pass", memoryDb: false })).toBe("S3cret-pass");
    expect(demoPasswordFor({ configured: "S3cret-pass", memoryDb: true })).toBe("S3cret-pass");
  });
});
