import { Router } from "express";
import { ROUTES, createTourRequest, tourListQuery, updateTourRequest } from "@totem/shared";
import { badRequest, escapeRegex, noContent, notFound, ok, okPaged, parse } from "../../lib/http";
import { Course, ScheduleEvent, Tour } from "../../db/models";
import { toTour } from "../../db/serialize";
import { authOf, objectIdParam, requireAuth } from "../../middlewares/auth";

export const toursRouter = Router();
toursRouter.use(ROUTES.tours.list, requireAuth);

const alive = { deletedAt: null };

/** 투어관리 표 — 투어명 검색, 날짜(그날 진행 중), 타입, 상태 */
toursRouter.get(ROUTES.tours.list, async (req, res) => {
  const q = parse(tourListQuery, req.query);
  const filter: Record<string, unknown> = { organizationId: authOf(req).organizationId, ...alive };
  if (q.q) filter.title = { $regex: escapeRegex(q.q), $options: "i" };
  if (q.date) Object.assign(filter, { startDate: { $lte: q.date }, endDate: { $gte: q.date } });
  if (q.type) filter.type = q.type;
  if (q.status) filter.status = q.status;
  const [items, total] = await Promise.all([
    Tour.find(filter).sort({ startDate: -1, createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
    Tour.countDocuments(filter),
  ]);
  okPaged(res, items.map(toTour), { page: q.page, limit: q.limit, total });
});

/** 타입 필터 드롭다운 항목 (조직에서 실제로 쓰는 값) */
toursRouter.get(ROUTES.tours.types, async (req, res) => {
  const types = await Tour.distinct("type", { organizationId: authOf(req).organizationId, ...alive });
  ok(res, (types as string[]).filter(Boolean).sort((a, b) => a.localeCompare(b, "ko")));
});

toursRouter.get(ROUTES.tours.detail(":id"), async (req, res) => {
  const tour = await Tour.findOne({ _id: objectIdParam(req.params.id, "투어"), organizationId: authOf(req).organizationId, ...alive }).lean();
  if (!tour) throw notFound("투어");
  ok(res, toTour(tour));
});

toursRouter.post(ROUTES.tours.list, async (req, res) => {
  const body = parse(createTourRequest, req.body);
  const { organizationId, userId } = authOf(req);
  if (body.courseId && !(await Course.exists({ _id: body.courseId, organizationId, ...alive }))) throw notFound("코스");
  const tour = await Tour.create({ ...body, organizationId, createdBy: userId });
  ok(res, toTour(tour.toObject()), 201);
});

/** 표 인라인 수정(상태 드롭다운·좌석 입력). 기존 값과 합친 결과로 날짜·좌석 규칙을 다시 검증한다 */
toursRouter.patch(ROUTES.tours.detail(":id"), async (req, res) => {
  const body = parse(updateTourRequest, req.body);
  const { organizationId } = authOf(req);
  const tour = await Tour.findOne({ _id: objectIdParam(req.params.id, "투어"), organizationId, ...alive });
  if (!tour) throw notFound("투어");
  if (body.courseId && !(await Course.exists({ _id: body.courseId, organizationId, ...alive }))) throw notFound("코스");

  const merged = { ...tour.toObject(), ...body };
  if (merged.startDate > merged.endDate) throw badRequest("종료일은 시작일과 같거나 이후여야 합니다.");
  if (merged.bookedSeats > merged.capacity) throw badRequest("예약 인원이 예상 인원을 초과할 수 없습니다.");

  tour.set(body);
  await tour.save();
  ok(res, toTour(tour.toObject()));
});

/** 삭제 표시 + 이 투어에 걸린 일정의 연결만 끊는다 (일정 자체는 남긴다) */
toursRouter.delete(ROUTES.tours.detail(":id"), async (req, res) => {
  const { organizationId } = authOf(req);
  const id = objectIdParam(req.params.id, "투어");
  const r = await Tour.updateOne({ _id: id, organizationId, ...alive }, { $set: { deletedAt: new Date() } });
  if (r.matchedCount === 0) throw notFound("투어");
  await ScheduleEvent.updateMany({ organizationId, tourId: id }, { $set: { tourId: null } });
  noContent(res);
});
