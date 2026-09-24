"use client";

import { useState } from "react";
import type { ScheduleLabel } from "@totem/shared";
import { Modal, btn, inputClass } from "@/components/ui";
import { errorMessage } from "@/lib/api";

/** 라벨을 쓰는 일정이 있으면 옮길 라벨(또는 라벨 없음)을 고르게 한 뒤 삭제 */
export default function DeleteLabelModal(props: Omit<Parameters<typeof DeleteLabelForm>[0], "label"> & { label: ScheduleLabel | null }) {
  // 라벨이 바뀌면 key 로 새로 마운트 → 선택값·오류가 이전 라벨 것으로 남지 않는다
  return props.label ? <DeleteLabelForm key={props.label.id} {...props} label={props.label} /> : null;
}

function DeleteLabelForm({
  label,
  labels,
  onClose,
  onConfirm,
}: {
  label: ScheduleLabel;
  labels: ScheduleLabel[];
  onClose: () => void;
  onConfirm: (reassignTo?: string) => Promise<void>;
}) {
  const [target, setTarget] = useState("none");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const inUse = label.eventCount > 0;

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(inUse ? target : undefined);
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="라벨 삭제"
      width="max-w-md"
      footer={
        <>
          <button className={btn.secondary} onClick={onClose}>
            취소
          </button>
          <button className={btn.danger} onClick={confirm} disabled={busy}>
            삭제
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-slate-700">
        <p>
          <strong>
            {label.emoji} {label.name}
          </strong>{" "}
          라벨을 삭제합니다.
        </p>
        {inUse && (
          <>
            <p>이 라벨을 쓰는 일정이 {label.eventCount}건 있습니다. 일정을 어느 라벨로 옮길까요?</p>
            <select className={inputClass} value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="none">라벨 없음</option>
              {labels
                .filter((l) => l.id !== label.id)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.emoji} {l.name}
                  </option>
                ))}
            </select>
          </>
        )}
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
