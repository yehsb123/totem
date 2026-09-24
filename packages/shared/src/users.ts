import { z } from "zod";
import { baseEntity, objectId, passwordSchema } from "./common";
import { AUTH_PROVIDERS, USER_ROLES, USER_STATUSES } from "./enums";

export const notificationPrefs = z.object({
  email: z.boolean(),
  push: z.boolean(),
});
export type NotificationPrefs = z.infer<typeof notificationPrefs>;

/** GET /users/me 응답 — 설정 > 계정 관리, 콘솔 헤더 인사말에 사용 */
export const userProfile = baseEntity.extend({
  email: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
  providers: z.array(z.enum(AUTH_PROVIDERS)),
  organization: z.object({
    id: objectId,
    name: z.string(),
  }),
  notifications: notificationPrefs,
  lastLoginAt: z.string().nullable(),
});
export type UserProfile = z.infer<typeof userProfile>;

/** PATCH /users/me — 설정 > 계정 관리 저장 (이메일은 로그인 ID 라 변경 불가) */
export const updateProfileRequest = z
  .object({
    name: z.string().trim().min(1).max(50),
    phone: z.string().trim().regex(/^[0-9\-+() ]{8,20}$/).nullable(),
  })
  .partial();
export type UpdateProfileRequest = z.infer<typeof updateProfileRequest>;

/** PATCH /users/me/notifications — 설정 > 알림 설정 토글 */
export const updateNotificationsRequest = notificationPrefs.partial();
export type UpdateNotificationsRequest = z.infer<typeof updateNotificationsRequest>;

/** PUT /users/me/password — 설정 > 비밀번호 변경 */
export const changePasswordRequest = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요."),
  newPassword: passwordSchema,
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequest>;

/** DELETE /users/me — 설정 > 계정 삭제 (카카오 전용 계정은 password 생략, confirm 문구로 확인) */
export const withdrawRequest = z.object({
  password: z.string().optional(),
  confirm: z.literal("탈퇴합니다", { errorMap: () => ({ message: "'탈퇴합니다'를 정확히 입력해주세요." }) }),
});
export type WithdrawRequest = z.infer<typeof withdrawRequest>;
