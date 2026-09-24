import bcrypt from "bcryptjs";
import type { Request } from "express";
import type { Types } from "mongoose";
import type { AuthSession, UserRole } from "@totem/shared";
import { env } from "../../config/env";
import { randomToken, sha256 } from "../../lib/crypto";
import { HttpError, conflict, unauthorized } from "../../lib/http";
import { Organization, ScheduleLabel, Session, Subscription, User } from "../../db/models";
import { toUserProfile } from "../../db/serialize";
import { accessTtlSeconds, signAccessToken } from "../../middlewares/auth";

const DAY_MS = 24 * 60 * 60 * 1000;

/** 존재하지 않는 이메일로 로그인해도 응답 시간이 같도록 비교에 쓰는 더미 해시 */
let dummyHash: string | null = null;
export async function verifyPassword(plain: string, hash: string | null | undefined) {
  if (!hash) {
    dummyHash ??= await bcrypt.hash("totem-timing-guard", env.BCRYPT_ROUNDS);
    await bcrypt.compare(plain, dummyHash);
    return false;
  }
  return bcrypt.compare(plain, hash);
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, env.BCRYPT_ROUNDS);

/** 새 조직에 기본으로 넣어 주는 일정 라벨 (일정관리가 빈 화면으로 시작하지 않도록) */
const DEFAULT_LABELS = [
  { name: "투어", emoji: "🚌", color: "blue" },
  { name: "미팅", emoji: "💬", color: "green" },
  { name: "휴무", emoji: "🏖️", color: "gray" },
] as const;

/** 가입 시 조직·구독·기본 라벨을 함께 만든다. 가입자는 조직 owner */
export async function createOrganizationWithOwner(input: {
  organizationName: string;
  user: {
    email: string | null;
    passwordHash: string | null;
    name: string;
    phone?: string | null;
    identities?: { provider: "kakao"; providerUserId: string }[];
    agreements: { terms: Date | null; privacy: Date | null; marketing: Date | null };
  };
}) {
  const org = await Organization.create({ name: input.organizationName });
  try {
    const user = await User.create({ ...input.user, organizationId: org._id, role: "owner" });
    org.ownerId = user._id;
    await Promise.all([
      org.save(),
      Subscription.create({ organizationId: org._id, plan: "free", status: "active" }),
      ScheduleLabel.insertMany(DEFAULT_LABELS.map((l) => ({ ...l, organizationId: org._id }))),
    ]);
    return { org, user };
  } catch (e) {
    // 사용자 생성 실패(이메일 중복 경합 등) 시 빈 조직을 남기지 않는다
    await Promise.all([
      Organization.deleteOne({ _id: org._id }),
      Subscription.deleteMany({ organizationId: org._id }),
      ScheduleLabel.deleteMany({ organizationId: org._id }),
    ]);
    if ((e as { code?: number }).code === 11000) throw conflict("이미 가입된 이메일입니다.");
    throw e;
  }
}

/** 로그인 성공 공통 처리: refresh 세션 저장 + access 발급 + 프로필 */
export async function issueSession(
  userId: Types.ObjectId,
  req: Request,
): Promise<AuthSession> {
  const user = await User.findById(userId).select("+passwordHash").lean();
  if (!user || user.status !== "active") throw unauthorized("사용할 수 없는 계정입니다.");
  const org = await Organization.findById(user.organizationId).select("name").lean();
  if (!org) throw new HttpError(500, "INTERNAL_ERROR", "소속 조직 정보를 찾을 수 없습니다.");

  const refreshToken = randomToken(48);
  await Session.create({
    userId: user._id,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS),
    userAgent: req.get("user-agent")?.slice(0, 300) ?? null,
    ip: req.ip ?? null,
  });
  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  const accessToken = signAccessToken({ userId: user._id, organizationId: user.organizationId, role: user.role as UserRole });
  return {
    accessToken,
    refreshToken,
    expiresIn: accessTtlSeconds(accessToken),
    user: toUserProfile({ ...user, lastLoginAt: new Date() }, org, !!user.passwordHash),
  };
}

/**
 * refresh token 회전. 이미 교체(회전)된 토큰이 다시 들어오면 탈취로 판단해
 * 그 사용자의 모든 세션을 폐기한다.
 */
export async function rotateRefreshToken(refreshToken: string) {
  const hash = sha256(refreshToken);
  const session = await Session.findOne({ tokenHash: hash });
  if (!session) throw unauthorized("로그인이 만료되었습니다. 다시 로그인해주세요.");

  if (session.revokedAt) {
    if (session.replacedByHash) {
      await Session.updateMany({ userId: session.userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
    }
    throw unauthorized("로그인이 만료되었습니다. 다시 로그인해주세요.");
  }
  if (session.expiresAt.getTime() <= Date.now()) throw unauthorized("로그인이 만료되었습니다. 다시 로그인해주세요.");

  const user = await User.findById(session.userId).select("status role organizationId").lean();
  if (!user || user.status !== "active") throw unauthorized("사용할 수 없는 계정입니다.");

  const next = randomToken(48);
  const nextHash = sha256(next);
  // 조건부 업데이트로 동시 refresh 두 번이 모두 성공하는 경합을 막는다
  const claimed = await Session.findOneAndUpdate(
    { _id: session._id, revokedAt: null },
    { $set: { revokedAt: new Date(), replacedByHash: nextHash } },
  );
  if (!claimed) throw unauthorized("로그인이 만료되었습니다. 다시 로그인해주세요.");

  await Session.create({
    userId: session.userId,
    tokenHash: nextHash,
    expiresAt: session.expiresAt, // 회전해도 최초 로그인 기준 만료는 늘리지 않는다
    userAgent: session.userAgent,
    ip: session.ip,
  });

  const accessToken = signAccessToken({ userId: user._id, organizationId: user.organizationId, role: user.role as UserRole });
  return { accessToken, refreshToken: next, expiresIn: accessTtlSeconds(accessToken) };
}

export async function revokeRefreshToken(refreshToken: string) {
  await Session.updateOne({ tokenHash: sha256(refreshToken), revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export async function revokeAllSessions(userId: Types.ObjectId) {
  await Session.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  const head = local.length <= 3 ? local.slice(0, 1) : local.slice(0, 3);
  return `${head}***@${domain}`;
}
