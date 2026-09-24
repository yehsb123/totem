import { Router } from "express";
import { ROUTES, paginationQuery } from "@totem/shared";
import { ok, okPaged, parse } from "../../lib/http";
import { Payment, Subscription } from "../../db/models";
import { toBillingSummary, toPayment } from "../../db/serialize";
import { authOf, requireAuth } from "../../middlewares/auth";

/**
 * 설정 > 결제 정보. 실제 결제(PG 연동)는 범위 밖이라 조회만 제공한다.
 * 구독/결제 레코드는 PG 웹훅 또는 관리자 작업으로 쌓인다고 가정한다.
 */
export const billingRouter = Router();
billingRouter.use(ROUTES.billing.summary, requireAuth);

billingRouter.get(ROUTES.billing.summary, async (req, res) => {
  const sub = await Subscription.findOne({ organizationId: authOf(req).organizationId }).lean();
  ok(res, toBillingSummary(sub));
});

billingRouter.get(ROUTES.billing.payments, async (req, res) => {
  const { page, limit } = parse(paginationQuery, req.query);
  const filter = { organizationId: authOf(req).organizationId };
  const [items, total] = await Promise.all([
    Payment.find(filter).sort({ paidAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Payment.countDocuments(filter),
  ]);
  okPaged(res, items.map(toPayment), { page, limit, total });
});
