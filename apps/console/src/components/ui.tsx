"use client";

import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

/* ───────── 모달 ───────── */

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
/** 열린 모달 순서 — Esc·Tab 은 맨 위 모달만 처리한다 (모달 위에 모달이 뜨는 경우) */
const modalStack: symbol[] = [];
/**
 * 모달 밖에서 마지막으로 포커스된 요소 = 모달을 연 버튼.
 * 모달의 effect 가 돌 때는 자식 입력칸의 autoFocus 가 이미 포커스를 옮긴 뒤라 activeElement 로는 알 수 없다.
 */
let lastOutsideFocus: HTMLElement | null = null;
if (typeof document !== "undefined") {
  document.addEventListener("focusin", (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && !t.closest('[role="dialog"]')) lastOutsideFocus = t;
  });
}

/**
 * 공용 모달. 키보드 사용자를 위해:
 *  - 열리면 autoFocus 요소(없으면 첫 입력·버튼)로 포커스, 닫히면 연 버튼으로 되돌린다
 *  - Tab·Shift+Tab 은 모달 안에서만 돈다 (뒤 화면으로 빠지지 않음)
 *  - Esc 는 맨 위 모달 하나만 닫는다
 */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  width = "max-w-lg",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const me = Symbol("modal");
    modalStack.push(me);
    const dialog = dialogRef.current;
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const opener = active && !dialog?.contains(active) ? active : lastOutsideFocus;
    // 자식의 autoFocus 가 먼저 잡았으면 그대로, 아니면 첫 입력칸(없으면 첫 버튼·대화상자 자체)
    if (dialog && !dialog.contains(document.activeElement)) {
      const first = dialog.querySelector<HTMLElement>("input:not([disabled]),select:not([disabled]),textarea:not([disabled])") ?? dialog.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? dialog).focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== me || !dialog) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return e.preventDefault();
      const [firstEl, lastEl] = [items[0], items[items.length - 1]];
      const inside = dialog.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === firstEl || !inside)) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && (document.activeElement === lastEl || !inside)) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      modalStack.splice(modalStack.indexOf(me), 1);
      // 닫힌 뒤 연 버튼으로 (그 버튼이 아직 화면에 있을 때만)
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`flex max-h-[90vh] w-full ${width} flex-col rounded-lg bg-white shadow-xl outline-none`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 id={titleId} className="text-base font-semibold text-slate-900">
            {title}
          </h3>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="닫기">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ───────── 버튼·입력 ───────── */

const btnBase = "inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
export const btn = {
  primary: `${btnBase} bg-blue-600 text-white hover:bg-blue-700`,
  secondary: `${btnBase} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`,
  danger: `${btnBase} bg-red-600 text-white hover:bg-red-700`,
  ghost: `${btnBase} text-slate-600 hover:bg-slate-100`,
};

/** 너비 없는 기본 입력 스타일 — 도구줄처럼 너비를 직접 줄 때 (w-full 과 섞으면 어느 쪽이 이길지 CSS 순서에 달려 버린다) */
export const inputBase =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
/** 폼 안에서 가로 전체를 쓰는 입력 */
export const inputClass = `w-full ${inputBase}`;

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

/* ───────── 상태 표시 ───────── */

export function LoadingState({ text = "불러오는 중…" }: { text?: string }) {
  return <div className="py-10 text-center text-sm text-slate-500">{text}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-sm text-red-600">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className={btn.secondary}>
          다시 시도
        </button>
      )}
    </div>
  );
}

export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-sm text-slate-500">
      <p>{text}</p>
      {action}
    </div>
  );
}

/* ───────── 토스트 ───────── */

type Toast = { id: number; kind: "success" | "error"; text: string };
const ToastContext = createContext<(kind: Toast["kind"], text: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[2000] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-md px-4 py-2.5 text-sm text-white shadow-lg ${t.kind === "success" ? "bg-slate-800" : "bg-red-600"}`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const push = useContext(ToastContext);
  return useMemo(() => ({ success: (t: string) => push("success", t), error: (t: string) => push("error", t) }), [push]);
}
