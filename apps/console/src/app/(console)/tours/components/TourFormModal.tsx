"use client";

import { useState } from "react";
import { NATIONS, NATION_LABELS, TOUR_STATUSES, TOUR_STATUS_LABELS, createTourRequest, type CreateTourRequest, type Nation, type Tour, type TourStatus } from "@totem/shared";
import { Field, Modal, btn, inputClass } from "@/components/ui";
import { errorMessage, fieldErrors } from "@/lib/api";
import { today } from "@/lib/format";

/** 닫혀 있을 땐 폼을 아예 마운트하지 않는다 — 열 때마다 새로 마운트돼 초기값이 useState 초기화로 들어간다 (effect 로 되돌리지 않음) */
export default function TourFormModal(props: Parameters<typeof TourForm>[0] & { open: boolean }) {
  return props.open ? <TourForm {...props} /> : null;
}

function TourForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial: Tour | null;
  onClose: () => void;
  onSubmit: (body: CreateTourRequest) => Promise<void>;
}) {
  const [f, setF] = useState(() =>
    initial
      ? {
          title: initial.title,
          type: initial.type,
          nation: initial.nation,
          startDate: initial.startDate,
          endDate: initial.endDate,
          status: initial.status,
          managerName: initial.managerName,
          capacity: initial.capacity,
          bookedSeats: initial.bookedSeats,
          note: initial.note,
        }
      : { title: "", type: "일반", nation: "KR" as Nation, startDate: today(), endDate: today(), status: "planned" as TourStatus, managerName: "", capacity: 0, bookedSeats: 0, note: "" },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    const parsed = createTourRequest.safeParse({ ...f, courseId: initial?.courseId ?? null });
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
      open
      onClose={onClose}
      title={initial ? "투어 수정" : "투어 추가"}
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
        <Field label="투어명" error={errors.title}>
          <input className={inputClass} value={f.title} onChange={(e) => set("title", e.target.value)} autoFocus />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="타입" error={errors.type}>
            <input className={inputClass} value={f.type} onChange={(e) => set("type", e.target.value)} placeholder="패키지, 자유 …" />
          </Field>
          <Field label="고객 국가">
            <select className={inputClass} value={f.nation} onChange={(e) => set("nation", e.target.value as Nation)}>
              {NATIONS.map((n) => (
                <option key={n} value={n}>
                  {NATION_LABELS[n]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="상태">
            <select className={inputClass} value={f.status} onChange={(e) => set("status", e.target.value as TourStatus)}>
              {TOUR_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TOUR_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="시작일" error={errors.startDate}>
            <input type="date" className={inputClass} value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label="종료일" error={errors.endDate}>
            <input type="date" className={inputClass} value={f.endDate} min={f.startDate} onChange={(e) => set("endDate", e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="담당자" error={errors.managerName}>
            <input className={inputClass} value={f.managerName} onChange={(e) => set("managerName", e.target.value)} />
          </Field>
          <Field label="예상 인원" error={errors.capacity}>
            <input type="number" min={0} className={inputClass} value={f.capacity} onChange={(e) => set("capacity", Number(e.target.value))} />
          </Field>
          <Field label="예약 인원" error={errors.bookedSeats}>
            <input type="number" min={0} className={inputClass} value={f.bookedSeats} onChange={(e) => set("bookedSeats", Number(e.target.value))} />
          </Field>
        </div>
        <Field label="메모" error={errors.note}>
          <textarea className={`${inputClass} min-h-[64px]`} value={f.note} onChange={(e) => set("note", e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
