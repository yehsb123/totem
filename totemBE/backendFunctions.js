// 백엔드 함수들을 프론트엔드에서 직접 사용할 수 있도록 export

import Course from "./models/courses/coursesSchema.js";
import Tour from "./models/tour/tourSchema.js";
import TourSchedule from "./models/tour/tourScheduleSchema.js";
import User from "./models/users/usersSchema.js";
import Plan from "./models/plans/plansSchema.js";
import {
  convertCreatedCourseToCourse,
  convertCourseToCreatedCourse,
  convertTourDataToSpot,
} from "./utils/dataConverter.js";

// ==================== 코스 관련 함수들 ====================

/**
 * 모든 코스 조회
 */
export async function getAllCourses() {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });
    return {
      success: true,
      message: "코스 목록 조회 성공",
      courses: courses,
    };
  } catch (error) {
    console.error("코스 목록 조회 실패:", error.message);
    return {
      success: false,
      message: "코스 목록 조회 실패",
      error: error.message,
    };
  }
}

/**
 * 특정 코스 조회
 */
export async function getCourseById(courseId) {
  try {
    const course = await Course.findOne({ id: courseId });

    if (!course) {
      return {
        success: false,
        message: "코스를 찾을 수 없습니다.",
      };
    }

    return {
      success: true,
      message: "코스 조회 성공",
      course: course,
    };
  } catch (error) {
    console.error("코스 조회 실패:", error.message);
    return {
      success: false,
      message: "코스 조회 실패",
      error: error.message,
    };
  }
}

/**
 * 코스 생성
 */
export async function createCourse(courseData) {
  try {
    // ID가 없으면 자동 생성
    if (!courseData.id) {
      courseData.id = Date.now().toString();
    }

    // updatedAt 설정
    courseData.updatedAt = new Date();

    const newCourse = new Course(courseData);
    const savedCourse = await newCourse.save();

    return {
      success: true,
      message: "코스 생성 성공",
      course: savedCourse,
    };
  } catch (error) {
    console.error("코스 생성 실패:", error.message);
    return {
      success: false,
      message: "코스 생성 실패",
      error: error.message,
    };
  }
}

/**
 * 코스 수정
 */
export async function updateCourse(courseId, courseData) {
  try {
    courseData.updatedAt = new Date();

    const updatedCourse = await Course.findOneAndUpdate(
      { id: courseId },
      courseData,
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return {
        success: false,
        message: "코스를 찾을 수 없습니다.",
      };
    }

    return {
      success: true,
      message: "코스 수정 성공",
      course: updatedCourse,
    };
  } catch (error) {
    console.error("코스 수정 실패:", error.message);
    return {
      success: false,
      message: "코스 수정 실패",
      error: error.message,
    };
  }
}

/**
 * 코스 삭제
 */
export async function deleteCourse(courseId) {
  try {
    const deletedCourse = await Course.findOneAndDelete({ id: courseId });

    if (!deletedCourse) {
      return {
        success: false,
        message: "코스를 찾을 수 없습니다.",
      };
    }

    return {
      success: true,
      message: "코스 삭제 성공",
      course: deletedCourse,
    };
  } catch (error) {
    console.error("코스 삭제 실패:", error.message);
    return {
      success: false,
      message: "코스 삭제 실패",
      error: error.message,
    };
  }
}

// ==================== 투어 관련 함수들 ====================

/**
 * 투어 API에서 데이터 조회
 */
export async function getTourSpots(params = {}) {
  try {
    const url = `https://apis.data.go.kr/B551011/KorService1/locationBasedList2`;
    const TOUR_API_KEY =
      "1f46e0bb380d5373f0a3dcdb1bdebd8bac6164db40860ac66d73fb94be0a93fe";

    const requestParams = {
      serviceKey: TOUR_API_KEY,
      MobileOS: "WEB",
      MobileApp: "ToTem",
      _type: "json",
      mapX: "126.531188", // 제주도 경도
      mapY: "33.361666", // 제주도 위도
      radius: "20000", // 20km 반경
      numOfRows: params.numOfRows || "10",
      pageNo: params.pageNo || "1",
      arrange: "A",
      ...params,
    };

    const response = await fetch(
      url + "?" + new URLSearchParams(requestParams)
    );
    const data = await response.json();

    if (data.response?.body?.items?.item) {
      const items = Array.isArray(data.response.body.items.item)
        ? data.response.body.items.item
        : [data.response.body.items.item];

      const spots = items.map(convertTourDataToSpot);

      return {
        success: true,
        data: spots,
        totalCount: data.response.body.totalCount || items.length,
      };
    } else {
      return {
        success: false,
        message: "투어 데이터를 찾을 수 없습니다.",
        data: [],
      };
    }
  } catch (error) {
    console.error("투어 API 호출 실패:", error.message);
    return {
      success: false,
      message: "투어 API 호출 실패",
      error: error.message,
    };
  }
}

/**
 * 데이터베이스에서 모든 관광지 조회
 */
export async function getAllTourSpotsFromDB(params = {}) {
  try {
    const { page = 1, limit = 10, search = "" } = params;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { addr1: { $regex: search, $options: "i" } },
        ],
      };
    }

    const [tours, totalCount] = await Promise.all([
      Tour.find(query).skip(skip).limit(parseInt(limit)).sort({ contentId: 1 }),
      Tour.countDocuments(query),
    ]);

    const spots = tours.map(convertTourDataToSpot);

    return {
      success: true,
      data: spots,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + tours.length < totalCount,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("데이터베이스 조회 오류:", error.message);
    return {
      success: false,
      error: "관광지 데이터 조회 실패",
    };
  }
}

