import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET || "dev_access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";

export const signAccessToken = (payload, options = {}) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: "1h", ...options });

export const signRefreshToken = (payload, options = {}) =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d", ...options });

export const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);
