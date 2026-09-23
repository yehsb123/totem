"use client";

import React, { useRef, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const menuItems = [
    "알림 설정",
    "테마 설정",
    "데이터 내보내기",
    "사용자 정보 관리",
    "보안 및 개인 정보",
    "언어 및 지역",
    "청구 및 결제",
    "도움말 및 지원",
  ];

  return (
    <dialog
      ref={modalRef}
      className="modal p-6 rounded-lg shadow-xl backdrop:bg-gray-900/50 flex justify-center items-center"
      onClose={onClose}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">설정</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4 text-gray-700">
          {menuItems.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer"
            >
              <span>{item}</span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          ))}
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer border-t pt-4 mt-4 border-gray-100">
            <span>계정 관리</span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer text-red-600">
            <span>로그아웃</span>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </div>
        </div>
      </div>
    </dialog>
  );
}
