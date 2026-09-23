"use client";

import React, { useRef, useEffect } from "react";
import { X } from "lucide-react";
import type { EventType } from "@/types/schedule";

interface LabelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  label: EventType | null;
  isLoading: boolean;
  error: string | null;
  onDelete: (labelId: number) => void;
  onEdit: (label: EventType) => void;
}

export default function LabelDetailModal({
  isOpen,
  onClose,
  label,
  isLoading,
  error,
  onDelete,
  onEdit,
}: LabelDetailModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={modalRef}
      className="modal p-6 rounded-lg shadow-xl backdrop:bg-gray-900/50 flex justify-center items-center"
      onClose={onClose}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">라벨 상세 정보</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        {isLoading ? (
          <div className="text-center text-gray-500">라벨 정보 불러오는 중...</div>
        ) : error ? (
          <div className="text-center text-red-500">오류: {error}</div>
        ) : label ? (
          <div className="space-y-4">
            <p>
              <strong>ID:</strong> {label.id}
            </p>
            <p>
              <strong>이름:</strong> {label.name} ({label.emoji})
            </p>
            <p>
              <strong>기본 장소:</strong> {label.defaultPlace || "없음"}
            </p>
            <p>
              <strong>기본 담당자:</strong> {label.defaultManager || "없음"}
            </p>
            <p className={`${label.color} p-2 rounded-md`}>
              <strong>색상:</strong> {label.color.split(" ")[0].replace("bg-", "")}
            </p>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => onDelete(label.id)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                삭제하기
              </button>
              <button
                onClick={() => onEdit(label)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                수정하기
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">라벨을 찾을 수 없습니다.</div>
        )}
      </div>
    </dialog>
  );
}
