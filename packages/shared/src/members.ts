import { z } from "zod";
import { baseEntity, isoDateTime, objectId, passwordSchema } from "./common";
import { USER_ROLES, USER_STATUSES } from "./enums";

/**
 * 조직 멤버·초대 (설정 > 멤버 관리, 메인 /invite).
 * 권한: 소유자(owner) = 역할 변경·소유권 이전 · 관리자(admin) = 초대·멤버 제외 · 멤버(member) = 조회만
 */

/** 초대할 때 고를 수 있는 역할 (소유자는 이전으로만 바뀐다) */
export const INVITABLE_ROLES = ["admin", "member"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export const INVITATION_TTL_DAYS = 7;

export const member = baseEntity.extend({
  email: z.string().nullable(),
  name: z.string(),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
  lastLoginAt: isoDateTime.nullable(),
});
export type Member = z.infer<typeof member>;

/** PATCH /org/members/:id — 소유자만. owner 로는 바꿀 수 없다(소유권 이전 사용) */
export const updateMemberRequest = z.object({ role: z.enum(INVITABLE_ROLES) });
export type UpdateMemberRequest = z.infer<typeof updateMemberRequest>;

/** POST /org/transfer-ownership — 소유자만. 대상은 활성 멤버, 기존 소유자는 관리자가 된다 */
export const transferOwnershipRequest = z.object({ userId: objectId });
export type TransferOwnershipRequest = z.infer<typeof transferOwnershipRequest>;

export const invitation = baseEntity.extend({
  email: z.string(),
  role: z.enum(INVITABLE_ROLES),
  invitedBy: z.object({ id: objectId, name: z.string() }),
  expiresAt: isoDateTime,
  status: z.enum(["pending", "accepted", "revoked", "expired"]),
});
export type Invitation = z.infer<typeof invitation>;

/** POST /org/invitations — 관리자 이상 */
export const createInvitationRequest = z.object({
  email: z.string().trim().toLowerCase().email("이메일 형식이 올바르지 않습니다."),
  role: z.enum(INVITABLE_ROLES).default("member"),
});
export type CreateInvitationRequest = z.input<typeof createInvitationRequest>;

/** 초대 생성 응답 — token 원문은 이때 한 번만 준다 (DB 에는 해시만). 화면이 초대 링크를 만든다 */
export interface CreatedInvitation {
  invitation: Invitation;
  token: string;
}

/** GET /auth/invitations/:token — 로그인 없이 초대 내용 확인 (메인 /invite) */
export interface InvitationPreview {
  organizationName: string;
  email: string;
  role: InvitableRole;
  invitedByName: string;
  expiresAt: string;
}

/** POST /auth/invitations/accept — 초대 수락 = 그 조직 소속 계정 생성 + 로그인 */
export const acceptInvitationRequest = z.object({
  token: z.string().min(16),
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(50),
  password: passwordSchema,
  agreements: z.object({
    terms: z.literal(true, { errorMap: () => ({ message: "이용약관에 동의해주세요." }) }),
    privacy: z.literal(true, { errorMap: () => ({ message: "개인정보 처리방침에 동의해주세요." }) }),
    marketing: z.boolean().default(false),
  }),
});
export type AcceptInvitationRequest = z.input<typeof acceptInvitationRequest>;

/** 초대 링크 (메인 사이트) — 콘솔이 만들어 복사해 준다 */
export const invitationUrl = (webUrl: string, token: string) => `${webUrl.replace(/\/+$/, "")}/invite?token=${encodeURIComponent(token)}`;
