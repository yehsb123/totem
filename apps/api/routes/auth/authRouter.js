import express from "express";
import { register, login } from "../../controller/users/usersController.js";
import {
  signAccessToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import rateLimit from "express-rate-limit";

const authRouter = express.Router();

// 인증 엔드포인트 전용 rate limit (5분 내 20회)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { success: false, message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
});

authRouter.post("/signup", authLimiter, register);
authRouter.post("/login", authLimiter, login);

authRouter.post("/refresh", (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken)
    return res.status(400).json({ message: "refreshToken 필요" });
  try {
    const decoded = verifyRefreshToken(refreshToken);
    // iat, exp 제거 후 새 토큰 발급
    const { iat, exp, ...payload } = decoded;
    const accessToken = signAccessToken(payload);
    return res.status(200).json({ accessToken });
  } catch (e) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

authRouter.post("/logout", (_req, res) => {
  // 클라이언트에서 토큰 삭제 처리
  return res.status(200).json({ success: true, message: "로그아웃 되었습니다." });
});

export default authRouter;
