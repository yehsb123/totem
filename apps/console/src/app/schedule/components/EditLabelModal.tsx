"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Smile } from "lucide-react";
import type { EventType } from "@/types/schedule";

interface ColorOption {
  value: string;
  label: string;
}

interface EditLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    emoji: string;
    color: string;
    defaultPlace: string;
    defaultManager: string;
  }) => void;
  label: EventType | null;
  emojiList: string[];
  colorOptions: ColorOption[];
}

export default function EditLabelModal({
  isOpen,
  onClose,
  onSubmit,
  label,
  emojiList,
  colorOptions,
}: EditLabelModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [color, setColor] = useState("");
  const [defaultPlace, setDefaultPlace] = useState("");
  const [defaultManager, setDefaultManager] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (isOpen && label) {
      modalRef.current?.showModal();
      setName(label.name);
      setEmoji(label.emoji);
      setColor(label.color);
      setDefaultPlace(label.defaultPlace || "");
      setDefaultManager(label.defaultManager || "");
      setShowEmojiPicker(false);
    } else {
      modalRef.current?.close();
    }
  }, [isOpen, label]);

  const handleClose = () => {
    setShowEmojiPicker(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!name || !emoji || !color) {
      alert("이름, 이모티콘, 색상을 입력해주세요.");
      return;
    }
    onSubmit({ name, emoji, color, defaultPlace, defaultManager });
  };

  if (!isOpen || !label) return null;

  return (
    <dialog
      ref={modalRef}
      className="modal p-6 rounded-lg shadow-xl backdrop:bg-gray-900/50 flex justify-center items-center"
      onClose={handleClose}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">라벨 수정</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="editLabelName" className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              type="text"
              id="editLabelName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="라벨 이름을 입력하세요."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <label htmlFor="editLabelEmoji" className="block text-sm font-medium text-gray-700 mb-1">
              이모티콘
            </label>
            <div className="flex items-center">
              <input
                type="text"
                id="editLabelEmoji"
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
            <label htmlFor="editLabelColor" className="block text-sm font-medium text-gray-700 mb-1">
              색상
            </label>
            <select
              id="editLabelColor"
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
          </div>
          <div>
            <label htmlFor="editLabelDefaultPlace" className="block text-sm font-medium text-gray-700 mb-1">
              기본 장소 (선택)
            </label>
            <input
              type="text"
              id="editLabelDefaultPlace"
              value={defaultPlace}
              onChange={(e) => setDefaultPlace(e.target.value)}
              placeholder="기본 장소를 입력하세요."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="editLabelDefaultManager" className="block text-sm font-medium text-gray-700 mb-1">
              기본 담당자 (선택)
            </label>
            <input
              type="text"
              id="editLabelDefaultManager"
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
            저장
          </button>
        </div>
      </div>
    </dialog>
  );
}
