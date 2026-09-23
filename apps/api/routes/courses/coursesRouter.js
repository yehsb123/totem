import express from "express";
import Course from "../../models/plans/plansSchema.js";
import authGuard from "../../middlewares/authGuard.js";
import { validatePagination } from "../../middlewares/validation.js";

const router = express.Router();

// 모든 코스 조회 (본인 것만, 페이지네이션)
router.get("/", authGuard, validatePagination, async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { page, limit } = req.pagination;
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find({ ownerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("title startDate endDate pickupLocation createdAt"),
      Course.countDocuments({ ownerId }),
    ]);

    res.json({
      success: true,
      message: "코스 목록 조회 성공",
      data: {
        courses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error("코스 목록 조회 실패:", error.message);
    res.status(500).json({
      success: false,
      message: "코스 목록 조회 실패",
    });
  }
});

// 특정 코스 조회
router.get("/:id", authGuard, async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "코스를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "코스 조회 성공",
      course,
    });
  } catch (error) {
    console.error("코스 조회 실패:", error.message);
    res.status(500).json({
      success: false,
      message: "코스 조회 실패",
    });
  }
});

// 새 코스 생성
router.post("/", authGuard, async (req, res) => {
  try {
    const courseData = req.body;
    courseData.ownerId = req.user._id;

    const newCourse = new Course(courseData);
    const savedCourse = await newCourse.save();

    res.status(201).json({
      success: true,
      message: "코스 생성 성공",
      course: savedCourse,
    });
  } catch (error) {
    console.error("코스 생성 실패:", error.message);
    res.status(500).json({
      success: false,
      message: "코스 생성 실패",
    });
  }
});

// 코스 수정
router.put("/:id", authGuard, async (req, res) => {
  try {
    const updatedCourse = await Course.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: "코스를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "코스 수정 성공",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("코스 수정 실패:", error.message);
    res.status(500).json({
      success: false,
      message: "코스 수정 실패",
    });
  }
});

// 코스 삭제
router.delete("/:id", authGuard, async (req, res) => {
  try {
    const deletedCourse = await Course.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user._id,
    });

    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        message: "코스를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "코스 삭제 성공",
    });
  } catch (error) {
    console.error("코스 삭제 실패:", error.message);
    res.status(500).json({
      success: false,
      message: "코스 삭제 실패",
    });
  }
});

export default router;
