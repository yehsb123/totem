import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { Types } from "mongoose";
import {
  INVITATION_TTL_DAYS,
  ROUTES,
  acceptInvitationRequest,
  createInvitationRequest,
  transferOwnershipRequest,
  updateMemberRequest,
  type Invitation as InvitationDto,
  type InvitationPreview,
  type Member,
} from "@totem/shared";
import { randomToken, sha256 } from "../../lib/crypto";
import { HttpError, badRequest, conflict, forbidden, noContent, notFound, ok, parse } from "../../lib/http";
import { Invitation, Organization, User } from "../../db/models";
import { authOf, objectIdParam, requireAuth, requireRole } from "../../middlewares/auth";
import { hashPassword, issueSession, revokeAllSessions } from "../auth/service";

export const orgRouter = Router();

const DAY_MS = 24 * 60 * 60 * 1000;
const limitMessage = { error: { code: "RATE_LIMITED", message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." } };
const invitationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false, message: limitMessage });

/* eslint-disable @typescript-eslint/no-explicit-any -- lean() 결과를 응답 모양으로 좁힌다 */
const toMember = (u: any): Member => ({
  id: String(u._id),
  createdAt: new Date(u.createdAt).toISOString(),
  updatedAt: new Date(u.updatedAt).toISOString(),
  email: u.email ?? null,
  name: u.name,
  role: u.role,
  status: u.status,
  lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
});

const invitationStatus = (i: any): InvitationDto["status"] =>
  i.acceptedAt ? "accepted" : i.revokedAt ? "revoked" : new Date(i.expiresAt).getTime() <= Date.now() ? "expired" : "pending";

