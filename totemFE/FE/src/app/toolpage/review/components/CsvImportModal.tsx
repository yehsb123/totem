"use client";

import { useState } from "react";
import { saveReviewsFromCsv } from "../reviewApi";

interface CsvImportModalProps {
  planId: number;
  tourName: string;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function CsvImportModal({
  planId,
  tourName,
  onClose,
  onSaveSuccess,
}: CsvImportModalProps) {
  const [csvUrl, setCsvUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await saveReviewsFromCsv(planId, csvUrl);

    if (result.success) {
      setMessage("\u2705 폼 저장 완료! 잠시 후 자동으로 닫힙니다.");
      onSaveSuccess();
      setTimeout(onClose, 2000);
    } else {
      setMessage(`\u274C ${result.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
      <div className="relative p-8 bg-white w-96 mx-auto rounded-lg shadow-xl">
        <h3 className="text-xl font-bold mb-4">
          &apos;{tourName}&apos; 리뷰 저장
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Google Sheets &apos;CSV로 게시&apos; 링크를 입력해주세요.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="w-full p-2 mb-4 border rounded-md"
            placeholder="예: https://docs.google.com/spreadsheets/..."
            value={csvUrl}
            onChange={(e) => setCsvUrl(e.target.value)}
            required
          />
          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              onClick={onClose}
            >
              닫기
            </button>
          </div>
          {message && (
            <div
              className={`mt-4 text-center ${
                message.startsWith("\u274C") ? "text-red-500" : "text-green-500"
              }`}
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
