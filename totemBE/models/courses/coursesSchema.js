import mongoose from "mongoose";

// 장소 정보 스키마
const placeSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    contentId: { type: Number },
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
    mapX: { type: Number, required: true },
    mapY: { type: Number, required: true },
    timeSlot: { type: String },
    activity: { type: String, maxlength: 200 },
  },
  {
    _id: true,
  }
);

// 일정 스키마
const scheduleSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    date: { type: String, required: true },
    places: [placeSchema],
  },
  {
    _id: true,
  }
);

// 코스 스키마
const courseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    pickupLocation: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    schedules: [scheduleSchema],
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 관리
  }
);

// updatedAt 필드를 수동으로 업데이트하는 미들웨어
courseSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

courseSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
