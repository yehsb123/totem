import { verifyAccessToken } from "../utils/jwt.js";

const authGuard = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default authGuard;
