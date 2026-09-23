"use client";

import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { DEFAULT_COLOR } from "@/constants/schedule";

interface ColorOption {
  value: string;
  label: string;
}

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    startDate: string;
    endDate: string;
    place: string;
    manager: string;
    color: string;
  }) => void;
  selectedDate: string | null;
  colorOptions: ColorOption[];
  initialName?: string;
  initialPlace?: string;
  initialManager?: string;
}

export default function NewEventModal({
  isOpen,
  onClose,
  onSubmit,
  selectedDate,
  colorOptions,
  initialName = "",
  initialPlace = "",
  initialManager = "",
}: NewEventModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null);

  const [name, setName] = useState(initialName);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [place, setPlace] = useState(initialPlace);
  const [manager, setManager] = useState(initialManager);
  const [color, setColor] = useState(DEFAULT_COLOR);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
      setName(initialName);
      setPlace(initialPlace);
      setManager(initialManager);
      setColor(DEFAULT_COLOR);
      const dateVal = selectedDate || "";
      setStartDate(dateVal);
      setEndDate(dateVal);
    } else {
      modalRef.current?.close();
    }
  }, [isOpen, selectedDate, initialName, initialPlace, initialManager]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    if (!name || !startDate || !endDate) {
      alert("일정 이름, 시작 날짜, 종료 날짜를 입력해주세요.");
      return;
    }
    onSubmit({ name, startDate, endDate, place, manager, color });
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={modalRef}
      className="modal p-6 rounded-lg shadow-xl backdrop:bg-gray-900/50 flex justify-center items-center"
      onClose={handleClose}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">새 일정 생성</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="newEventName" className="block text-sm font-medium text-gray-700 mb-1">
              일정 이름
            </label>
            <input
              type="text"
              id="newEventName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="새로운 일정 이름을 입력하세요."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="newEventStartDate" className="block text-sm font-medium text-gray-700 mb-1">
              시작 날짜
            </label>
            <input
              type="date"
              id="newEventStartDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="newEventEndDate" className="block text-sm font-medium text-gray-700 mb-1">
              종료 날짜
            </label>
            <input
              type="date"
              id="newEventEndDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="newEventPlace" className="block text-sm font-medium text-gray-700 mb-1">
              장소/설명
            </label>
            <input
              type="text"
              id="newEventPlace"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="일정 장소 또는 설명을 입력하세요."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="newEventManager" className="block text-sm font-medium text-gray-700 mb-1">
              담당자
            </label>
            <input
              type="text"
              id="newEventManager"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              placeholder="담당자를 입력하세요."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="newEventColor" className="block text-sm font-medium text-gray-700 mb-1">
              색상
            </label>
            <select
              id="newEventColor"
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
            생성
          </button>
        </div>
      </div>
    </dialog>
  );
}
