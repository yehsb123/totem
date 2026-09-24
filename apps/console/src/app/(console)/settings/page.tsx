"use client";

import { Bell, CreditCard, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  PAYMENT_STATUS_LABELS,
  PLAN_TIER_LABELS,
  changePasswordRequest,
  updateProfileRequest,
  type BillingSummary,
  type Payment,
} from "@totem/shared";
import { ErrorState, Field, LoadingState, btn, inputClass, useToast } from "@/components/ui";
import { api, errorMessage, fieldErrors } from "@/lib/api";
import { env } from "@/lib/env";
import { formatDateKo, formatWon } from "@/lib/format";
import { useSession } from "@/lib/session";

const TABS = [
  { key: "account", label: "계정 관리", Icon: UserCircle },
  { key: "notifications", label: "알림 설정", Icon: Bell },
  { key: "billing", label: "결제 정보", Icon: CreditCard },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>("account");
  return (
    <div className="p-4">
      <div className="flex flex-col overflow-hidden rounded-lg bg-white shadow-sm md:flex-row">
        <nav className="flex gap-1 border-b border-slate-200 bg-slate-50 p-3 md:w-56 md:flex-col md:border-b-0 md:border-r">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium ${tab === key ? "bg-blue-100 text-blue-700" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <Icon className="h-5 w-5" /> {label}
            </button>
          ))}
        </nav>
        <div className="flex-1 p-6">
          {tab === "account" && <AccountTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "billing" && <BillingTab />}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section className={`mb-6 rounded-lg border p-5 ${danger ? "border-red-200" : "border-slate-200"}`}>
      <h3 className={`mb-4 text-lg font-semibold ${danger ? "text-red-700" : "text-slate-800"}`}>{title}</h3>
      {children}
    </section>
  );
}

