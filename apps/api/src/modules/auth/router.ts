import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  ROUTES,
  emailCheckRequest,
  findEmailRequest,
  handoffExchangeRequest,
  kakaoLoginRequest,
  loginRequest,
  logoutRequest,
  refreshRequest,
  signupRequest,
} from "@totem/shared";
import { env } from "../../config/env";
import { randomToken, sha256 } from "../../lib/crypto";
import { HttpError, conflict, noContent, notFound, ok, parse, unauthorized } from "../../lib/http";
import { AuthHandoff, User } from "../../db/models";
import { authOf, requireAuth } from "../../middlewares/auth";
import { fetchKakaoUser } from "./kakao";
import {
  createOrganizationWithOwner,
  hashPassword,
  issueSession,
  maskEmail,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyPassword,
} from "./service";

export const authRouter = Router();

const limitMessage = { error: { code: "RATE_LIMITED", message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." } };
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.AUTH_RATE_LIMIT_PER_15MIN,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: limitMessage,
});
// 계정 존재 여부를 알려주는 엔드포인트는 더 엄격하게
const lookupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false, message: limitMessage });

authRouter.post(ROUTES.auth.emailCheck, lookupLimiter, async (req, res) => {
  const { email } = parse(emailCheckRequest, req.body);
  const exists = await User.exists({ email });
  ok(res, { available: !exists });
});

authRouter.post(ROUTES.auth.signup, authLimiter, async (req, res) => {
  const body = parse(signupRequest, req.body);
  if (await User.exists({ email: body.email })) throw conflict("이미 가입된 이메일입니다.");
  const now = new Date();
  const { user } = await createOrganizationWithOwner({
    organizationName: body.companyName,
    user: {
      email: body.email,
      passwordHash: await hashPassword(body.password),
      name: body.name,
      phone: body.phone ?? null,
      agreements: { terms: now, privacy: now, marketing: body.agreements.marketing ? now : null },
    },
  });
  ok(res, await issueSession(user._id, req), 201);
});

authRouter.post(ROUTES.auth.login, authLimiter, async (req, res) => {
  const { email, password } = parse(loginRequest, req.body);
  const user = await User.findOne({ email }).select("+passwordHash status").lean();
  const valid = await verifyPassword(password, user?.passwordHash);
  if (!user || !valid) throw unauthorized("이메일 또는 비밀번호가 일치하지 않습니다.");
  if (user.status === "suspended") throw new HttpError(403, "FORBIDDEN", "정지된 계정입니다. 관리자에게 문의하세요.");
  if (user.status !== "active") throw unauthorized("이메일 또는 비밀번호가 일치하지 않습니다.");
  ok(res, await issueSession(user._id, req));
});

authRouter.post(ROUTES.auth.kakao, authLimiter, async (req, res) => {
  const { code, redirectUri } = parse(kakaoLoginRequest, req.body);
  const kakao = await fetchKakaoUser(code, redirectUri);

  let user = await User.findOne({ "identities.provider": "kakao", "identities.providerUserId": kakao.id }).lean();

  if (!user && kakao.email && kakao.emailVerified) {
    // 같은 이메일의 기존 계정이 있으면 카카오 인증을 연결한다 (카카오가 이메일 소유를 검증한 경우만)
    user = await User.findOneAndUpdate(
      { email: kakao.email, status: "active" },
      { $addToSet: { identities: { provider: "kakao", providerUserId: kakao.id } } },
      { new: true },
    ).lean();
  }

  if (!user) {
    const emailFree = kakao.email ? !(await User.exists({ email: kakao.email })) : false;
    const name = kakao.nickname ?? "카카오 사용자";
    const now = new Date();
    const created = await createOrganizationWithOwner({
      organizationName: `${name}의 워크스페이스`,
      user: {
        email: emailFree ? kakao.email : null,
        passwordHash: null,
        name,
        identities: [{ provider: "kakao", providerUserId: kakao.id }],
        // 카카오 로그인 동의 화면에서 필수 약관 동의를 받는 것을 전제로 한다
        agreements: { terms: now, privacy: now, marketing: null },
      },
    });
    user = created.user.toObject();
  }

  if (user.status !== "active") throw new HttpError(403, "FORBIDDEN", "사용할 수 없는 계정입니다.");
  ok(res, await issueSession(user._id, req));
});

authRouter.post(ROUTES.auth.refresh, authLimiter, async (req, res) => {
  const { refreshToken } = parse(refreshRequest, req.body);
  ok(res, await rotateRefreshToken(refreshToken));
});

authRouter.post(ROUTES.auth.logout, async (req, res) => {
  const { refreshToken } = parse(logoutRequest, req.body);
  await revokeRefreshToken(refreshToken);
  noContent(res);
});

/** web 에서 로그인한 사용자가 console 로 넘어갈 때 쓰는 1회용 코드 발급 */
authRouter.post(ROUTES.auth.handoff, requireAuth, async (req, res) => {
  const { userId } = authOf(req);
  const code = randomToken(32);
  await AuthHandoff.create({
    codeHash: sha256(code),
    userId,
    expiresAt: new Date(Date.now() + env.AUTH_HANDOFF_TTL_SECONDS * 1000),
  });
  ok(res, { code, expiresIn: env.AUTH_HANDOFF_TTL_SECONDS }, 201);
});

authRouter.post(ROUTES.auth.handoffExchange, authLimiter, async (req, res) => {
  const { code } = parse(handoffExchangeRequest, req.body);
  // 사용 표시를 조건부로 먼저 걸어 같은 코드를 두 번 쓰지 못하게 한다
  const handoff = await AuthHandoff.findOneAndUpdate(
    { codeHash: sha256(code), usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
  ).lean();
  if (!handoff) throw unauthorized("로그인 인계 코드가 만료되었습니다. 다시 로그인해주세요.");
  ok(res, await issueSession(handoff.userId, req));
});

authRouter.post(ROUTES.auth.findEmail, lookupLimiter, async (req, res) => {
  const { name, phone } = parse(findEmailRequest, req.body);
  const user = await User.findOne({ name, phone, status: "active", email: { $type: "string" } }).select("email").lean();
  if (!user?.email) throw notFound("일치하는 계정");
  ok(res, { maskedEmail: maskEmail(user.email) });
});
