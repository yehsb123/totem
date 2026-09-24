import type { Types } from "mongoose";
import {
  AuthHandoff,
  Course,
  Invitation,
  Organization,
  Review,
  ReviewImport,
  ScheduleEvent,
  ScheduleLabel,
  Session,
  Subscription,
  Tour,
  User,
} from "./models";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface PurgeResult {
  organizations: number;
  deleted: Record<string, number>;
}

/**
 * 삭제 표시(deletedAt) 후 `afterDays` 일이 지난 조직의 데이터를 영구 삭제한다.
 *
 * 남기는 것: payments(결제 기록 — 전자상거래법상 대금결제 기록 5년 보존, 개인정보 없음),
 *           organizations 문서(이름을 지운 표지만 — payments 가 참조)
 * 지우는 것: 코스·투어·리뷰·리뷰 가져오기 이력·일정·라벨·초대·구독, 소속 사용자와 그 세션·인계 코드
 *
 * 여러 번 실행해도 안전하다(이미 정리된 조직은 purgedAt 으로 건너뜀).
 */
export async function purgeDeletedOrganizations(afterDays: number, now = new Date()): Promise<PurgeResult> {
  const cutoff = new Date(now.getTime() - afterDays * DAY_MS);
  const orgs = await Organization.find({ deletedAt: { $ne: null, $lte: cutoff }, purgedAt: null }).select("_id").lean();
  const deleted: Record<string, number> = {};
  const add = (k: string, n: number) => (deleted[k] = (deleted[k] ?? 0) + n);

  for (const { _id } of orgs) {
    const organizationId = _id as Types.ObjectId;
    const userIds = (await User.find({ organizationId }).select("_id").lean()).map((u) => u._id);
    const byOrg = { organizationId };
    const results = await Promise.all([
      Course.deleteMany(byOrg),
      Tour.deleteMany(byOrg),
      Review.deleteMany(byOrg),
      ReviewImport.deleteMany(byOrg),
      ScheduleEvent.deleteMany(byOrg),
      ScheduleLabel.deleteMany(byOrg),
      Invitation.deleteMany(byOrg),
      Subscription.deleteMany(byOrg),
      Session.deleteMany({ userId: { $in: userIds } }),
      AuthHandoff.deleteMany({ userId: { $in: userIds } }),
    ]);
    ["courses", "tours", "reviews", "review_imports", "schedule_events", "schedule_labels", "invitations", "subscriptions", "sessions", "auth_handoffs"].forEach(
      (k, i) => add(k, results[i].deletedCount),
    );
    add("users", (await User.deleteMany(byOrg)).deletedCount);
    await Organization.updateOne({ _id: organizationId }, { $set: { name: "삭제된 조직", ownerId: null, purgedAt: now } });
  }
  return { organizations: orgs.length, deleted };
}
