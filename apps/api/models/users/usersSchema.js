import mongoose from "mongoose";

const usersSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    phone: {
      type: String,
      match: /^[0-9\-+() ]{8,20}$/,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },

    // --- [추가] SettingsPage의 '알림 설정'을 위한 필드 ---
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
    },

    // --- [추가] SettingsPage의 '결제 정보'를 위한 필드 ---
    billing: {
      subscriptionStatus: {
        type: String,
        enum: ["free", "premium"],
        default: "free",
      },
      nextBillingDate: Date,
    },
  },
  {
    // [추가 추천] 데이터 생성/수정 시간을 자동으로 기록합니다.
    timestamps: true,
  }
);

export default mongoose.model("Users", usersSchema, "users");
