"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Smile } from "lucide-react";

interface ColorOption {
  value: string;
  label: string;
}

interface EventTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    emoji: string;
    color: string;
    defaultPlace: string;
    defaultManager: string;
  }) => void;
  emojiList: string[];
  colorOptions: ColorOption[];
}

export default function EventTypeModal({
  isOpen,
  onClose,
  onSubmit,
  emojiList,
  colorOptions,
}: EventTypeModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState("bg-gray-100 border-gray-200 text-gray-700");
  const [defaultPlace, setDefaultPlace] = useState("");
  const [defaultManager, setDefaultManager] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
      setName("");
      setEmoji("");
      setColor("bg-gray-100 border-gray-200 text-gray-700");
      setDefaultPlace("");
      setDefaultManager("");
      setShowEmojiPicker(false);
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    setShowEmojiPicker(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!name || !emoji || !color) {
      alert("일정 타입 이름, 이모티콘, 색상을 입력해주세요.");
      return;
    }
    onSubmit({ name, emoji, color, defaultPlace, defaultManager });
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={modalRef}
      className="modal p-6 rounded-lg shadow-xl backdrop:bg-gray-900/50 flex justify-center items-center"
      onClose={handleClose}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">새 일정 타입 추가</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="eventTypeName" className="block text-sm font-medium text-gray-700 mb-1">
              타입 이름
            </label>
            <input
              type="text"
              id="eventTypeName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 회의, 프로젝트, 휴가"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <label htmlFor="eventTypeEmoji" className="block text-sm font-medium text-gray-700 mb-1">
              이모티콘
            </label>
            <div className="flex items-center">
              <input
                type="text"
                id="eventTypeEmoji"
                value={emoji}
                readOnly
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                placeholder="선택하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-lg"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="이모티콘 선택"
              >
                <Smile className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute z-20 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 max-h-60 overflow-y-auto"
                style={{ width: "100%", left: 0 }}
              >
                <div className="grid grid-cols-6 gap-1">
                  {emojiList.map((em, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setEmoji(em);
                        setShowEmojiPicker(false);
                      }}
                      className="p-1 rounded-sm hover:bg-gray-200 text-xl text-center transition-colors"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="eventTypeColor" className="block text-sm font-medium text-gray-700 mb-1">
              색상
            </label>
            <select
              id="eventTypeColor"
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
          <div>
            <label htmlFor="eventTypeDefaultPlace" className="block text-sm font-medium text-gray-700 mb-1">
              기본 장소/설명 (선택)
            </label>
            <input
              type="text"
              id="eventTypeDefaultPlace"
              value={defaultPlace}
              onChange={(e) => setDefaultPlace(e.target.value)}
              placeholder="해당 타입 일정 추가 시 기본 장소"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="eventTypeDefaultManager" className="block text-sm font-medium text-gray-700 mb-1">
              기본 담당자 (선택)
            </label>
            <input
              type="text"
              id="eventTypeDefaultManager"
              value={defaultManager}
              onChange={(e) => setDefaultManager(e.target.value)}
              placeholder="기본 담당자를 입력하세요."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
            추가
          </button>
        </div>
      </div>
    </dialog>
  );
}
