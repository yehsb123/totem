"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function ResourceCard({ title, description, buttonText, href }) {
  const router = useRouter();

  return (
    <div className="p-6 border border-gray-200 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:border-indigo-400">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-sm text-gray-500 min-h-[40px]">{description}</p>
      <button
        onClick={() => router.push(href)}
        className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-md text-sm font-medium transition-colors duration-300 hover:bg-indigo-600"
      >
        {buttonText} →
      </button>
    </div>
  );
}
