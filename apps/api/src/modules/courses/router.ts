import { Router } from "express";
import { Types } from "mongoose";
import { HOTEL_SLOT_INDEX, ROUTES, courseListQuery, createCourseRequest, updateCourseRequest, type CourseDay } from "@totem/shared";
import { conflict, escapeRegex, noContent, notFound, ok, okPaged, parse } from "../../lib/http";
import { Course, Place, ScheduleEvent, ScheduleLabel, Tour } from "../../db/models";
import { toCourse, toCourseSummary, toTour } from "../../db/serialize";
import { authOf, objectIdParam, requireAuth } from "../../middlewares/auth";

export const coursesRouter = Router();
coursesRouter.use(ROUTES.courses.list, requireAuth);

const alive = { deletedAt: null };

function toDbDays(days: CourseDay[]) {
  return days.map((d) => ({
    ...d,
    slots: [...d.slots]
      .sort((a, b) => a.slotIndex - b.slotIndex)
      .map((s) => ({ ...s, place: { ...s.place, placeId: s.place.placeId ? new Types.ObjectId(s.place.placeId) : null } })),
  }));
}

/** 코스에 담긴 장소의 인기 지표를 올린다 (코스메이커 "인기순/외국인 인기순" 정렬의 근거) */
async function bumpPopularity(days: CourseDay[], nation: string) {
  const ids = [...new Set(days.flatMap((d) => d.slots.map((s) => s.place.placeId)).filter((v): v is string => !!v))];
  if (!ids.length) return;
  const field = nation === "KR" ? "popularity" : "foreignPopularity";
  await Place.updateMany({ _id: { $in: ids.map((i) => new Types.ObjectId(i)) } }, { $inc: { [field]: 1 } });
}

coursesRouter.get(ROUTES.courses.list, async (req, res) => {
  const q = parse(courseListQuery, req.query);
  const filter: Record<string, unknown> = { organizationId: authOf(req).organizationId, ...alive };
  if (q.q) filter.title = { $regex: escapeRegex(q.q), $options: "i" };
  const [items, total] = await Promise.all([
    Course.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
    Course.countDocuments(filter),
  ]);
  const counts = await Tour.aggregate<{ _id: Types.ObjectId; n: number }>([
    { $match: { organizationId: filter.organizationId, courseId: { $in: items.map((c) => c._id) }, ...alive } },
    { $group: { _id: "$courseId", n: { $sum: 1 } } },
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  okPaged(res, items.map((c) => toCourseSummary(c, byId.get(String(c._id)) ?? 0)), { page: q.page, limit: q.limit, total });
});

coursesRouter.get(ROUTES.courses.detail(":id"), async (req, res) => {
  const { organizationId } = authOf(req);
  const course = await Course.findOne({ _id: objectIdParam(req.params.id, "코스"), organizationId, ...alive }).lean();
  if (!course) throw notFound("코스");
  const tours = await Tour.find({ organizationId, courseId: course._id, ...alive }).select("_id").lean();
  ok(res, toCourse(course, tours.map((t) => t._id)));
});

/** 코스메이커 "코스 생성 완료" — tour 옵션이 있으면 투어관리에 바로 올린다 */
coursesRouter.post(ROUTES.courses.list, async (req, res) => {
  const { tour: tourOptions, ...body } = parse(createCourseRequest, req.body);
  const { organizationId, userId } = authOf(req);
  const course = await Course.create({ ...body, days: toDbDays(body.days), organizationId, createdBy: userId });
  await bumpPopularity(body.days, body.nation);

  let tour = null;
  if (tourOptions) {
    tour = await Tour.create({
      organizationId,
      courseId: course._id,
      title: body.title,
      type: tourOptions.type,
      nation: body.nation,
      startDate: body.startDate,
      endDate: body.endDate,
      managerName: tourOptions.managerName,
      capacity: tourOptions.capacity,
      note: body.note,
      createdBy: userId,
    });
    // 투어로 등록한 코스는 일정관리 달력에도 바로 보이게 한다 (첫날 일정의 시간대를 세부 일정으로)
    const label = await ScheduleLabel.findOne({ organizationId, name: "투어" }).select("_id").lean();
    const firstDay = body.days[0];
    await ScheduleEvent.create({
      organizationId,
      createdBy: userId,
      labelId: label?._id ?? null,
      tourId: tour._id,
      name: body.title,
      startDate: body.startDate,
      endDate: body.endDate,
      manager: tourOptions.managerName,
      items: (firstDay?.slots ?? [])
        .filter((s) => s.slotIndex !== HOTEL_SLOT_INDEX)
        .slice(0, 50)
        .map((s) => ({ time: body.timeSlots[s.slotIndex]?.slice(0, 5) ?? "09:00", place: s.place.title })),
      note: body.pickupLocation ? `픽업: ${body.pickupLocation}` : "",
    });
  }
  ok(res, { course: toCourse(course.toObject(), tour ? [tour._id] : []), tour: tour ? toTour(tour.toObject()) : null }, 201);
});

/** 드래그 편집 결과를 통째로 교체 저장 */
coursesRouter.put(ROUTES.courses.detail(":id"), async (req, res) => {
  const body = parse(updateCourseRequest, req.body);
  const { organizationId } = authOf(req);
  const course = await Course.findOneAndUpdate(
    { _id: objectIdParam(req.params.id, "코스"), organizationId, ...alive },
    { $set: { ...body, days: toDbDays(body.days) } },
    { new: true, runValidators: true },
  ).lean();
  if (!course) throw notFound("코스");
  const tours = await Tour.find({ organizationId, courseId: course._id, ...alive }).select("_id").lean();
  ok(res, toCourse(course, tours.map((t) => t._id)));
});

/**
 * 삭제 표시(soft delete). 이 코스로 만든 투어가 남아 있으면 409 —
 * 투어의 코스·일정표 링크가 깨지지 않도록 투어를 먼저 정리하게 한다 (라벨 삭제와 같은 규칙).
 */
coursesRouter.delete(ROUTES.courses.detail(":id"), async (req, res) => {
  const { organizationId } = authOf(req);
  const id = objectIdParam(req.params.id, "코스");
  if (!(await Course.exists({ _id: id, organizationId, ...alive }))) throw notFound("코스");
  const tourCount = await Tour.countDocuments({ organizationId, courseId: id, ...alive });
  if (tourCount > 0) throw conflict(`이 코스로 만든 투어가 ${tourCount}건 있습니다. 투어관리에서 투어를 먼저 삭제해주세요.`, { tourCount });
  await Course.updateOne({ _id: id, organizationId }, { $set: { deletedAt: new Date() } });
  noContent(res);
});
