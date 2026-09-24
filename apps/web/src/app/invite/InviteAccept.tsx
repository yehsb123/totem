"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { USER_ROLE_LABELS, acceptInvitationRequest, type InvitationPreview } from "@totem/shared";
import { inputClass, primaryButtonClass } from "@/components/auth/ui";
import { api } from "@/lib/api";
import { errorMessage, redirectToConsole } from "@/lib/handoff";

/**
 * 초대 링크 수락 — 초대한 조직·역할을 보여주고, 이름·비밀번호로 그 조직 계정을 만든 뒤 콘솔로 보낸다.
 * 이메일은 초대받은 주소로 고정된다.
 */
export default function InviteAccept() {
  const token = useSearchParams().get("token") ?? "";
  const [preview, setPreview] = useState<{ token: string; data: InvitationPreview | null; error: string | null } | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api.auth
      .previewInvitation(token)
      .then((data) => !cancelled && setPreview({ token, data, error: null }))
      .catch((e) => !cancelled && setPreview({ token, data: null, error: errorMessage(e, "초대 정보를 확인하지 못했습니다.") }));
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) return <Notice title="초대 링크가 올바르지 않습니다" body="받은 링크 전체를 다시 확인해주세요." />;
  const current = preview?.token === token ? preview : null;
  if (!current) return <p className="text-center text-sm text-slate-500">초대 정보를 확인하는 중…</p>;
  if (current.error || !current.data) return <Notice title="초대를 사용할 수 없습니다" body={current.error ?? ""} />;
  const inv = current.data;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setMessage("비밀번호가 일치하지 않습니다.");
    const parsed = acceptInvitationRequest.safeParse({ token, name, password, agreements: { terms, privacy, marketing: false } });
    if (!parsed.success) return setMessage(parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.");
    setBusy(true);
    setMessage(null);
    try {
      await api.auth.acceptInvitation(parsed.data);
      await redirectToConsole("/schedule/");
    } catch (err) {
      setMessage(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-center text-xl font-bold text-slate-900">
        <span className="text-indigo-600">{inv.organizationName}</span>에 초대되었습니다
      </h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        {inv.invitedByName}님이 <strong>{USER_ROLE_LABELS[inv.role]}</strong>(으)로 초대했습니다.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input className={inputClass} value={inv.email} disabled aria-label="이메일" />
        <input className={inputClass} placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <input className={inputClass} type="password" placeholder="비밀번호 (영문·숫자 포함 8자 이상)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <input className={inputClass} type="password" placeholder="비밀번호를 한번 더 입력해주세요" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> 만 14세 이상이며, 이용약관에 동의합니다. (필수)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} /> 개인정보 수집 및 이용에 동의합니다. (필수)
        </label>
        {message && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {message}
          </p>
        )}
        <button type="submit" className={primaryButtonClass} disabled={busy || !terms || !privacy}>
          {busy ? "가입하는 중…" : "초대 수락하고 시작하기"}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-500">초대 링크는 {new Date(inv.expiresAt).toLocaleDateString("ko-KR")}까지 유효합니다.</p>
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-center">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      <p role="alert" className="mt-3 text-sm text-slate-600">
        {body}
      </p>
      <Link href="/" className="mt-6 inline-block text-sm font-semibold text-indigo-600 hover:underline">
        홈으로
      </Link>
    </div>
  );
}
