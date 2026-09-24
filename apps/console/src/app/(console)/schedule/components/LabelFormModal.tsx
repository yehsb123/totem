"use client";

import { useEffect, useState } from "react";
import { LABEL_COLORS, LABEL_COLOR_LABELS, upsertLabelRequest, type LabelColor, type ScheduleLabel, type UpsertLabelRequest } from "@totem/shared";
import { Field, Modal, btn, inputClass } from "@/components/ui";
import { errorMessage, fieldErrors } from "@/lib/api";
import { colorOf } from "@/lib/labelColors";

const EMOJIS = ["🚌", "✈️", "🏨", "🍽️", "☕", "🏖️", "🗻", "🏞️", "🚗", "🚢", "🎉", "💬", "📝", "🧑‍💻", "📅", "⭐", "❗", "🌴", "🏠", "🏢", "🎫", "🛍️", "📸", "🧳"];

export default function LabelFormModal({
  open,
  onClose,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  initial: ScheduleLabel | null;
  onSubmit: (body: UpsertLabelRequest) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState<LabelColor>("blue");
  const [defaultPlace, setDefaultPlace] = useState("");
  const [defaultManager, setDefaultManager] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setName(initial?.name ?? "");
    setEmoji(initial?.emoji ?? EMOJIS[0]);
    setColor(initial?.color ?? "blue");
    setDefaultPlace(initial?.defaultPlace ?? "");
    setDefaultManager(initial?.defaultManager ?? "");
  }, [open, initial]);

  const submit = async () => {
    const parsed = upsertLabelRequest.safeParse({ name, emoji, color, defaultPlace, defaultManager });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message])));
      return;
    }
    setSaving(true);
    try {
      await onSubmit(parsed.data);
      onClose();
    } catch (e) {
      const fe = fieldErrors(e);
      setErrors(Object.keys(fe).length ? fe : { _: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "라벨 수정" : "새 라벨"}
      footer={
        <>
          <button className={btn.secondary} onClick={onClose}>
            취소
          </button>
          <button className={btn.primary} onClick={submit} disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {errors._ && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors._}</p>}
        <Field label="라벨 이름" error={errors.name}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 투어, 미팅" autoFocus />
        </Field>
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">이모지</span>
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`rounded-md p-1.5 text-xl hover:bg-slate-100 ${emoji === e ? "bg-blue-100 ring-2 ring-blue-400" : ""}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">색상</span>
          <div className="flex flex-wrap gap-2">
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${colorOf(c).chip} ${color === c ? "ring-2 ring-slate-500" : ""}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${colorOf(c).dot}`} />
                {LABEL_COLOR_LABELS[c]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="기본 장소" hint="이 라벨로 일정을 만들 때 채워집니다." error={errors.defaultPlace}>
            <input className={inputClass} value={defaultPlace} onChange={(e) => setDefaultPlace(e.target.value)} />
          </Field>
          <Field label="기본 담당자" error={errors.defaultManager}>
            <input className={inputClass} value={defaultManager} onChange={(e) => setDefaultManager(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
