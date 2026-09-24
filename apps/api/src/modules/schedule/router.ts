import { Router } from "express";
import { Types } from "mongoose";
import { ROUTES, createEventRequest, eventListQuery, objectId, updateEventRequest, upsertLabelRequest } from "@totem/shared";
import { z } from "zod";
import { badRequest, conflict, escapeRegex, noContent, notFound, ok, parse } from "../../lib/http";
import { ScheduleEvent, ScheduleLabel, Tour } from "../../db/models";
import { toScheduleEvent, toScheduleLabel } from "../../db/serialize";
import { authOf, objectIdParam, requireAuth } from "../../middlewares/auth";

export const scheduleRouter = Router();
scheduleRouter.use("/schedule", requireAuth);

async function assertRefs(organizationId: Types.ObjectId, labelId?: string | null, tourId?: string | null) {
  if (labelId && !(await ScheduleLabel.exists({ _id: labelId, organizationId }))) throw notFound("라벨");
  if (tourId && !(await Tour.exists({ _id: tourId, organizationId, deletedAt: null }))) throw notFound("투어");
}

const toOid = (v: string | null | undefined) => (v ? new Types.ObjectId(v) : v);

/* ───────── 라벨 ───────── */

scheduleRouter.get(ROUTES.schedule.labels, async (req, res) => {
  const { organizationId } = authOf(req);
  const [labels, counts] = await Promise.all([
    ScheduleLabel.find({ organizationId }).sort({ createdAt: 1 }).lean(),
    ScheduleEvent.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { organizationId, labelId: { $ne: null } } },
      { $group: { _id: "$labelId", n: { $sum: 1 } } },
    ]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  ok(res, labels.map((l) => toScheduleLabel(l, byId.get(String(l._id)) ?? 0)));
});

scheduleRouter.get(ROUTES.schedule.label(":id"), async (req, res) => {
  const { organizationId } = authOf(req);
  const label = await ScheduleLabel.findOne({ _id: objectIdParam(req.params.id, "라벨"), organizationId }).lean();
  if (!label) throw notFound("라벨");
  ok(res, toScheduleLabel(label, await ScheduleEvent.countDocuments({ organizationId, labelId: label._id })));
});

scheduleRouter.post(ROUTES.schedule.labels, async (req, res) => {
  const body = parse(upsertLabelRequest, req.body);
  const { organizationId } = authOf(req);
  if (await ScheduleLabel.exists({ organizationId, name: body.name })) throw conflict("같은 이름의 라벨이 이미 있습니다.");
  const label = await ScheduleLabel.create({ ...body, organizationId });
  ok(res, toScheduleLabel(label.toObject()), 201);
});

scheduleRouter.put(ROUTES.schedule.label(":id"), async (req, res) => {
  const body = parse(upsertLabelRequest, req.body);
  const { organizationId } = authOf(req);
  const id = objectIdParam(req.params.id, "라벨");
  if (await ScheduleLabel.exists({ organizationId, name: body.name, _id: { $ne: id } })) throw conflict("같은 이름의 라벨이 이미 있습니다.");
  const label = await ScheduleLabel.findOneAndUpdate({ _id: id, organizationId }, { $set: body }, { new: true, runValidators: true }).lean();
  if (!label) throw notFound("라벨");
  ok(res, toScheduleLabel(label, await ScheduleEvent.countDocuments({ organizationId, labelId: id })));
});

