// DND 관련 타입 정의
export const ItemTypes = {
  TOUR_PLACE: "tour_place", // TourList에서 드래그되는 장소
  SCHEDULED_PLACE: "scheduled_place", // 스케줄 내에서 드래그되는 장소 (재정렬용)
};

// 각 일차의 스케줄을 나타내는 인터페이스
export interface DaySchedule {
  date: string; // "YYYY-MM-DD" 형식의 날짜
  slots: (import("./tourapidata").TourPlace | null)[]; // 각 시간대에 할당된 장소 (또는 null)
}

// 새로 생성될 코스의 전체 구조를 위한 인터페이스
export interface CreatedCourse {
  id: string; // 고유 ID 추가 (저장 및 관리를 위해 필요)
  courseName: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  schedules: DaySchedule[];
}
