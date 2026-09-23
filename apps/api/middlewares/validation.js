// 날짜 형식 검증 (YYYY-MM-DD)
export const validateDate = (dateString) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// 제주도 좌표 범위 검증
export const validateJejuCoordinates = (mapX, mapY) => {
  return mapX >= 126.0 && mapX <= 127.0 && mapY >= 33.0 && mapY <= 34.0;
};

// 시간 형식 검증 (HH:MM~HH:MM 또는 (숙소))
export const validateTimeSlot = (timeSlot) => {
  const timeRegex = /^(\d{2}:\d{2}~\d{2}:\d{2}|\(숙소\))$/;
  return timeRegex.test(timeSlot);
};

// 코스 생성 요청 검증 미들웨어
export const validateCourseCreation = (req, res, next) => {
  const { title, startDate, endDate, pickupLocation, schedules } = req.body;

  // 필수 필드 검증
  if (!title || !startDate || !endDate || !pickupLocation) {
    return res.status(400).json({
      success: false,
      message:
        "필수 필드가 누락되었습니다. (title, startDate, endDate, pickupLocation)",
    });
  }

  // 날짜 형식 검증
  if (!validateDate(startDate) || !validateDate(endDate)) {
    return res.status(400).json({
      success: false,
      message: "날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용해주세요.",
    });
  }

  // 시작일과 종료일 비교
  if (new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({
      success: false,
      message: "종료일은 시작일보다 늦어야 합니다.",
    });
  }

  // 좌표 범위 검증 (제주도 내)
  if (schedules && schedules.length > 0) {
    for (const schedule of schedules) {
      if (schedule.places && schedule.places.length > 0) {
        for (const place of schedule.places) {
          if (!validateJejuCoordinates(place.mapX, place.mapY)) {
            return res.status(400).json({
              success: false,
              message: "좌표가 제주도 범위를 벗어났습니다.",
            });
          }
        }
      }
    }
  }

  next();
};

// 코스 수정 요청 검증 미들웨어
export const validateCourseUpdate = (req, res, next) => {
  const { startDate, endDate, schedules } = req.body;

  // 날짜 형식 검증
  if (startDate && !validateDate(startDate)) {
    return res.status(400).json({
      success: false,
      message:
        "시작일 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용해주세요.",
    });
  }

  if (endDate && !validateDate(endDate)) {
    return res.status(400).json({
      success: false,
      message:
        "종료일 형식이 올바르지 않습니다. YYYY-MM-DD 형식을 사용해주세요.",
    });
  }

  // 시작일과 종료일 비교
  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({
      success: false,
      message: "종료일은 시작일보다 늦어야 합니다.",
    });
  }

  // 좌표 범위 검증 (제주도 내)
  if (schedules && schedules.length > 0) {
    for (const schedule of schedules) {
      if (schedule.places && schedule.places.length > 0) {
        for (const place of schedule.places) {
          if (!validateJejuCoordinates(place.mapX, place.mapY)) {
            return res.status(400).json({
              success: false,
              message: "좌표가 제주도 범위를 벗어났습니다.",
            });
          }
        }
      }
    }
  }

  next();
};

// 페이지네이션 파라미터 검증
export const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: "페이지 번호는 1 이상이어야 합니다.",
    });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: "페이지 크기는 1 이상 100 이하여야 합니다.",
    });
  }

  req.pagination = { page, limit };
  next();
};
