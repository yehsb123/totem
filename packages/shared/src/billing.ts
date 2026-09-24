import { z } from "zod";
import { baseEntity, isoDateTime } from "./common";
import { PAYMENT_STATUSES, PLAN_TIERS, SUBSCRIPTION_STATUSES } from "./enums";

/** GET /billing — 설정 > 결제 정보 상단(구독 플랜·다음 결제일·결제 수단) */
export const billingSummary = z.object({
  plan: z.enum(PLAN_TIERS),
  subscriptionStatus: z.enum(SUBSCRIPTION_STATUSES),
  nextBillingDate: isoDateTime.nullable(),
  paymentMethod: z
    .object({
      brand: z.string(),
      last4: z.string().length(4),
    })
    .nullable(),
});
export type BillingSummary = z.infer<typeof billingSummary>;

/** GET /billing/payments — 설정 > 결제 내역 표 */
export const payment = baseEntity.extend({
  paidAt: isoDateTime,
  product: z.string(),
  amount: z.number().int(),
  currency: z.literal("KRW"),
  status: z.enum(PAYMENT_STATUSES),
});
export type Payment = z.infer<typeof payment>;
