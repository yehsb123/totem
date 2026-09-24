import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { PAYMENT_STATUSES, PLAN_TIERS, SUBSCRIPTION_STATUSES } from "@totem/shared";

/** 조직당 1건 — 설정 > 결제 정보 상단 (구독 플랜·다음 결제일·결제 수단) */
const subscriptionSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, unique: true },
    plan: { type: String, enum: PLAN_TIERS, default: "free" },
    status: { type: String, enum: SUBSCRIPTION_STATUSES, default: "active" },
    currentPeriodEnd: { type: Date, default: null },
    /** PG 사 빌링키 등 민감정보는 저장하지 않고 표시용 정보만 둔다 */
    paymentMethod: {
      type: new Schema({ brand: String, last4: String }, { _id: false }),
      default: null,
    },
  },
  { timestamps: true },
);
export const Subscription = model("Subscription", subscriptionSchema, "subscriptions");
export type SubscriptionDoc = InferSchemaType<typeof subscriptionSchema> & { _id: Types.ObjectId };

/** 설정 > 결제 내역 표 */
const paymentSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    paidAt: { type: Date, required: true },
    product: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["KRW"], default: "KRW" },
    status: { type: String, enum: PAYMENT_STATUSES, required: true },
    /** PG 거래 ID (연동 시) */
    externalId: { type: String, default: null },
  },
  { timestamps: true },
);
paymentSchema.index({ organizationId: 1, paidAt: -1 });
export const Payment = model("Payment", paymentSchema, "payments");
export type PaymentDoc = InferSchemaType<typeof paymentSchema> & { _id: Types.ObjectId };
