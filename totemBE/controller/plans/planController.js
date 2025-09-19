import Plans from "../../models/plans/plansSchema.js";
import Course from "../../models/plans/plansSchema.js"; // TODO: Course는 별도 스키마에서 가져와야 함

export const createPlan = async (req, res) => {
  try {
    const ownerId = req.user._id;
    // 허용된 필드만 명시적으로 추출
    const { title, startDate, endDate, note, days } = req.body;

    const plan = await Plans.create({
      ownerId,
      title: title || "Untitled",
      startDate,
      endDate,
      note,
      days: days || [],
    });
    return res.status(201).json(plan);
  } catch (error) {
    console.error("Create plan error", error);
    return res.status(500).json({ message: "서버 오류" });
  }
};

export const getMyPlans = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const plans = await Plans.find({ ownerId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json(plans);
  } catch (error) {
    console.error("My plans error", error);
    return res.status(500).json({ message: "서버 오류" });
  }
};

export const getPlanById = async (req, res) => {
  try {
    const plan = await Plans.findOne({
      _id: req.params.planId,
      ownerId: req.user._id,
    }).lean();
    if (!plan) return res.status(404).json({ message: "Not Found" });
    return res.status(200).json(plan);
  } catch (error) {
    console.error("Plan detail error", error);
    return res.status(500).json({ message: "서버 오류" });
  }
};

export const updatePlan = async (req, res) => {
  try {
    // 허용된 필드만 명시적으로 추출
    const { title, startDate, endDate, note, days } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (note !== undefined) updateData.note = note;
    if (days !== undefined) updateData.days = days;

    const plan = await Plans.findOneAndUpdate(
      { _id: req.params.planId, ownerId: req.user._id },
      updateData,
      { new: true }
    );
    if (!plan) return res.status(404).json({ message: "Not Found" });
    return res.status(200).json(plan);
  } catch (error) {
    console.error("Plan update error", error);
    return res.status(500).json({ message: "서버 오류" });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const result = await Plans.deleteOne({
      _id: req.params.planId,
      ownerId: req.user._id,
    });
    if (result.deletedCount === 0)
      return res.status(404).json({ message: "Not Found" });
    return res.status(204).send();
  } catch (error) {
    console.error("Plan delete error", error);
    return res.status(500).json({ message: "서버 오류" });
  }
};

export const upsertPlanDays = async (req, res) => {
  try {
    const { days } = req.body;
    const plan = await Plans.findOne({
      _id: req.params.planId,
      ownerId: req.user._id,
    });
    if (!plan) return res.status(404).json({ message: "Not Found" });

    for (const day of days || []) {
      for (const item of day.items || []) {
        if (item.type === "hotel" && item.order !== 0) {
          return res.status(400).json({ message: "호텔은 order=0만 허용" });
        }
      }
    }

    plan.days = days || [];
    await plan.save();
    return res.status(200).json(plan);
  } catch (error) {
    console.error("Plan bulk upsert error", error);
    return res.status(500).json({ message: "서버 오류" });
  }
};

export const getPlanDay = async (req, res) => {
  try {
    const dayNumber = parseInt(req.params.day, 10);
    const plan = await Plans.findOne({
      _id: req.params.planId,
      ownerId: req.user._id,
    }).lean();
    if (!plan) return res.status(404).json({ message: "Not Found" });
    const day = (plan.days || []).find((d) => d.day === dayNumber);
    if (!day) return res.status(404).json({ message: "Day Not Found" });
    return res.status(200).json(day);
  } catch (error) {
    console.error("Plan day get error", error);
    return res.status(500).json({ message: "서버 오류" });
  }
};

