import { DEFAULT_TIME_SLOTS, HOTEL_SLOT_INDEX, enumerateDates } from "@totem/shared";
import { env, isProd } from "../../config/env";
import { logger } from "../../lib/logger";
import { Course, Payment, Place, Review, ScheduleEvent, ScheduleLabel, Subscription, Tour, TourismStat, User } from "../models";
import { createOrganizationWithOwner, hashPassword } from "../../modules/auth/service";
import { placesJeju } from "./data/places-jeju";
import { tourismJeju } from "./data/tourism-jeju";

export const DEMO_EMAIL = "demo@totem.dev";
/** 인메모리 개발 DB 에서만 쓰는 기본 비밀번호 (영속 DB 에는 SEED_DEMO_PASSWORD 가 있어야 데모 계정을 만든다) */
const MEMORY_DEMO_PASSWORD = "demo1234";

/** 공용 데이터(대시보드 통계·장소 샘플) — 운영에서도 안전하게 반복 실행 가능 (upsert) */
export async function seedReferenceData() {
  // 시드 원본은 평범한 배열이라 mongoose DocumentArray 타입과 맞지 않아 캐스팅한다
  await TourismStat.bulkWrite(
    tourismJeju.map((s) => ({ updateOne: { filter: { region: s.region, month: s.month }, update: { $set: s }, upsert: true } })) as never,
  );
  await Place.bulkWrite(
    placesJeju.map((p, i) => ({
      updateOne: {
        filter: { source: "manual", contentId: `seed-${String(i + 1).padStart(3, "0")}` },
        update: { $set: { ...p, areaCode: "39", isActive: true } },
        upsert: true,
      },
    })),
  );
  logger.info({ stats: tourismJeju.length, places: placesJeju.length }, "공용 데이터 시드 완료");
}