// ==================== 투어 일정 관련 함수들 ====================

/**
 * 모든 투어 조회
 */
export async function getAllTours(params = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      manager = "",
    } = params;
    const skip = (page - 1) * limit;

    // 검색 조건
    let query = {};
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    if (status) {
      query.status = status;
    }
    if (manager) {
      query.manager = { $regex: manager, $options: "i" };
    }

    const [tours, totalCount] = await Promise.all([
      TourSchedule.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      TourSchedule.countDocuments(query),
    ]);

    return {
      success: true,
      message: "투어 목록 조회 성공",
      data: {
        tours,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: skip + tours.length < totalCount,
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    console.error("투어 목록 조회 실패:", error.message);
    return {
      success: false,
      message: "투어 목록 조회 실패",
      error: error.message,
    };
  }
}

/**
 * 특정 투어 조회
 */
export async function getTourById(tourId) {
  try {
    const tour = await TourSchedule.findOne({ id: parseInt(tourId) });

    if (!tour) {
      return {
        success: false,
        message: "투어를 찾을 수 없습니다",
      };
    }

    return {
      success: true,
      message: "투어 조회 성공",
      data: tour,
    };
  } catch (error) {
    console.error("투어 조회 실패:", error.message);
    return {
      success: false,
      message: "투어 조회 실패",
      error: error.message,
    };
  }
}

/**
 * 투어 생성
 */
export async function createTour(tourData) {
  try {
    // ID 자동 생성 (현재 시간 기반)
    const id = Date.now();

    const newTourData = {
      ...tourData,
      id,
      createdAt: new Date().toISOString().split("T")[0], // YYYY-MM-DD 형식
    };

    const newTour = new TourSchedule(newTourData);
    const savedTour = await newTour.save();

    return {
      success: true,
      message: "투어 생성 성공",
      data: savedTour,
    };
  } catch (error) {
    console.error("투어 생성 실패:", error.message);
    return {
      success: false,
      message: "투어 생성 실패",
      error: error.message,
    };
  }
}

/**
 * 투어 수정
 */
export async function updateTour(tourId, updateData) {
  try {
    const updatedTour = await TourSchedule.findOneAndUpdate(
      { id: parseInt(tourId) },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTour) {
      return {
        success: false,
        message: "투어를 찾을 수 없습니다",
      };
    }

    return {
      success: true,
      message: "투어 수정 성공",
      data: updatedTour,
    };
  } catch (error) {
    console.error("투어 수정 실패:", error.message);
    return {
      success: false,
      message: "투어 수정 실패",
      error: error.message,
    };
  }
}

/**
 * 투어 삭제
 */
export async function deleteTour(tourId) {
  try {
    const deletedTour = await TourSchedule.findOneAndDelete({
      id: parseInt(tourId),
    });

    if (!deletedTour) {
      return {
        success: false,
        message: "투어를 찾을 수 없습니다",
      };
    }

    return {
      success: true,
      message: "투어 삭제 성공",
      data: deletedTour,
    };
  } catch (error) {
    console.error("투어 삭제 실패:", error.message);
    return {
      success: false,
      message: "투어 삭제 실패",
      error: error.message,
    };
  }
}

// ==================== 사용자 관련 함수들 ====================

/**
 * 사용자 등록
 */
export async function registerUser(userData) {
  try {
    const newUser = new User(userData);
    const savedUser = await newUser.save();

    return {
      success: true,
      message: "사용자 등록 성공",
      user: savedUser,
    };
  } catch (error) {
    console.error("사용자 등록 실패:", error.message);
    return {
      success: false,
      message: "사용자 등록 실패",
      error: error.message,
    };
  }
}

/**
 * 사용자 로그인
 */
export async function loginUser(credentials) {
  try {
    const user = await User.findOne({ email: credentials.email });

    if (!user) {
      return {
        success: false,
        message: "사용자를 찾을 수 없습니다.",
      };
    }

    // 비밀번호 검증 (bcrypt 사용)
    const bcrypt = await import("bcrypt");
    const isValidPassword = await bcrypt.compare(
      credentials.password,
      user.password
    );

    if (!isValidPassword) {
      return {
        success: false,
        message: "비밀번호가 일치하지 않습니다.",
      };
    }

    return {
      success: true,
      message: "로그인 성공",
      user: user,
    };
  } catch (error) {
    console.error("로그인 실패:", error.message);
    return {
      success: false,
      message: "로그인 실패",
      error: error.message,
    };
  }
}

// ==================== 데이터 변환 헬퍼 함수들 ====================

/**
 * 프론트엔드 CreatedCourse를 백엔드 Course로 변환하여 저장
 */
export async function saveCreatedCourse(createdCourse) {
  try {
    const courseData = convertCreatedCourseToCourse(createdCourse);
    const result = await createCourse(courseData);
    return result;
  } catch (error) {
    console.error("코스 저장 실패:", error.message);
    return {
      success: false,
      message: "코스 저장 실패",
      error: error.message,
    };
  }
}

/**
 * 백엔드 Course를 프론트엔드 CreatedCourse로 변환하여 반환
 */
export async function getCreatedCourse(courseId, timeSlots) {
  try {
    const result = await getCourseById(courseId);
    if (!result.success) {
      return result;
    }

    const createdCourse = convertCourseToCreatedCourse(
      result.course,
      timeSlots
    );
    return {
      success: true,
      message: "코스 조회 성공",
      course: createdCourse,
    };
  } catch (error) {
    console.error("코스 조회 실패:", error.message);
    return {
      success: false,
      message: "코스 조회 실패",
      error: error.message,
    };
  }
}
