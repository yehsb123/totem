import { createHash, randomBytes } from "node:crypto";

/** URL 에 그대로 쓸 수 있는 난수 토큰 */
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

/** DB 에는 원문 대신 해시만 저장한다 (DB 유출 시 토큰 재사용 방지) */
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
