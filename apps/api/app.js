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
import planRouter from "./routes/plan/planRouter.js";
import { notFound, errorHandler } from "./middlewares/errorHandler.js";

dotenv.config();
connect();

const app = express();
const port = process.env.PORT || 8000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(helmet());
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/tour", tourRouter);
app.use("/api/tour", tourRouter);
app.use("/courses", coursesRouter);
app.use("/api/plan", planRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
