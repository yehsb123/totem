import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connect from "./connect/connect.js";
import usersRouter from "./routes/users/usersRouter.js";
import tourRouter from "./routes/tour/tourRouter.js";
import coursesRouter from "./routes/courses/coursesRouter.js";
import authRouter from "./routes/auth/authRouter.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();
connect();

const app = express();
const port = process.env.PORT || 8000;

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(helmet());
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/users", usersRouter);
app.use("/tour", tourRouter);
app.use("/api/tour", tourRouter); // 프론트엔드 호환성을 위한 추가 경로
app.use("/auth", authRouter);
app.use("/courses", coursesRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
