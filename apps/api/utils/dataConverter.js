// 프론트엔드와 백엔드 데이터 구조 변환 함수들

/**
 * 프론트엔드 Spot → 백엔드 Place 변환
 */
export function convertSpotToPlace(spot, order, timeSlot) {
  return {
    order: order,
    contentId: spot.id || null,
    placeName: spot.title,
    placeAddress: spot.addr1,
    placeType: mapSpotTypeToPlaceType(spot.type),
    mapX: spot.mapX,
    mapY: spot.mapY,
    timeSlot: timeSlot || "시간 미정",
    activity: spot.title,
    firstImage: spot.firstImage || null,
    firstImage2: spot.firstImage2 || null,
    tel: spot.tel || null,
  };
}

/**
 * 백엔드 Place → 프론트엔드 Spot 변환
 */
export function convertPlaceToSpot(place) {
  return {
    id: place.contentId,
    title: place.placeName,
    addr1: place.placeAddress,
    mapX: place.mapX,
    mapY: place.mapY,
    type: mapPlaceTypeToSpotType(place.placeType),
    firstImage: place.firstImage,
    firstImage2: place.firstImage2,
    tel: place.tel,
  };
}

/**
 * 프론트엔드 DaySchedule → 백엔드 Schedule 변환
 */
export function convertDayScheduleToSchedule(daySchedule, dayNumber) {
  const places = daySchedule.slots
    .map((slot, index) => {
      if (!slot) return null;
      return convertSpotToPlace(slot, index, `시간대 ${index + 1}`);
    })
    .filter((place) => place !== null);

  return {
    day: dayNumber,
    date: daySchedule.date,
    places: places,
  };
}

/**
 * 백엔드 Schedule → 프론트엔드 DaySchedule 변환
 */
export function convertScheduleToDaySchedule(schedule, timeSlots) {
  const slots = new Array(timeSlots.length).fill(null);

  schedule.places.forEach((place) => {
    if (place.order < slots.length) {
      slots[place.order] = convertPlaceToSpot(place);
    }
  });

  return {
    date: schedule.date,
    slots: slots,
  };
}

/**
 * 프론트엔드 CreatedCourse → 백엔드 Course 변환
 */
export function convertCreatedCourseToCourse(createdCourse) {
  const schedules = createdCourse.schedules.map((daySchedule, index) =>
    convertDayScheduleToSchedule(daySchedule, index + 1)
  );

  return {
    id: createdCourse.id,
    title: createdCourse.courseName,
    startDate: createdCourse.startDate,
    endDate: createdCourse.endDate,
    pickupLocation: createdCourse.pickupLocation,
    schedules: schedules,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * 백엔드 Course → 프론트엔드 CreatedCourse 변환
 */
export function convertCourseToCreatedCourse(course, timeSlots) {
  const schedules = course.schedules.map((schedule) =>
    convertScheduleToDaySchedule(schedule, timeSlots)
  );

  return {
    id: course.id,
    courseName: course.title,
    startDate: course.startDate,
    endDate: course.endDate,
    pickupLocation: course.pickupLocation,
    schedules: schedules,
  };
}

/**
 * Spot 타입을 Place 타입으로 매핑
 */
function mapSpotTypeToPlaceType(spotType) {
  const typeMap = {
    hotel: "hotel",
    restaurant: "restaurant",
    cafe: "restaurant",
    attraction: "attraction",
    관광지: "attraction",
    문화시설: "culture",
    쇼핑: "shopping",
    레포츠: "nature",
    기타: "attraction",
  };
  return typeMap[spotType] || "attraction";
}

/**
 * Place 타입을 Spot 타입으로 매핑
 */
function mapPlaceTypeToSpotType(placeType) {
  const typeMap = {
    hotel: "hotel",
    restaurant: "restaurant",
    attraction: "attraction",
    culture: "관광지",
    shopping: "쇼핑",
    nature: "레포츠",
    airport: "기타",
  };
  return typeMap[placeType] || "attraction";
}

/**
 * 투어 API 데이터를 Spot으로 변환
 */
export function convertTourDataToSpot(tourData) {
  return {
    id: tourData.contentId,
    title: tourData.title,
    addr1: tourData.addr1,
    addr2: tourData.addr2 || "",
    mapX: tourData.mapX,
    mapY: tourData.mapY,
    firstImage: tourData.firstImage,
    firstImage2: tourData.firstImage2,
    mlevel: tourData.mlevel,
    tel: tourData.tel,
    zipcode: tourData.zipcode,
    type: mapContentTypeToSpotType(tourData.contentTypeId),
  };
}

/**
 * 투어 API contentTypeId를 Spot 타입으로 매핑
 */
function mapContentTypeToSpotType(contentTypeId) {
  const typeMap = {
    12: "attraction", // 관광지
    39: "restaurant", // 식당
    32: "hotel", // 숙소
    38: "shopping", // 쇼핑
    14: "culture", // 문화시설
    28: "nature", // 레포츠
  };
  return typeMap[contentTypeId] || "attraction";
}
