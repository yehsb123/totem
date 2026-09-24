import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { AUTH_PROVIDERS, PLAN_TIERS, USER_ROLES, USER_STATUSES } from "@totem/shared";

/**
 * 조직(테넌트). 회원가입 시 입력한 "회사 이름"으로 생성되고, 가입자는 owner 가 된다.
 * 코스·투어·리뷰·일정·결제는 모두 organizationId 로 격리된다.
 */
const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    plan: { type: String, enum: PLAN_TIERS, default: "trial" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
export const Organization = model("Organization", organizationSchema, "organizations");
export type OrganizationDoc = InferSchemaType<typeof organizationSchema> & { _id: Types.ObjectId };

/** 사용자 — 로그인 계정. 카카오 전용 가입자는 passwordHash·email 이 없을 수 있다 */
const identitySchema = new Schema(
  {
    provider: { type: String, enum: AUTH_PROVIDERS, required: true },
    providerUserId: { type: String, required: true },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    email: { type: String, lowercase: true, trim: true, default: null },
    passwordHash: { type: String, default: null, select: false },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    phone: { type: String, trim: true, default: null },
    role: { type: String, enum: USER_ROLES, default: "member" },
    status: { type: String, enum: USER_STATUSES, default: "active", index: true },
    identities: { type: [identitySchema], default: [] },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
    },
    /** 회원가입 약관 동의 기록 (법적 증빙) */
    agreements: {
      terms: { type: Date, default: null },
      privacy: { type: Date, default: null },
      marketing: { type: Date, default: null },
    },
    lastLoginAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
// 탈퇴(email=null 로 비움)·카카오 무이메일 계정이 여러 개여도 충돌하지 않도록 문자열일 때만 unique
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });
userSchema.index({ "identities.provider": 1, "identities.providerUserId": 1 }, { unique: true, sparse: true });
userSchema.index({ name: 1, phone: 1 });
export const User = model("User", userSchema, "users");
export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

/**
 * 로그인 세션 = refresh token. 원문은 클라이언트만 갖고 DB 에는 해시만 둔다.
 * refresh 할 때마다 새 토큰으로 교체(회전)하고, 이미 교체된 토큰이 다시 오면
 * 탈취로 보고 그 사용자의 세션을 전부 폐기한다.
 */
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: null },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: true },
);
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const Session = model("Session", sessionSchema, "sessions");

/** web(메인) → console(기능화면) 로그인 인계용 1회용 코드. 수명 수십 초, 사용 즉시 소멸 */
const authHandoffSchema = new Schema(
  {
    codeHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
authHandoffSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const AuthHandoff = model("AuthHandoff", authHandoffSchema, "auth_handoffs");

/**
 * 조직 초대 — 링크(토큰)로 수락. 원문 토큰은 만들 때 한 번만 응답하고 DB 에는 해시만 둔다.
 * 수락·취소·만료된 초대도 이력으로 남긴다 (TTL 삭제 안 함, 상태는 필드로 계산).
 */
const invitationSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["admin", "member"], required: true },
    tokenHash: { type: String, required: true, unique: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
    acceptedUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
invitationSchema.index({ organizationId: 1, email: 1, createdAt: -1 });
export const Invitation = model("Invitation", invitationSchema, "invitations");
export type InvitationDoc = InferSchemaType<typeof invitationSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
