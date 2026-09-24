import type { LabelColor } from "@totem/shared";

/**
 * 라벨 색상 키 → Tailwind 클래스. DB 에는 키(blue 등)만 저장한다.
 * Tailwind 는 소스에 적힌 클래스만 생성하므로 동적 문자열 조합(`bg-${c}-500`) 대신 이 표를 쓴다.
 */
export const LABEL_COLOR_CLASS: Record<LabelColor, { chip: string; bar: string; dot: string }> = {
  blue: { chip: "bg-blue-100 text-blue-800 border-blue-200", bar: "bg-blue-500", dot: "bg-blue-500" },
  red: { chip: "bg-red-100 text-red-800 border-red-200", bar: "bg-red-500", dot: "bg-red-500" },
  purple: { chip: "bg-purple-100 text-purple-800 border-purple-200", bar: "bg-purple-500", dot: "bg-purple-500" },
  green: { chip: "bg-green-100 text-green-800 border-green-200", bar: "bg-green-500", dot: "bg-green-500" },
  yellow: { chip: "bg-yellow-100 text-yellow-800 border-yellow-200", bar: "bg-yellow-500", dot: "bg-yellow-500" },
  teal: { chip: "bg-teal-100 text-teal-800 border-teal-200", bar: "bg-teal-500", dot: "bg-teal-500" },
  indigo: { chip: "bg-indigo-100 text-indigo-800 border-indigo-200", bar: "bg-indigo-500", dot: "bg-indigo-500" },
  pink: { chip: "bg-pink-100 text-pink-800 border-pink-200", bar: "bg-pink-500", dot: "bg-pink-500" },
  gray: { chip: "bg-gray-100 text-gray-800 border-gray-200", bar: "bg-gray-500", dot: "bg-gray-500" },
};

export const colorOf = (c: LabelColor | null | undefined) => LABEL_COLOR_CLASS[c ?? "gray"] ?? LABEL_COLOR_CLASS.gray;
