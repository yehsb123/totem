import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import type { UserRole } from "@totem/shared";
import { env } from "../config/env";
import { HttpError, forbidden, unauthorized } from "../lib/http";
import { User } from "../db/models";

export interface AuthContext {
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  role: UserRole;
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

interface AccessClaims {
  sub: string;
  org: string;
  role: UserRole;
}

export function signAccessToken(c: { userId: Types.ObjectId | string; organizationId: Types.ObjectId | string; role: UserRole }) {
  const claims: AccessClaims = { sub: String(c.userId), org: String(c.organizationId), role: c.role };
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions["expiresIn"] });
}

/** access token 수명(초) — 응답의 expiresIn 에 사용 */
export function accessTtlSeconds(token: string): number {
  const decoded = jwt.decode(token) as { exp?: number; iat?: number } | null;
  return decoded?.exp && decoded.iat ? decoded.exp - decoded.iat : 0;
}

/**
 * Bearer 토큰 검증 + 사용자 상태 확인.
 * 토큰이 유효해도 정지·탈퇴된 계정이면 즉시 막는다 (토큰 만료를 기다리지 않음).
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw unauthorized();

  let claims: AccessClaims;
  try {
    claims = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessClaims;
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) throw new HttpError(401, "TOKEN_EXPIRED", "로그인이 만료되었습니다.");
    throw unauthorized("유효하지 않은 토큰입니다.");
  }
  if (!Types.ObjectId.isValid(claims.sub) || !Types.ObjectId.isValid(claims.org)) throw unauthorized("유효하지 않은 토큰입니다.");

  const user = await User.findById(claims.sub).select("status role organizationId").lean();
  if (!user || user.status !== "active") throw unauthorized("사용할 수 없는 계정입니다.");

  req.auth = { userId: user._id, organizationId: user.organizationId, role: user.role as UserRole };
  next();
}

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw unauthorized();
    if (!roles.includes(req.auth.role)) throw forbidden();
    next();
  };

/** requireAuth 를 거친 핸들러에서 auth 를 꺼낸다 */
export function authOf(req: Request): AuthContext {
  if (!req.auth) throw unauthorized();
  return req.auth;
}

/** URL 의 :id 를 ObjectId 로 (형식이 틀리면 404 — 존재 여부를 흘리지 않음) */
export function objectIdParam(value: string | string[] | undefined, what: string): Types.ObjectId {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) throw new HttpError(404, "NOT_FOUND", `${what}을(를) 찾을 수 없습니다.`);
  return new Types.ObjectId(value);
}
