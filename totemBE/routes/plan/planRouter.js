import express from "express";
import authGuard from "../../middlewares/authGuard.js";
import {
  validateCourseCreation,
  validateCourseUpdate,
  validatePagination,
} from "../../middlewares/validation.js";
import {
  createPlan,
  getMyPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  upsertPlanDays,
  getPlanDay,
  updatePlanDay,
  deletePlanDay,
  // 코스 관련 함수들
  createCourse,
  getCourse,
  getCourses,
  updateCourse,
  deleteCourse,
} from "../../controller/plans/planController.js";

const planRouter = express.Router();

// POST /api/plan/v1
planRouter.post("/v1", authGuard, createPlan);

// GET /api/plan/my
planRouter.get("/my", authGuard, getMyPlans);

// GET /api/plan/:planId/v1
planRouter.get("/:planId/v1", authGuard, getPlanById);

// PUT /api/plan/:planId/v1
planRouter.put("/:planId/v1", authGuard, updatePlan);

// DELETE /api/plan/:planId/v1
planRouter.delete("/:planId/v1", authGuard, deletePlan);

// POST /api/plan/:planId/date/v1 (bulk upsert days+items)
planRouter.post("/:planId/date/v1", authGuard, upsertPlanDays);

// GET /api/plan/:planId/date/:day/v1
planRouter.get("/:planId/date/:day/v1", authGuard, getPlanDay);

// PUT /api/plan/:planId/date/:day/v1
planRouter.put("/:planId/date/:day/v1", authGuard, updatePlanDay);

// DELETE /api/plan/:planId/date/:day/v1
planRouter.delete("/:planId/date/:day/v1", authGuard, deletePlanDay);

// ==================== 코스 관련 라우터 ====================

// POST /api/plan/courses/v1 - 코스 생성
planRouter.post("/courses/v1", authGuard, validateCourseCreation, createCourse);

// GET /api/plan/courses/v1 - 코스 목록 조회 (페이지네이션)
planRouter.get("/courses/v1", authGuard, validatePagination, getCourses);

// GET /api/plan/courses/:courseId/v1 - 코스 상세 조회
planRouter.get("/courses/:courseId/v1", authGuard, getCourse);

// PUT /api/plan/courses/:courseId/v1 - 코스 수정
planRouter.put(
  "/courses/:courseId/v1",
  authGuard,
  validateCourseUpdate,
  updateCourse
);

// DELETE /api/plan/courses/:courseId/v1 - 코스 삭제
planRouter.delete("/courses/:courseId/v1", authGuard, deleteCourse);

export default planRouter;
