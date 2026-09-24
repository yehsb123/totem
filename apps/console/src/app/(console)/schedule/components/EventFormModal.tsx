"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createEventRequest, type CreateEventRequest, type ScheduleEvent, type ScheduleLabel, type Tour } from "@totem/shared";
import { Field, Modal, btn, inputBase, inputClass } from "@/components/ui";
import { api, errorMessage, fieldErrors } from "@/lib/api";

type Item = { time: string; place: string };

/** 일정 추가·수정 공용 폼. 색상은 라벨에서 온다 (구 코드는 일정마다 색을 골랐지만 저장되지 않았다) */
/** 닫혀 있을 땐 폼을 아예 마운트하지 않는다 — 열 때마다 새로 마운트돼 초기값이 useState 초기화로 들어간다 (effect 로 되돌리지 않음) */
export default function EventFormModal(props: Parameters<typeof EventForm>[0] & { open: boolean }) {
  return props.open ? <EventForm {...props} /> : null;
}

function EventForm({
  onClose,
  initial,
  defaultDate,
  presetLabel,
  labels,
  onSubmit,
}: {
  onClose: () => void;
  initial: ScheduleEvent | null;
  defaultDate: string;
  presetLabel: ScheduleLabel | null;
  labels: ScheduleLabel[];
  onSubmit: (body: CreateEventRequest) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? (presetLabel ? `${presetLabel.name} 일정` : ""));
  const [startDate, setStartDate] = useState(initial?.startDate ?? defaultDate);
  const [endDate, setEndDate] = useState(initial?.endDate ?? defaultDate);
  const [labelId, setLabelId] = useState<string>(initial ? (initial.labelId ?? "") : (presetLabel?.id ?? ""));
  const [tourId, setTourId] = useState<string>(initial?.tourId ?? "");
  const [manager, setManager] = useState(initial?.manager ?? presetLabel?.defaultManager ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [items, setItems] = useState<Item[]>(
    initial?.items ?? (presetLabel?.defaultPlace ? [{ time: "09:00", place: presetLabel.defaultPlace }] : []),
  );
  const [tours, setTours] = useState<Tour[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // 연결할 투어 선택지 — 비동기 응답에서만 setState
  useEffect(() => {
    api.tours
      .list({ limit: 100 })
      .then((r) => setTours(r.items))
      .catch(() => setTours([]));
  }, []);

  const submit = async () => {
    const body = { name, startDate, endDate, labelId: labelId || null, tourId: tourId || null, manager, note, items: items.filter((i) => i.place.trim()) };
    const parsed = createEventRequest.safeParse(body);
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

  const setItem = (i: number, patch: Partial<Item>) => setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? "일정 수정" : "새 일정"}
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
        <Field label="일정 이름" error={errors.name}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 제주 동부 투어" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="시작일" error={errors.startDate}>
            <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="종료일" error={errors.endDate}>
            <input type="date" className={inputClass} value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="라벨">
            <select className={inputClass} value={labelId} onChange={(e) => setLabelId(e.target.value)}>
              <option value="">라벨 없음</option>
              {labels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.emoji} {l.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="담당자" error={errors.manager}>
            <input className={inputClass} value={manager} onChange={(e) => setManager(e.target.value)} />
          </Field>
        </div>
        <Field label="연결할 투어" hint="투어관리의 투어와 연결하면 함께 추적할 수 있습니다.">
          <select className={inputClass} value={tourId} onChange={(e) => setTourId(e.target.value)}>
            <option value="">연결 안 함</option>
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.startDate}~{t.endDate})
              </option>
            ))}
          </select>
        </Field>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">세부 일정</span>
            <button type="button" className={btn.ghost} onClick={() => setItems((a) => [...a, { time: "09:00", place: "" }])}>
              <Plus className="h-4 w-4" /> 추가
            </button>
          </div>
          {items.length === 0 && <p className="text-xs text-slate-500">시간별 장소를 추가할 수 있습니다.</p>}
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex gap-2">
                <input type="time" className={`${inputBase} w-28`} value={it.time} onChange={(e) => setItem(i, { time: e.target.value })} />
                <input className={inputClass} value={it.place} placeholder="장소" onChange={(e) => setItem(i, { place: e.target.value })} />
                <button type="button" className={btn.ghost} onClick={() => setItems((a) => a.filter((_, idx) => idx !== i))} aria-label="삭제">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {Object.entries(errors).find(([k]) => k.startsWith("items"))?.[1] && (
            <p className="mt-1 text-xs text-red-600">{Object.entries(errors).find(([k]) => k.startsWith("items"))?.[1]}</p>
          )}
        </div>
        <Field label="메모" error={errors.note}>
          <textarea className={`${inputClass} min-h-[72px]`} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
