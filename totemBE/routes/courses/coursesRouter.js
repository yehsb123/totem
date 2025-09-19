import express from "express";
import Course from "../../models/courses/coursesSchema.js";

const router = express.Router();

// 모든 코스 조회
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "코스 목록 조회 성공",
      courses: courses,
    });
  } catch (error) {
    console.error("코스 목록 조회 실패:", error.message);
    res.status(500).json({
      success: false,
      message: "코스 목록 조회 실패",
      error: error.message,
    });
  }
});

// 특정 코스 조회
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findOne({ id: req.params.id });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "코스를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "코스 조회 성공",
      course: course,
    });
  } catch (error) {
    console.error("코스 조회 실패:", error.message);
    res.status(500).json({
      success: false,
      message: "코스 조회 실패",
      error: error.message,
    });
  }
});

// 새 코스 생성
router.post("/", async (req, res) => {
  try {
    const courseData = req.body;

    // ID가 없으면 자동 생성
    if (!courseData.id) {
      courseData.id = Date.now().toString();
    }

    // updatedAt 설정
    courseData.updatedAt = new Date();

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
      error: error.message,
    });
  }
});

// 코스 수정
router.put("/:id", async (req, res) => {
  try {
    const courseData = req.body;
    courseData.updatedAt = new Date();

    const updatedCourse = await Course.findOneAndUpdate(
      { id: req.params.id },
      courseData,
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
      error: error.message,
    });
  }
});

// 코스 삭제
router.delete("/:id", async (req, res) => {
  try {
    const deletedCourse = await Course.findOneAndDelete({ id: req.params.id });

    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        message: "코스를 찾을 수 없습니다.",
      });
    }

    res.json({
      success: true,
      message: "코스 삭제 성공",
      course: deletedCourse,
    });
  } catch (error) {
    console.error("코스 삭제 실패:", error.message);
    res.status(500).json({
      success: false,
      message: "코스 삭제 실패",
      error: error.message,
    });
  }
});

// 코스 데이터 구조 조회 (실제 데이터 없이 구조만)
router.get("/structure", (req, res) => {
  const courseStructure = {
    courses: [
      {
        id: "1703123456789",
        title: "제주도 3일 여행",
        startDate: "2024-01-15",
        endDate: "2024-01-17",
        pickupLocation: "제주국제공항",
        createdAt: "2024-01-15T09:00:00Z",
        updatedAt: "2024-01-15T09:00:00Z",
        schedules: [
          {
            day: 1,
            date: "2024-01-15",
            places: [
              {
                order: 1,
                contentId: 12345,
                placeName: "한라산",
                placeAddress: "제주특별자치도 제주시",
                placeType: "attraction",
                mapX: 126.531188,
                mapY: 33.361666,
                timeSlot: "09:00~12:00",
                activity: "한라산 등반",
              },
            ],
          },
        ],
      },
    ],
  };

  res.json({
    success: true,
    message: "코스 데이터 구조",
    structure: courseStructure,
  });
});

export default router;