export const updatePlanDay = async (req, res) => {
  try {
    const dayNumber = parseInt(req.params.day, 10);
    const plan = await Plans.findOne({
      _id: req.params.planId,
      ownerId: req.user._id,
    });
    if (!plan) return res.status(404).json({ message: "Not Found" });

    const idx = (plan.days || []).findIndex((d) => d.day === dayNumber);
    if (idx === -1) return res.status(404).json({ message: "Day Not Found" });

    for (const item of req.body.items || []) {
      if (item.type === "hotel" && item.order !== 0) {
        return res.status(400).json({ message: "호텔은 order=0만 허용" });
      }
    }

    // Object.assign을 사용하여 안전하게 업데이트
    Object.assign(plan.days[idx], req.body);
    await plan.save();
    return res.status(200).json(plan.days[idx]);
  } catch (error) {
    console.error("Plan day put error", error);
    return res.status(500).json({ message: "서버 오류" });
  }
};

export const deletePlanDay = async (req, res) => {
  try {
    const dayNumber = parseInt(req.params.day, 10);
    const plan = await Plans.findOne({
      _id: req.params.planId,
      ownerId: req.user._id,
    });
    if (!plan) return res.status(404).json({ message: "Not Found" });

    plan.days = (plan.days || []).filter((d) => d.day !== dayNumber);
    await plan.save();
    return res.status(204).send();
  } catch (error) {
    console.error("Plan day delete error", error);
    return res.status(500).json({ message: "서버 오류" });
  }
};

// ==================== 코스 관련 함수들 ====================

// 코스 생성
export const createCourse = async (req, res) => {
  try {
    const {
      title,
      startDate,
      endDate,
      pickupLocation,
      nation,
      age,
      numberOfPeople,
      note,
      timeSlots,
      schedules,
    } = req.body;
    const ownerId = req.user._id; // JWT에서 추출한 사용자 ID

    const course = new Course({
      title,
      startDate,
      endDate,
      pickupLocation,
      nation: nation || "Korea",
      age,
      numberOfPeople,
      note,
      timeSlots,
      schedules,
      ownerId,
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: "코스가 성공적으로 생성되었습니다.",
      data: course,
    });
  } catch (error) {
    console.error("코스 생성 오류:", error);
    res.status(500).json({
      success: false,
      message: "코스 생성 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 코스 조회 (단일)
export const getCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const ownerId = req.user._id;

    const course = await Course.findOne({ _id: courseId, ownerId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "코스를 찾을 수 없습니다.",
      });
    }

    // 조회 응답 형식으로 변환
    const responseData = {
      id: course._id,
      title: course.title,
      startDate: course.startDate,
      endDate: course.endDate,
      pickupLocation: course.pickupLocation,
      createdAt: course.createdAt,
      days: course.days || [],
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("코스 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "코스 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 코스 목록 조회 (페이지네이션)
export const getCourses = async (req, res) => {
  try {
    const ownerId = req.user._id;
    const { page, limit } = req.pagination || { page: 1, limit: 10 }; // 기본값 설정
    const skip = (page - 1) * limit;

    const courses = await Course.find({ ownerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title startDate endDate pickupLocation createdAt");

    const total = await Course.countDocuments({ ownerId });

    res.status(200).json({
      success: true,
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
    console.error("코스 목록 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "코스 목록 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 코스 수정
export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const ownerId = req.user._id;
    const updateData = req.body;

    const course = await Course.findOneAndUpdate(
      { _id: courseId, ownerId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "코스를 찾을 수 없습니다.",
      });
    }

    res.status(200).json({
      success: true,
      message: "코스가 성공적으로 수정되었습니다.",
      data: course,
    });
  } catch (error) {
    console.error("코스 수정 오류:", error);
    res.status(500).json({
      success: false,
      message: "코스 수정 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 코스 삭제
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const ownerId = req.user._id;

    const course = await Course.findOneAndDelete({ _id: courseId, ownerId });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "코스를 찾을 수 없습니다.",
      });
    }

    res.status(200).json({
      success: true,
      message: "코스가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("코스 삭제 오류:", error);
    res.status(500).json({
      success: false,
      message: "코스 삭제 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};