function AccountTab() {
  const { user, setUser } = useSession();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    const parsed = updateProfileRequest.safeParse({ name, phone: phone.trim() || null });
    if (!parsed.success) return setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
    setErrors({});
    setSaving(true);
    try {
      setUser(await api.users.updateMe(parsed.data));
      toast.success("프로필을 저장했습니다.");
    } catch (e) {
      setErrors({ ...fieldErrors(e), _: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold text-slate-800">계정 관리</h2>
      <Section title="프로필 정보">
        <div className="grid max-w-xl gap-4">
          <Field label="이메일 (로그인 ID, 변경 불가)">
            <input className={`${inputClass} bg-slate-100`} value={user.email ?? "카카오 계정 (이메일 없음)"} disabled />
          </Field>
          <Field label="소속 조직">
            <input className={`${inputClass} bg-slate-100`} value={user.organization.name} disabled />
          </Field>
          <Field label="이름" error={errors.name}>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="전화번호" error={errors.phone} hint="아이디(이메일) 찾기에 사용됩니다.">
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
          </Field>
          {errors._ && <p className="text-sm text-red-600">{errors._}</p>}
          <div className="flex justify-end gap-2">
            <button
              className={btn.secondary}
              onClick={() => {
                setName(user.name);
                setPhone(user.phone ?? "");
                setErrors({});
              }}
            >
              취소
            </button>
            <button className={btn.primary} onClick={saveProfile} disabled={saving}>
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </Section>
      {user.providers.includes("local") ? <PasswordSection /> : <Section title="비밀번호">카카오로 가입한 계정은 비밀번호 없이 카카오 로그인을 사용합니다.</Section>}
      <WithdrawSection hasPassword={user.providers.includes("local")} />
    </div>
  );
}

function PasswordSection() {
  const toast = useToast();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = changePasswordRequest.safeParse({ currentPassword, newPassword });
    if (!parsed.success) return setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
    if (newPassword !== confirm) return setErrors({ confirm: "새 비밀번호가 일치하지 않습니다." });
    setErrors({});
    setBusy(true);
    try {
      await api.users.changePassword(parsed.data);
      toast.success("비밀번호를 변경했습니다. 다시 로그인해주세요.");
      // 서버가 모든 세션을 폐기했으므로 다시 로그인
      await api.auth.logout();
      // 메인 사이트는 다른 출처(도메인)라 Next 라우터가 아니라 절대 주소로 이동한다
      setTimeout(() => window.location.assign(new URL("/?login=1", env.webUrl).href), 1200);
    } catch (e) {
      const fe = fieldErrors(e);
      setErrors(Object.keys(fe).length ? fe : { _: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="비밀번호 변경">
      <div className="grid max-w-xl gap-4">
        <Field label="현재 비밀번호" error={errors.currentPassword}>
          <input type="password" autoComplete="current-password" className={inputClass} value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="새 비밀번호" error={errors.newPassword} hint="8자 이상, 영문과 숫자를 포함">
          <input type="password" autoComplete="new-password" className={inputClass} value={newPassword} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <Field label="새 비밀번호 확인" error={errors.confirm}>
          <input type="password" autoComplete="new-password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {errors._ && <p className="text-sm text-red-600">{errors._}</p>}
        <div className="flex justify-end">
          <button className={btn.primary} onClick={submit} disabled={busy}>
            비밀번호 변경
          </button>
        </div>
      </div>
    </Section>
  );
}

function WithdrawSection({ hasPassword }: { hasPassword: boolean }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.users.withdraw({ password: hasPassword ? password : undefined, confirm: confirm as "탈퇴합니다" });
      window.location.assign(new URL("/", env.webUrl).href);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="계정 삭제" danger>
      <p className="mb-4 text-sm text-slate-600">
        계정을 삭제하면 개인정보(이메일·이름·전화번호)가 즉시 삭제되고 다시 로그인할 수 없습니다. 조직의 유일한 소유자라면 조직도 함께 삭제됩니다.
      </p>
      <div className="grid max-w-xl gap-3">
        {hasPassword && (
          <Field label="비밀번호">
            <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        )}
        <Field label="확인 문구" hint="'탈퇴합니다' 를 그대로 입력하세요.">
          <input className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <button className={btn.danger} onClick={submit} disabled={busy || confirm !== "탈퇴합니다"}>
            {busy ? "처리 중…" : "계정 삭제"}
          </button>
        </div>
      </div>
    </Section>
  );
}

/** 알림 설정 한 줄 (모듈 수준 컴포넌트 — 부모 안에서 정의하면 렌더마다 다시 마운트된다) */
function NotificationRow({
  k,
  label,
  desc,
  checked,
  busy,
  onToggle,
}: {
  k: "email" | "push";
  label: string;
  desc: string;
  checked: boolean;
  busy: boolean;
  onToggle: (k: "email" | "push") => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-4 last:border-0">
      <div>
        <div className="font-medium text-slate-800">{label}</div>
        <div className="text-sm text-slate-500">{desc}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        disabled={busy}
        onClick={() => onToggle(k)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function NotificationsTab() {
  const { user, setUser } = useSession();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (key: "email" | "push") => {
    setBusy(key);
    try {
      setUser(await api.users.updateNotifications({ [key]: !user.notifications[key] }));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };


  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold text-slate-800">알림 설정</h2>
      <Section title="알림 수신">
        <NotificationRow k="email" label="이메일 알림" desc="투어 일정 변경·리뷰 등록 소식을 이메일로 받습니다." checked={user.notifications.email} busy={busy === "email"} onToggle={toggle} />
        <NotificationRow k="push" label="푸시 알림" desc="브라우저 알림으로 받습니다." checked={user.notifications.push} busy={busy === "push"} onToggle={toggle} />
        <p className="mt-2 text-xs text-slate-500">변경 즉시 저장됩니다.</p>
      </Section>
    </div>
  );
}

function BillingTab() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.billing.summary(), api.billing.payments({ limit: 24 })])
      .then(([sum, pay]) => {
        if (cancelled) return;
        setSummary(sum);
        setPayments(pay.items);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [retry]);
  const load = () => {
    setError(null);
    setRetry((n) => n + 1);
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!summary) return <LoadingState />;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold text-slate-800">결제 정보</h2>
      <Section title="현재 구독">
        <dl className="grid max-w-xl grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-600">구독 플랜</dt>
          <dd className="font-semibold text-blue-700">{PLAN_TIER_LABELS[summary.plan]}</dd>
          <dt className="text-slate-600">다음 결제일</dt>
          <dd className="font-semibold">{summary.nextBillingDate ? formatDateKo(summary.nextBillingDate) : "-"}</dd>
          <dt className="text-slate-600">결제 수단</dt>
          <dd className="font-semibold">{summary.paymentMethod ? `${summary.paymentMethod.brand} **** ${summary.paymentMethod.last4}` : "등록된 결제 수단 없음"}</dd>
        </dl>
        <p className="mt-4 text-xs text-slate-500">플랜 변경·결제 수단 변경은 결제 대행사(PG) 연동 후 제공됩니다. 요금제는 메인 사이트의 요금제 안내에서 확인할 수 있습니다.</p>
      </Section>
      <Section title="결제 내역">
        {payments.length === 0 ? (
          <p className="text-sm text-slate-500">결제 내역이 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">날짜</th>
                <th className="px-4 py-2">상품</th>
                <th className="px-4 py-2">금액</th>
                <th className="px-4 py-2">상태</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{p.paidAt.slice(0, 10)}</td>
                  <td className="px-4 py-2">{p.product}</td>
                  <td className="px-4 py-2">{formatWon(p.amount)}</td>
                  <td className="px-4 py-2">{PAYMENT_STATUS_LABELS[p.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}
