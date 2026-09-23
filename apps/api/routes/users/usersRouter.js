import express from "express";
import authGuard from "../../middlewares/authGuard.js";
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  findEmail,
} from "../../controller/users/usersController.js";

const usersRouter = express.Router();

// 프로필 조회
usersRouter.get("/me", authGuard, getProfile);

// 프로필 수정
usersRouter.put("/me", authGuard, updateProfile);

// 비밀번호 변경
usersRouter.put("/me/password", authGuard, changePassword);

// 회원 탈퇴
usersRouter.delete("/me", authGuard, deleteAccount);

// 아이디 찾기 (비로그인)
usersRouter.post("/find-email", findEmail);

export default usersRouter;
