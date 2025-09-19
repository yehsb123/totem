import express from "express";
import { register, login } from "../../controller/users/usersController.js";
import { signAccessToken, verifyRefreshToken } from "../../utils/jwt.js";

const authRouter = express.Router();

authRouter.post("/signup", register);
authRouter.post("/login", login);

authRouter.post("/refresh", (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken)
    return res.status(400).json({ message: "refreshToken 필요" });
  try {
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken(payload);
    return res.status(200).json({ accessToken });
  } catch (e) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

authRouter.post("/logout", (_req, res) => {
  return res.status(200).json({ message: "ok" });
});

export default authRouter;
