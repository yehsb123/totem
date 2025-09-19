import mongoose from "mongoose";

// 장소 정보 스키마
const placeSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    contentId: { type: Number }, // 코스 생성 요청용
    placeName: { type: String, required: true },
    placeAddress: { type: String, required: true },
    placeType: {
      type: String,
      enum: [
        "attraction",
        "restaurant",
        "hotel",
        "shopping",
        "culture",
        "nature",
        "airport",
      ],
      required: true,
    },
    mapX: {
      type: Number,
      required: true,
      min: 126.0, // 제주도 경도 범위
      max: 127.0,
    },
    mapY: {
      type: Number,
      required: true,
      min: 33.0, // 제주도 위도 범위
      max: 34.0,
    },
    timeSlot: {
      type: String,
      match: /^(\d{2}:\d{2}~\d{2}:\d{2}|\(숙소\))$/, // 시간 형식 또는 (숙소) 검증
    },
    activity: {
      type: String,
      maxlength: 200, // 활동 설명
    },
  },
  {
    _id: true,
  }
);

// 일정 스키마 (코스 생성 요청용)
const scheduleSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD 형식 검증
    },
    places: [placeSchema],
  },
  {
    _id: true,
  }
);

// 일정 스키마 (코스 조회 응답용)
const daySchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    dayNumber: { type: Number, required: true },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD 형식 검증
    },
    places: [placeSchema],
  },
  {
    _id: true,
  }
);

// 코스 스키마
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    startDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    endDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },
    nation: {
      type: String,
      default: "Korea",
      enum: ["Korea", "Japan", "China", "USA", "Europe", "Other"],
    },
    age: {
      type: Number,
      min: 0,
      max: 100,
    },
    numberOfPeople: {
      type: Number,
      min: 1,
      max: 50,
    },
    note: {
      type: String,
      maxlength: 500,
    },
    timeSlots: [
      {
        type: String,
        match: /^(\d{2}:\d{2}~\d{2}:\d{2}|\(숙소\))$/,
      },
    ],
    schedules: [scheduleSchema],
    days: [daySchema],
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      index: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 인덱스 설정
courseSchema.index({ ownerId: 1, createdAt: -1 });
courseSchema.index({ startDate: 1, endDate: 1 });
courseSchema.index({ "places.mapX": 1, "places.mapY": 1 });

// 날짜 검증 미들웨어
courseSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    if (start >= end) {
      return next(new Error("종료일은 시작일보다 늦어야 합니다."));
    }
  }
  next();
});

export default mongoose.model("Courses", courseSchema, "courses");
