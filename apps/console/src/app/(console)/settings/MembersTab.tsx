"use client";

import { Copy, Crown, UserMinus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  INVITABLE_ROLES,
  INVITATION_TTL_DAYS,
  USER_ROLE_LABELS,
  createInvitationRequest,
  invitationUrl,
  type Invitation,
  type InvitableRole,
  type Member,
} from "@totem/shared";
import { ErrorState, Field, LoadingState, btn, inputClass, useToast } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { env } from "@/lib/env";
import { formatDateKo } from "@/lib/format";
import { useSession } from "@/lib/session";

const STATUS_LABEL: Record<Invitation["status"], string> = { pending: "대기 중", accepted: "수락", revoked: "취소됨", expired: "만료" };

/**
 * 설정 > 멤버 관리.
 * 소유자: 역할 변경·소유권 이전·관리자 초대 / 관리자: 멤버 초대·멤버 제외 / 멤버: 목록 조회만
 */
export default function MembersTab() {
  const { user } = useSession();
  const toast = useToast();
  const isOwner = user.role === "owner";
  const canManage = user.role === "owner" || user.role === "admin";

  const [members, setMembers] = useState<Member[] | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.org.members(), canManage ? api.org.invitations() : Promise.resolve([])])
      .then(([m, i]) => {
        if (cancelled) return;
        setMembers(m);
        setInvitations(i);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [version, canManage]);

  const act = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn();
      toast.success(done);
      refresh();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (error)
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          refresh();
        }}
      />
    );
  if (!members) return <LoadingState />;

  const pending = invitations.filter((i) => i.status === "pending");

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold text-slate-800">멤버 관리</h2>

      <section className="mb-6 rounded-lg border border-slate-200 p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">
          {user.organization.name} 멤버 <span className="text-sm font-normal text-slate-500">{members.length}명</span>
        </h3>
        <ul className="divide-y divide-slate-100">
          {members.map((m) => {
            const self = m.id === user.id;
            const canRemove = canManage && !self && m.role !== "owner" && (isOwner || m.role === "member");
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900">
                    {m.name}
                    {self && <span className="ml-1.5 text-xs text-blue-600">나</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {m.email ?? "이메일 없음 (카카오)"} · 최근 로그인 {m.lastLoginAt ? formatDateKo(m.lastLoginAt) : "-"}
                  </div>
                </div>
                {isOwner && !self && m.role !== "owner" ? (
                  <select
                    aria-label={`${m.name} 역할`}
                    className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    value={m.role}
                    onChange={(e) => act(() => api.org.updateMember(m.id, { role: e.target.value as InvitableRole }), "역할을 변경했습니다.")}
                  >
                    {INVITABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {USER_ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${m.role === "owner" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                    {m.role === "owner" && <Crown className="mr-1 inline h-3 w-3" />}
                    {USER_ROLE_LABELS[m.role]}
                  </span>
                )}
                {isOwner && !self && m.status === "active" && (
                  <button
                    className={btn.ghost}
                    onClick={() =>
                      window.confirm(`${m.name}님에게 소유권을 이전할까요? 나는 관리자가 됩니다.`) &&
                      act(() => api.org.transferOwnership({ userId: m.id }), "소유권을 이전했습니다. 새로고침하면 권한이 반영됩니다.")
                    }
                  >
                    소유권 이전
                  </button>
                )}
                {canRemove && (
                  <button
                    className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`${m.name} 제외`}
                    title="조직에서 제외"
                    onClick={() =>
                      window.confirm(`${m.name}님을 조직에서 제외할까요? 즉시 로그아웃되고 개인정보가 삭제됩니다. (작성한 기록은 남습니다)`) &&
                      act(() => api.org.removeMember(m.id), "멤버를 제외했습니다.")
                    }
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {!canManage && <p className="mt-3 text-xs text-slate-500">멤버 초대·관리는 소유자와 관리자만 할 수 있습니다.</p>}
      </section>

      {canManage && (
        <>
          <InviteForm isOwner={isOwner} onCreated={refresh} />
          <section className="rounded-lg border border-slate-200 p-5">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              초대 내역 <span className="text-sm font-normal text-slate-500">대기 {pending.length}건</span>
            </h3>
            {invitations.length === 0 ? (
              <p className="text-sm text-slate-500">보낸 초대가 없습니다.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {invitations.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1 truncate">
                      {i.email} <span className="text-slate-500">· {USER_ROLE_LABELS[i.role]} · {i.invitedBy.name}</span>
                    </span>
                    <span className={`text-xs ${i.status === "pending" ? "text-blue-700" : "text-slate-500"}`}>
                      {STATUS_LABEL[i.status]}
                      {i.status === "pending" && ` · ${formatDateKo(i.expiresAt)}까지`}
                    </span>
                    {i.status === "pending" && (
                      <button className="text-xs text-red-600 hover:underline" onClick={() => act(() => api.org.revokeInvitation(i.id), "초대를 취소했습니다.")}>
                        취소
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/** 초대 만들기 — 이메일 발송은 아직 없어서, 만든 링크를 복사해 직접 전달한다 */
function InviteForm({ isOwner, onCreated }: { isOwner: boolean; onCreated: () => void }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitableRole>("member");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = createInvitationRequest.safeParse({ email, role });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.");
    setBusy(true);
    setError(null);
    try {
      const r = await api.org.invite(parsed.data);
      setLink(invitationUrl(env.webUrl, r.token));
      setEmail("");
      onCreated();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("초대 링크를 복사했습니다.");
    } catch {
      toast.error("복사하지 못했습니다. 링크를 직접 선택해 복사해주세요.");
    }
  };

  return (
    <section className="mb-6 rounded-lg border border-slate-200 p-5">
      <h3 className="mb-1 text-lg font-semibold text-slate-800">멤버 초대</h3>
      <p className="mb-4 text-xs text-slate-500">
        초대 링크를 만들어 직접 전달해주세요(메신저·메일). 링크는 {INVITATION_TTL_DAYS}일간 유효하고, 같은 이메일로 다시 만들면 이전 링크는 취소됩니다.
      </p>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Field label="이메일">
            <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />
          </Field>
        </div>
        <Field label="역할">
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value as InvitableRole)}>
            <option value="member">{USER_ROLE_LABELS.member}</option>
            {isOwner && <option value="admin">{USER_ROLE_LABELS.admin}</option>}
          </select>
        </Field>
        <button type="submit" className={btn.primary} disabled={busy || !email.trim()}>
          {busy ? "만드는 중…" : "초대 링크 만들기"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {link && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-slate-50 p-3">
          <input readOnly value={link} aria-label="초대 링크" className="min-w-0 flex-1 bg-transparent font-mono text-xs text-slate-700" onFocus={(e) => e.target.select()} />
          <button type="button" className={btn.secondary} onClick={copy}>
            <Copy className="h-4 w-4" /> 복사
          </button>
        </div>
      )}
    </section>
  );
}