const toInvitation = (i: any, inviterName: string): InvitationDto => ({
  id: String(i._id),
  createdAt: new Date(i.createdAt).toISOString(),
  updatedAt: new Date(i.updatedAt).toISOString(),
  email: i.email,
  role: i.role,
  invitedBy: { id: String(i.invitedBy), name: inviterName },
  expiresAt: new Date(i.expiresAt).toISOString(),
  status: invitationStatus(i),
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const activeMembers = (organizationId: Types.ObjectId) =>
  User.find({ organizationId, status: { $ne: "withdrawn" } }).sort({ role: 1, createdAt: 1 }).lean();

/** 역할 정렬: 소유자 → 관리자 → 멤버 */
const ROLE_ORDER = { owner: 0, admin: 1, member: 2 } as const;
const sortMembers = (list: Member[]) => list.sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.createdAt.localeCompare(b.createdAt));

/** 사용 가능한(대기 중·미만료) 초대를 토큰으로 찾는다 */
async function findUsableInvitation(token: string) {
  const inv = await Invitation.findOne({ tokenHash: sha256(token) }).lean();
  if (!inv) throw notFound("초대");
  const status = invitationStatus(inv);
  if (status === "accepted") throw new HttpError(410, "CONFLICT", "이미 수락된 초대입니다. 로그인해주세요.");
  if (status === "revoked") throw new HttpError(410, "CONFLICT", "취소된 초대입니다. 관리자에게 다시 요청해주세요.");
  if (status === "expired") throw new HttpError(410, "CONFLICT", "만료된 초대입니다. 관리자에게 다시 요청해주세요.");
  return inv;
}

/* ───────── 공개: 초대 확인·수락 (메인 /invite) ───────── */

orgRouter.get(ROUTES.auth.invitation(":token"), invitationLimiter, async (req, res) => {
  const inv = await findUsableInvitation(String(req.params.token));
  const [org, inviter] = await Promise.all([
    Organization.findById(inv.organizationId).select("name deletedAt").lean(),
    User.findById(inv.invitedBy).select("name").lean(),
  ]);
  if (!org || org.deletedAt) throw notFound("초대");
  const preview: InvitationPreview = {
    organizationName: org.name,
    email: inv.email,
    role: inv.role as InvitationPreview["role"],
    invitedByName: inviter?.name ?? "관리자",
    expiresAt: new Date(inv.expiresAt).toISOString(),
  };
  ok(res, preview);
});

orgRouter.post(ROUTES.auth.acceptInvitation, invitationLimiter, async (req, res) => {
  const body = parse(acceptInvitationRequest, req.body);
  const inv = await findUsableInvitation(body.token);
  if (await User.exists({ email: inv.email })) throw conflict("이미 가입된 이메일입니다. 한 계정은 한 조직에만 속할 수 있습니다.");
  const org = await Organization.findById(inv.organizationId).select("deletedAt").lean();
  if (!org || org.deletedAt) throw notFound("초대");

  // 같은 초대를 동시에 두 번 수락하지 못하도록 먼저 조건부로 표시
  const claimed = await Invitation.findOneAndUpdate({ _id: inv._id, acceptedAt: null, revokedAt: null }, { $set: { acceptedAt: new Date() } });
  if (!claimed) throw new HttpError(410, "CONFLICT", "이미 수락된 초대입니다. 로그인해주세요.");

  const now = new Date();
  try {
    const user = await User.create({
      organizationId: inv.organizationId,
      email: inv.email,
      passwordHash: await hashPassword(body.password),
      name: body.name,
      role: inv.role,
      agreements: { terms: now, privacy: now, marketing: body.agreements.marketing ? now : null },
    });
    await Invitation.updateOne({ _id: inv._id }, { $set: { acceptedUserId: user._id } });
    ok(res, await issueSession(user._id, req), 201);
  } catch (e) {
    await Invitation.updateOne({ _id: inv._id }, { $set: { acceptedAt: null } });
    if ((e as { code?: number }).code === 11000) throw conflict("이미 가입된 이메일입니다.");
    throw e;
  }
});

/* ───────── 조직 관리 (로그인 필요) ───────── */

orgRouter.use("/org", requireAuth);

/** 멤버 목록 — 모든 역할이 볼 수 있다 (탈퇴·제외된 사람은 빠짐) */
orgRouter.get(ROUTES.org.members, async (req, res) => {
  ok(res, sortMembers((await activeMembers(authOf(req).organizationId)).map(toMember)));
});

/** 역할 변경 — 소유자만. 자기 자신·소유자는 대상이 아니다 */
orgRouter.patch(ROUTES.org.member(":id"), requireRole("owner"), async (req, res) => {
  const { role } = parse(updateMemberRequest, req.body);
  const { organizationId, userId } = authOf(req);
  const id = objectIdParam(req.params.id, "멤버");
  if (String(id) === String(userId)) throw badRequest("자신의 역할은 바꿀 수 없습니다. 소유권 이전을 이용하세요.");
  const target = await User.findOne({ _id: id, organizationId, status: { $ne: "withdrawn" } });
  if (!target) throw notFound("멤버");
  if (target.role === "owner") throw badRequest("소유자의 역할은 소유권 이전으로만 바뀝니다.");
  target.role = role;
  await target.save();
  ok(res, toMember(target.toObject()));
});

/**
 * 멤버 제외 — 관리자 이상. 관리자는 멤버만, 소유자는 관리자·멤버를 제외할 수 있다.
 * 탈퇴와 같이 개인정보를 지우고 로그인을 막는다(작성 기록은 남음). 이메일이 비워져 다시 초대할 수 있다.
 */
orgRouter.delete(ROUTES.org.member(":id"), requireRole("owner", "admin"), async (req, res) => {
  const { organizationId, userId, role } = authOf(req);
  const id = objectIdParam(req.params.id, "멤버");
  if (String(id) === String(userId)) throw badRequest("자기 자신은 제외할 수 없습니다. 설정 > 계정 삭제를 이용하세요.");
  const target = await User.findOne({ _id: id, organizationId, status: { $ne: "withdrawn" } }).lean();
  if (!target) throw notFound("멤버");
  if (target.role === "owner") throw forbidden("소유자는 제외할 수 없습니다.");
  if (target.role === "admin" && role !== "owner") throw forbidden("관리자는 소유자만 제외할 수 있습니다.");
  await User.updateOne(
    { _id: id },
    { $set: { status: "withdrawn", email: null, passwordHash: null, phone: null, name: "제외된 멤버", identities: [], deletedAt: new Date() } },
  );
  await revokeAllSessions(id);
  noContent(res);
});

/** 소유권 이전 — 소유자만. 대상이 소유자가 되고, 기존 소유자는 관리자가 된다 */
orgRouter.post(ROUTES.org.transferOwnership, requireRole("owner"), async (req, res) => {
  const { userId: targetId } = parse(transferOwnershipRequest, req.body);
  const { organizationId, userId } = authOf(req);
  if (targetId === String(userId)) throw badRequest("이미 소유자입니다.");
  const target = await User.findOne({ _id: targetId, organizationId, status: "active" });
  if (!target) throw notFound("멤버");
  target.role = "owner";
  await target.save();
  await User.updateOne({ _id: userId }, { $set: { role: "admin" } });
  await Organization.updateOne({ _id: organizationId }, { $set: { ownerId: target._id } });
  ok(res, sortMembers((await activeMembers(organizationId)).map(toMember)));
});

/** 초대 목록 — 관리자 이상 (대기 중이 위로) */
orgRouter.get(ROUTES.org.invitations, requireRole("owner", "admin"), async (req, res) => {
  const invs = await Invitation.find({ organizationId: authOf(req).organizationId }).sort({ createdAt: -1 }).limit(100).lean();
  const inviters = await User.find({ _id: { $in: invs.map((i) => i.invitedBy) } }).select("name").lean();
  const nameOf = new Map(inviters.map((u) => [String(u._id), u.name]));
  const list = invs.map((i) => toInvitation(i, nameOf.get(String(i.invitedBy)) ?? "알 수 없음"));
  ok(res, list.sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending")));
});

/** 초대 만들기 — 같은 이메일의 대기 중 초대가 있으면 취소하고 새로 만든다 (링크 재발급) */
orgRouter.post(ROUTES.org.invitations, requireRole("owner", "admin"), async (req, res) => {
  const { email, role } = parse(createInvitationRequest, req.body);
  const { organizationId, userId, role: myRole } = authOf(req);
  if (role === "admin" && myRole !== "owner") throw forbidden("관리자 초대는 소유자만 할 수 있습니다.");
  if (await User.exists({ email })) throw conflict("이미 가입된 이메일입니다. 한 계정은 한 조직에만 속할 수 있습니다.");
  // 같은 이메일로 다시 초대하면 기존 대기 초대가 취소되므로, 관리자가 멤버로 재초대해 소유자의 관리자 초대를 덮어쓰지 못하게
  if (myRole !== "owner" && (await Invitation.exists({ organizationId, email, role: "admin", acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } })))
    throw forbidden("소유자가 보낸 관리자 초대가 대기 중입니다. 소유자만 바꿀 수 있습니다.");
  await Invitation.updateMany({ organizationId, email, acceptedAt: null, revokedAt: null }, { $set: { revokedAt: new Date() } });
  const token = randomToken(32);
  const inv = await Invitation.create({
    organizationId,
    email,
    role,
    tokenHash: sha256(token),
    invitedBy: userId,
    expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * DAY_MS),
  });
  const me = await User.findById(userId).select("name").lean();
  ok(res, { invitation: toInvitation(inv.toObject(), me?.name ?? ""), token }, 201);
});

/** 초대 취소 — 관리자 초대는 만들 때와 같이 소유자만 취소할 수 있다 */
orgRouter.delete(ROUTES.org.invitation(":id"), requireRole("owner", "admin"), async (req, res) => {
  const { organizationId, role } = authOf(req);
  const r = await Invitation.updateOne(
    { _id: objectIdParam(req.params.id, "초대"), organizationId, acceptedAt: null, revokedAt: null, ...(role !== "owner" && { role: "member" }) },
    { $set: { revokedAt: new Date() } },
  );
  if (r.matchedCount === 0) throw notFound("대기 중인 초대");
  noContent(res);
});