/** 사용 중인 라벨은 409. ?reassignTo=<labelId> 면 일정을 그 라벨로 옮긴 뒤 삭제, ?reassignTo=none 이면 라벨을 비운다 */
scheduleRouter.delete(ROUTES.schedule.label(":id"), async (req, res) => {
  const { organizationId } = authOf(req);
  const id = objectIdParam(req.params.id, "라벨");
  const { reassignTo } = parse(z.object({ reassignTo: z.union([objectId, z.literal("none")]).optional() }), req.query);
  if (!(await ScheduleLabel.exists({ _id: id, organizationId }))) throw notFound("라벨");

  const inUse = await ScheduleEvent.countDocuments({ organizationId, labelId: id });
  if (inUse > 0) {
    if (!reassignTo) throw conflict(`이 라벨을 쓰는 일정이 ${inUse}건 있습니다. 다른 라벨로 옮긴 뒤 삭제해주세요.`, { eventCount: inUse });
    if (reassignTo !== "none") {
      if (reassignTo === String(id)) throw badRequest("같은 라벨로는 옮길 수 없습니다.");
      await assertRefs(organizationId, reassignTo);
    }
    await ScheduleEvent.updateMany({ organizationId, labelId: id }, { $set: { labelId: reassignTo === "none" ? null : new Types.ObjectId(reassignTo) } });
  }
  await ScheduleLabel.deleteOne({ _id: id, organizationId });
  noContent(res);
});

/* ───────── 일정 ───────── */

/** 달력 표시 범위(from~to 와 겹치는 일정) + 검색어(이름·담당자·장소) */
scheduleRouter.get(ROUTES.schedule.events, async (req, res) => {
  const q = parse(eventListQuery, req.query);
  const { organizationId } = authOf(req);
  const filter: Record<string, unknown> = { organizationId };
  if (q.to) filter.startDate = { $lte: q.to };
  if (q.from) filter.endDate = { $gte: q.from };
  if (q.labelId) filter.labelId = new Types.ObjectId(q.labelId);
  if (q.q) {
    const rx = { $regex: escapeRegex(q.q), $options: "i" };
    filter.$or = [{ name: rx }, { manager: rx }, { "items.place": rx }];
  }
  const events = await ScheduleEvent.find(filter).sort({ startDate: 1, createdAt: 1 }).limit(1000).lean();
  ok(res, events.map(toScheduleEvent));
});

scheduleRouter.get(ROUTES.schedule.event(":id"), async (req, res) => {
  const event = await ScheduleEvent.findOne({ _id: objectIdParam(req.params.id, "일정"), organizationId: authOf(req).organizationId }).lean();
  if (!event) throw notFound("일정");
  ok(res, toScheduleEvent(event));
});

scheduleRouter.post(ROUTES.schedule.events, async (req, res) => {
  const body = parse(createEventRequest, req.body);
  const { organizationId, userId } = authOf(req);
  await assertRefs(organizationId, body.labelId, body.tourId);
  const event = await ScheduleEvent.create({
    ...body,
    labelId: toOid(body.labelId),
    tourId: toOid(body.tourId),
    organizationId,
    createdBy: userId,
  });
  ok(res, toScheduleEvent(event.toObject()), 201);
});

scheduleRouter.patch(ROUTES.schedule.event(":id"), async (req, res) => {
  const body = parse(updateEventRequest, req.body);
  const { organizationId } = authOf(req);
  const event = await ScheduleEvent.findOne({ _id: objectIdParam(req.params.id, "일정"), organizationId });
  if (!event) throw notFound("일정");
  await assertRefs(organizationId, body.labelId, body.tourId);
  const start = body.startDate ?? event.startDate;
  const end = body.endDate ?? event.endDate;
  if (start > end) throw badRequest("종료일은 시작일과 같거나 이후여야 합니다.");
  event.set({
    ...body,
    ...(body.labelId !== undefined && { labelId: toOid(body.labelId) }),
    ...(body.tourId !== undefined && { tourId: toOid(body.tourId) }),
  });
  await event.save();
  ok(res, toScheduleEvent(event.toObject()));
});

scheduleRouter.delete(ROUTES.schedule.event(":id"), async (req, res) => {
  const r = await ScheduleEvent.deleteOne({ _id: objectIdParam(req.params.id, "일정"), organizationId: authOf(req).organizationId });
  if (r.deletedCount === 0) throw notFound("일정");
  noContent(res);
});
