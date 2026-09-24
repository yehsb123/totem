"use client";

import { findEmailRequest } from "@totem/shared";
import { useState } from "react";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/handoff";
import { inputClass, linkButtonClass, primaryButtonClass } from "./ui";

interface FindEmailStepProps {
  onBackToLogin: (email?: string) => void;
}

/** 아이디(이메일) 찾기 — 가입 시 입력한 이름 + 전화번호로 마스킹된 이메일을 조회한다 */
export default function FindEmailStep({ onBackToLogin }: FindEmailStepProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setMaskedEmail(null);
    const parsed = findEmailRequest.safeParse({ name, phone });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.path[0] === "name" ? "이름을 입력해주세요." : "전화번호를 정확히 입력해주세요.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.auth.findEmail(parsed.data);
      setMaskedEmail(res.maskedEmail);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className="flex w-full flex-col"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h3 id="auth-modal-title" className="mb-2 text-center text-[15px] font-semibold text-slate-900">
        아이디(이메일) 찾기
      </h3>
      <p className="mb-5 text-center text-sm text-slate-500">가입 시 입력한 이름과 전화번호를 입력해주세요.</p>
      <input
        type="text"
        autoComplete="name"
        aria-label="이름"
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={`${inputClass} mb-2.5`}
      />
      <input
        type="tel"
        autoComplete="tel"
        aria-label="전화번호"
        placeholder="전화번호"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className={`${inputClass} mb-4`}
      />

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}
      {maskedEmail && (
        <p className="mb-4 rounded-lg bg-slate-100 px-4 py-3 text-center text-sm text-slate-800">
          가입된 이메일: <strong className="font-semibold">{maskedEmail}</strong>
        </p>
      )}

      <button type="submit" disabled={isLoading} className={primaryButtonClass}>
        {isLoading ? "조회 중..." : "이메일 찾기"}
      </button>
      <button type="button" onClick={() => onBackToLogin()} className={`${linkButtonClass} mt-4 text-sm`}>
        로그인으로 돌아가기
      </button>
    </form>
  );
}
