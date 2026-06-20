"use client";

import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import type { Schedule } from "@/types/schedule";
import { DEFAULT_COLOR } from "@/constants/schedule";

interface ColorOption {
  value: string;
  label: string;
}

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    startDate: string;
    endDate: string;
    place: string;
    manager: string;
    note: string;
    color: string;
  }) => void;
  schedule: Schedule | null;
  colorOptions: ColorOption[];
}

export default function EditEventModal({
  isOpen,
  onClose,
  onSubmit,
  schedule,
  colorOptions,
}: EditEventModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [place, setPlace] = useState("");
  const [manager, setManager] = useState("");
  const [note, setNote] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);

  useEffect(() => {
    if (isOpen && schedule) {
      modalRef.current?.showModal();
      setName(schedule.name);
      setStartDate(schedule.startDate);
      setEndDate(schedule.endDate);
      setPlace(schedule.schedule?.[0]?.place || "");
      setManager(schedule.manager);
      setColor(schedule.color || DEFAULT_COLOR);
      setNote("");
    } else {
      modalRef.current?.close();
    }
  }, [isOpen, schedule]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    if (!name || !startDate || !endDate) {
      alert("일정 이름, 시작 날짜, 종료 날짜를 입력해주세요.");
      return;
    }
    onSubmit({ name, startDate, endDate, place, manager, note, color });
  };

  if (!isOpen || !schedule) return null;

  return (
    <dialog
      ref={modalRef}
      className="modal p-6 rounded-lg shadow-xl backdrop:bg-gray-900/50 flex justify-center items-center"
      onClose={handleClose}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">일정 편집</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="editEventName" className="block text-sm font-medium text-gray-700 mb-1">
              일정 이름
            </label>
            <input
              type="text"
              id="editEventName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="일정 이름을 입력하세요."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="editEventStartDate" className="block text-sm font-medium text-gray-700 mb-1">
              시작 날짜
            </label>
            <input
              type="date"
              id="editEventStartDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="editEventEndDate" className="block text-sm font-medium text-gray-700 mb-1">
              종료 날짜
            </label>
            <input
              type="date"
              id="editEventEndDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="editEventPlace" className="block text-sm font-medium text-gray-700 mb-1">
              장소/설명
            </label>
            <input
              type="text"
              id="editEventPlace"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="일정 장소 또는 설명을 입력하세요."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="editEventManager" className="block text-sm font-medium text-gray-700 mb-1">
              담당자
            </label>
            <input
              type="text"
              id="editEventManager"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              placeholder="담당자를 입력하세요."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="editEventNote" className="block text-sm font-medium text-gray-700 mb-1">
              수정 사유
            </label>
            <input
              type="text"
              id="editEventNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="일정 수정 사유를 입력하세요."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="editEventColor" className="block text-sm font-medium text-gray-700 mb-1">
              색상
            </label>
            <select
              id="editEventColor"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${color}`}
            >
              {colorOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className={`text-xs mt-1 px-2 py-1 rounded ${color}`}>선택된 색상 미리보기</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </dialog>
  );
}
