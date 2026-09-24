import { Router } from "express";
import {
  ROUTES,
  changePasswordRequest,
  updateNotificationsRequest,
  updateProfileRequest,
  withdrawRequest,
} from "@totem/shared";
import { HttpError, badRequest, conflict, noContent, notFound, ok, parse } from "../../lib/http";
import { Invitation, Organization, User } from "../../db/models";
import { toUserProfile } from "../../db/serialize";
import { authOf, requireAuth } from "../../middlewares/auth";
import { hashPassword, revokeAllSessions, verifyPassword } from "../auth/service";

export const usersRouter = Router();
usersRouter.use(ROUTES.users.me, requireAuth);

async function loadProfile(userId: unknown) {
  const user = await User.findById(userId).select("+passwordHash").lean();
  if (!user) throw notFound("사용자");
  const org = await Organization.findById(user.organizationId).select("name").lean();
  if (!org) throw notFound("조직");
  return toUserProfile(user, org, !!user.passwordHash);
}

/** 설정 > 계정 관리, 콘솔 헤더 "환영합니다, ○○님" */
usersRouter.get(ROUTES.users.me, async (req, res) => {
  ok(res, await loadProfile(authOf(req).userId));
});

usersRouter.patch(ROUTES.users.me, async (req, res) => {
  const body = parse(updateProfileRequest, req.body);
  if (Object.keys(body).length === 0) throw badRequest("변경할 항목이 없습니다.");
  const { userId } = authOf(req);
  await User.updateOne({ _id: userId }, { $set: body }, { runValidators: true });
  ok(res, await loadProfile(userId));
});

/** 설정 > 알림 설정 토글 (변경 즉시 저장) */
usersRouter.patch(ROUTES.users.notifications, async (req, res) => {
  const body = parse(updateNotificationsRequest, req.body);
  const { userId } = authOf(req);
  const set = Object.fromEntries(Object.entries(body).map(([k, v]) => [`notifications.${k}`, v]));
  if (Object.keys(set).length) await User.updateOne({ _id: userId }, { $set: set });
  ok(res, await loadProfile(userId));
});

/** 설정 > 비밀번호 변경 — 성공 시 다른 기기 세션은 모두 로그아웃 */
usersRouter.put(ROUTES.users.password, async (req, res) => {
  const { currentPassword, newPassword } = parse(changePasswordRequest, req.body);
  const { userId } = authOf(req);
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw notFound("사용자");
  if (!user.passwordHash) throw badRequest("카카오로 가입한 계정은 비밀번호가 없습니다.");
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new HttpError(400, "VALIDATION_ERROR", "현재 비밀번호가 일치하지 않습니다.", { fields: [{ path: "currentPassword", message: "현재 비밀번호가 일치하지 않습니다." }] });
  }
  if (currentPassword === newPassword) throw badRequest("새 비밀번호가 현재 비밀번호와 같습니다.");
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await revokeAllSessions(user._id);
  noContent(res);
});

/**
 * 설정 > 계정 삭제 (탈퇴).
 * 개인정보(이메일·이름·전화·인증수단)는 즉시 지우고 레코드는 남겨(soft delete) 작성자 참조가 깨지지 않게 한다.
 * 조직 소유자는 다른 활성 멤버가 있으면 탈퇴할 수 없고, 혼자면 조직도 함께 삭제 표시한다.
 */
usersRouter.delete(ROUTES.users.me, async (req, res) => {
  const body = parse(withdrawRequest, req.body);
  const { userId, organizationId, role } = authOf(req);
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw notFound("사용자");
  if (user.passwordHash && !(await verifyPassword(body.password ?? "", user.passwordHash))) {
    throw badRequest("비밀번호가 일치하지 않습니다.");
  }

  if (role === "owner") {
    const others = await User.countDocuments({ organizationId, _id: { $ne: userId }, status: "active" });
    if (others > 0) throw conflict("조직에 다른 멤버가 있어 탈퇴할 수 없습니다. 설정 > 멤버 관리에서 소유권을 다른 멤버에게 이전한 뒤 탈퇴해주세요.");
    await Organization.updateOne({ _id: organizationId }, { $set: { deletedAt: new Date() } });
    // 삭제된 조직으로의 대기 중 초대는 무효 (미리보기·수락도 막혀 있지만 이력상 '취소'로 남긴다)
    await Invitation.updateMany({ organizationId, acceptedAt: null, revokedAt: null }, { $set: { revokedAt: new Date() } });
  }

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        status: "withdrawn",
        email: null,
        passwordHash: null,
        phone: null,
        name: "탈퇴한 사용자",
        identities: [],
        deletedAt: new Date(),
      },
    },
  );
  await revokeAllSessions(userId);
  noContent(res);
});
