import express from "express";
import { register, login } from "../../controller/users/usersController.js";

const usersRouter = express.Router();

usersRouter.post("/register", register);
usersRouter.post("/login", login);

export default usersRouter;

//회원정보 수정
// usersRouter.put(
//   "/modify",
//   passport.authenticate("jwt", { session: false }),
//   modify
// );

//회원탈퇴
// usersRouter.delete(
//   "/remove",
//   passport.authenticate("jwt", { session: false }),
//   remove
// );

//아이디 찾기
// usersRouter.post("/find-id", findId);

// 프로필 변경
// usersRouter.post(
//   "/picture",
//   passport.authenticate("jwt", { session: false }),
//   uploadMiddleWare,
//   updatePicture
// );
