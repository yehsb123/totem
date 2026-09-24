import type { Types } from "mongoose";
import type {
  AuthProvider,
  BillingSummary,
  Course,
  CourseSummary,
  MonthlyTourismStats,
  Payment as PaymentDto,
  Place as PlaceDto,
  Review as ReviewDto,
  ScheduleEvent as ScheduleEventDto,
  ScheduleLabel as ScheduleLabelDto,
  Tour as TourDto,
  UserProfile,
} from "@totem/shared";

/**
 * DB 문서 → API 응답(@totem/shared 타입) 변환. 응답 필드는 여기서만 정한다.
 * _id → id, Date → ISO 문자열, 내부 필드(passwordHash, organizationId, deletedAt …)는 노출하지 않는다.
 */
type Id = Types.ObjectId | string;
const id = (v: Id) => String(v);
const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null);
const isoReq = (d: Date | string) => new Date(d).toISOString();

interface Timestamps {
  _id: Id;
  createdAt: Date;
  updatedAt: Date;
}
const base = (d: Timestamps) => ({ id: id(d._id), createdAt: isoReq(d.createdAt), updatedAt: isoReq(d.updatedAt) });

/* eslint-disable @typescript-eslint/no-explicit-any -- lean() 결과는 스키마 추론 타입과 정확히 맞지 않아 any 로 받고 여기서 좁힌다 */

/** passwordHash 는 select:false 라 조회 시 빠지므로, 비밀번호 보유 여부는 호출부가 알려준다 */
export function toUserProfile(u: any, org: { _id: Id; name: string }, hasPassword: boolean): UserProfile {
  return {
    ...base(u),
    email: u.email ?? null,
    name: u.name,
    phone: u.phone ?? null,
    role: u.role,
    status: u.status,
    providers: [
      ...(hasPassword ? (["local"] as AuthProvider[]) : []),
      ...((u.identities ?? []) as { provider: AuthProvider }[]).map((i) => i.provider),
    ].filter((p, i, arr) => arr.indexOf(p) === i),
    organization: { id: id(org._id), name: org.name },
    notifications: { email: !!u.notifications?.email, push: !!u.notifications?.push },
    lastLoginAt: iso(u.lastLoginAt),
  };
}

export function toBillingSummary(s: any): BillingSummary {
  return {
    plan: s?.plan ?? "trial",
    subscriptionStatus: s?.status ?? "trialing",
    nextBillingDate: iso(s?.currentPeriodEnd),
    paymentMethod: s?.paymentMethod?.last4 ? { brand: s.paymentMethod.brand, last4: s.paymentMethod.last4 } : null,
  };
}

export const toPayment = (p: any): PaymentDto => ({
  ...base(p),
  paidAt: isoReq(p.paidAt),
  product: p.product,
  amount: p.amount,
  currency: "KRW",
  status: p.status,
});

export const toPlace = (p: any): PlaceDto => ({
  ...base(p),
  contentId: p.contentId,
  contentTypeId: p.contentTypeId ?? null,
  category: p.category,
  title: p.title,
  addr1: p.addr1 ?? null,
  addr2: p.addr2 ?? null,
  zipcode: p.zipcode ?? null,
  tel: p.tel ?? null,
  areaCode: p.areaCode ?? null,
  sigunguCode: p.sigunguCode ?? null,
  mapX: p.mapX,
  mapY: p.mapY,
  imageUrl: p.imageUrl ?? null,
  thumbnailUrl: p.thumbnailUrl ?? null,
  popularity: p.popularity ?? 0,
  foreignPopularity: p.foreignPopularity ?? 0,
});

const toCourseDay = (d: any) => ({
  dayNumber: d.dayNumber,
  date: d.date,
  slots: (d.slots ?? []).map((s: any) => ({
    slotIndex: s.slotIndex,
    memo: s.memo ?? null,
    place: {
      placeId: s.place.placeId ? id(s.place.placeId) : null,
      contentId: s.place.contentId ?? null,
      title: s.place.title,
      addr1: s.place.addr1 ?? null,
      category: s.place.category,
      mapX: s.place.mapX,
      mapY: s.place.mapY,
      imageUrl: s.place.imageUrl ?? null,
    },
  })),
});