/** 데모 조직 — 모든 화면이 빈 화면이 아니도록 한 벌 채운다 */
export async function seedDemoOrganization(password: string) {
  if (await User.exists({ email: DEMO_EMAIL })) return;
  const now = new Date();
  const { org, user } = await createOrganizationWithOwner({
    organizationName: "토템 데모 여행사",
    user: {
      email: DEMO_EMAIL,
      passwordHash: await hashPassword(password),
      name: "데모 매니저",
      phone: "010-0000-0000",
      agreements: { terms: now, privacy: now, marketing: null },
    },
  });
  const organizationId = org._id;
  const createdBy = user._id;

  const places = await Place.find({ source: "manual" }).lean();
  const byTitle = (t: string) => {
    const p = places.find((x) => x.title === t)!;
    return { placeId: p._id, contentId: p.contentId, title: p.title, addr1: p.addr1, category: p.category, mapX: p.mapX, mapY: p.mapY, imageUrl: p.imageUrl };
  };
  const slot = (i: number, t: string) => ({ slotIndex: i, place: byTitle(t), memo: null });

  const today = now.toISOString().slice(0, 10);
  const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
  const [s1, e1] = [plusDays(7), plusDays(9)];
  const days1 = enumerateDates(s1, e1);

  const course = await Course.create({
    organizationId,
    createdBy,
    title: "제주 동부 2박 3일",
    pickupLocation: "제주국제공항 3번 게이트",
    startDate: s1,
    endDate: e1,
    nation: "KR",
    note: "성산·우도 중심 동부 코스",
    timeSlots: [...DEFAULT_TIME_SLOTS],
    days: [
      { dayNumber: 1, date: days1[0], slots: [slot(HOTEL_SLOT_INDEX, "메종글래드 제주"), slot(5, "우진해장국"), slot(8, "만장굴"), slot(12, "명진전복")] },
      { dayNumber: 2, date: days1[1], slots: [slot(HOTEL_SLOT_INDEX, "메종글래드 제주"), slot(2, "성산일출봉"), slot(6, "우도"), slot(11, "섭지코지")] },
      { dayNumber: 3, date: days1[2], slots: [slot(4, "동문재래시장"), slot(6, "올래국수")] },
    ],
  });

  const tours = await Tour.insertMany([
    { organizationId, createdBy, courseId: course._id, title: course.title, type: "패키지", nation: "KR", startDate: s1, endDate: e1, status: "planned", managerName: "김가이드", capacity: 20, bookedSeats: 14 },
    { organizationId, createdBy, title: "중문 리조트 가족여행", type: "자유", nation: "JP", startDate: plusDays(-10), endDate: plusDays(-8), status: "completed", managerName: "이매니저", capacity: 12, bookedSeats: 12 },
    { organizationId, createdBy, title: "한라산 트레킹 원데이", type: "원데이", nation: "US", startDate: today, endDate: today, status: "in_progress", managerName: "박가이드", capacity: 15, bookedSeats: 9 },
  ]);

  const finished = tours[1];
  const reviews = [
    { totalRating: 5, restaurantRating: 5, accommodationRating: 5, attractionRating: 4, guideRating: 5, comment: "가족 모두 만족했어요.", reviewerName: "사토" },
    { totalRating: 4, restaurantRating: 4, accommodationRating: 5, attractionRating: 4, guideRating: 4, comment: "숙소가 특히 좋았습니다.", reviewerName: "다나카" },
    { totalRating: 3, restaurantRating: 3, accommodationRating: 4, attractionRating: 3, guideRating: 4, comment: "일정이 조금 빡빡했어요.", reviewerName: null },
  ];
  await Review.insertMany(reviews.map((r, i) => ({ ...r, organizationId, tourId: finished._id, source: "manual", submittedAt: new Date(Date.now() - (7 - i) * 86_400_000) })));
  await Tour.updateOne({ _id: finished._id }, { $set: { reviewStats: { ratingSum: reviews.reduce((s, r) => s + r.totalRating, 0), count: reviews.length } } });

  const labels = await ScheduleLabel.find({ organizationId }).lean();
  const label = (name: string) => labels.find((l) => l.name === name)?._id ?? null;
  await ScheduleEvent.insertMany([
    { organizationId, createdBy, labelId: label("투어"), tourId: tours[0]._id, name: tours[0].title, startDate: s1, endDate: e1, manager: "김가이드", items: [{ time: "09:00", place: "제주국제공항" }, { time: "11:00", place: "우진해장국" }] },
    { organizationId, createdBy, labelId: label("투어"), tourId: tours[2]._id, name: tours[2].title, startDate: today, endDate: today, manager: "박가이드", items: [{ time: "06:00", place: "성판악 탐방로" }] },
    { organizationId, createdBy, labelId: label("미팅"), name: "협력 호텔 계약 미팅", startDate: plusDays(2), endDate: plusDays(2), manager: "데모 매니저", items: [{ time: "14:00", place: "메종글래드 제주" }] },
  ]);

  const nextBilling = new Date(Date.now() + 20 * 86_400_000);
  await Subscription.updateOne(
    { organizationId },
    { $set: { plan: "premium", status: "active", currentPeriodEnd: nextBilling, paymentMethod: { brand: "Visa", last4: "1234" } } },
  );
  await Payment.insertMany(
    [1, 2, 3].map((m) => ({
      organizationId,
      paidAt: new Date(nextBilling.getTime() - m * 30 * 86_400_000),
      product: "프리미엄 플랜 (월간)",
      amount: 15000,
      status: "paid",
    })),
  );
  logger.info({ email: DEMO_EMAIL }, "데모 조직 시드 완료");
}

/** 서버 기동 시: DB 가 비어 있을 때만 */
export async function seedIfEmpty() {
  if ((await TourismStat.estimatedDocumentCount()) === 0) await seedReferenceData();
  const password = env.SEED_DEMO_PASSWORD || (isProd ? "" : MEMORY_DEMO_PASSWORD);
  if (password && !(await User.exists({ email: DEMO_EMAIL }))) {
    await seedDemoOrganization(password);
    if (!env.SEED_DEMO_PASSWORD) logger.warn(`개발용 데모 계정: ${DEMO_EMAIL} / ${MEMORY_DEMO_PASSWORD}`);
  }
}
