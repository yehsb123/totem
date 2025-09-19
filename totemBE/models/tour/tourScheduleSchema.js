import mongoose from "mongoose";

// 투어 일정 스키마
const tourScheduleSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD 형식
    },
    endDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD 형식
    },
    pickupLocation: {
      type: String,
      required: true,
      trim: true,
    },
    schedules: [
      {
        day: {
          type: Number,
          required: true,
          min: 1,
        },
        date: {
          type: String,
          required: true,
          match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD 형식
        },
        places: [
          {
            placeName: {
              type: String,
              required: true,
              trim: true,
            },
            timeSlot: {
              type: String,
              required: true,
              match: /^\d{2}:\d{2}-\d{2}:\d{2}$/, // HH:MM-HH:MM 형식
            },
            mapX: {
              type: Number,
              required: true,
            },
            mapY: {
              type: Number,
              required: true,
            },
            order: {
              type: Number,
              required: true,
              min: 1,
            },
          },
        ],
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "draft",
    },
    manager: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD 형식
    },
  },
  {
    timestamps: true, // MongoDB 자동 타임스탬프
  }
);

// 인덱스 설정
tourScheduleSchema.index({ id: 1 });
tourScheduleSchema.index({ startDate: 1, endDate: 1 });
tourScheduleSchema.index({ status: 1 });
tourScheduleSchema.index({ manager: 1 });
tourScheduleSchema.index({ title: "text" }); // 텍스트 검색용

export default mongoose.model(
  "TourSchedules",
  tourScheduleSchema,
  "tourSchedules"
);