export const toCourse = (c: any, tourIds: Id[] = []): Course => ({
  ...base(c),
  title: c.title,
  pickupLocation: c.pickupLocation ?? "",
  startDate: c.startDate,
  endDate: c.endDate,
  nation: c.nation,
  note: c.note ?? "",
  timeSlots: c.timeSlots,
  days: (c.days ?? []).map(toCourseDay),
  createdBy: id(c.createdBy),
  tourIds: tourIds.map(id),
});

export const toCourseSummary = (c: any, tourCount = 0): CourseSummary => ({
  ...base(c),
  title: c.title,
  startDate: c.startDate,
  endDate: c.endDate,
  pickupLocation: c.pickupLocation ?? "",
  placeCount: (c.days ?? []).reduce((n: number, d: any) => n + (d.slots?.length ?? 0), 0),
  tourCount,
});

export const toTour = (t: any): TourDto => {
  const count = t.reviewStats?.count ?? 0;
  return {
    ...base(t),
    courseId: t.courseId ? id(t.courseId) : null,
    title: t.title,
    type: t.type,
    nation: t.nation,
    startDate: t.startDate,
    endDate: t.endDate,
    status: t.status,
    managerName: t.managerName ?? "",
    capacity: t.capacity ?? 0,
    bookedSeats: t.bookedSeats ?? 0,
    remainingSeats: Math.max(0, (t.capacity ?? 0) - (t.bookedSeats ?? 0)),
    note: t.note ?? "",
    reviewStats: {
      averageRating: count ? Math.round((t.reviewStats.ratingSum / count) * 10) / 10 : null,
      reviewCount: count,
    },
  };
};

export const toReview = (r: any): ReviewDto => ({
  ...base(r),
  tourId: id(r.tourId),
  reviewerName: r.reviewerName ?? null,
  totalRating: r.totalRating,
  restaurantRating: r.restaurantRating ?? null,
  accommodationRating: r.accommodationRating ?? null,
  attractionRating: r.attractionRating ?? null,
  guideRating: r.guideRating ?? null,
  comment: r.comment ?? null,
  source: r.source,
  submittedAt: isoReq(r.submittedAt),
});

export const toScheduleLabel = (l: any, eventCount = 0): ScheduleLabelDto => ({
  ...base(l),
  name: l.name,
  emoji: l.emoji,
  color: l.color,
  defaultPlace: l.defaultPlace ?? "",
  defaultManager: l.defaultManager ?? "",
  eventCount,
});

export const toScheduleEvent = (e: any): ScheduleEventDto => ({
  ...base(e),
  labelId: e.labelId ? id(e.labelId) : null,
  tourId: e.tourId ? id(e.tourId) : null,
  name: e.name,
  startDate: e.startDate,
  endDate: e.endDate,
  manager: e.manager ?? "",
  items: (e.items ?? []).map((i: any) => ({ time: i.time, place: i.place })),
  note: e.note ?? "",
});

export const toTourismStats = (s: any): MonthlyTourismStats => ({
  region: s.region,
  month: s.month,
  domesticVisitors: s.domesticVisitors,
  genderAge: (s.genderAge ?? []).map((g: any) => ({ ageGroup: g.ageGroup, maleRatio: g.maleRatio, femaleRatio: g.femaleRatio })),
  internationalVisitors: s.internationalVisitors,
  countryRatios: (s.countryRatios ?? []).map((c: any) => ({ country: c.country, ratio: c.ratio })),
  snsMentions: s.snsMentions,
  companionTypes: (s.companionTypes ?? []).map((n: any) => ({ name: n.name, value: n.value })),
  travelTypes: (s.travelTypes ?? []).map((n: any) => ({ name: n.name, value: n.value })),
  domesticSpending: {
    total: s.domesticSpending?.total ?? 0,
    byCategory: (s.domesticSpending?.byCategory ?? []).map((c: any) => ({ category: c.category, amount: c.amount })),
  },
  internationalSpending: {
    total: s.internationalSpending?.total ?? 0,
    byCategory: (s.internationalSpending?.byCategory ?? []).map((c: any) => ({ category: c.category, amount: c.amount })),
  },
  source: s.source,
});
