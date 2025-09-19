import express from "express";
import usersRouter from "./user/userRouter.js";

const rootRouter = express.Router();

rootRouter.use("/users", usersRouter);

export default rootRouter;
