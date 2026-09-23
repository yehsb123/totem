import React from "react";
import {
  LayoutDashboardIcon,
  UsersIcon,
  Share2Icon,
  ShoppingCartIcon,
  GlobeIcon,
  PieChartIcon,
} from "./icons";

// 차트 색상 설정
export const PIE_COLORS = [
  "#3B82F6",
  "#82ca9d",
  "#FFBB28",
  "#FF8042",
  "#0088FE",
  "#AF19FF",
  "#FF6B6B",
  "#1ABC9C",
  "#9B59B6",
];

export const COMPANION_PIE_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#78716c",
];

export const TRAVEL_PIE_COLORS = ["#22c55e", "#f97316", "#8b5cf6", "#3b82f6"];

// 메뉴 아이템 설정
export const menuItems = [
  { label: "종합 현황판", icon: React.createElement(LayoutDashboardIcon) },
  { label: "방문자 통계(국내)", icon: React.createElement(UsersIcon) },
  { label: "소셜미디어 언급량", icon: React.createElement(Share2Icon) },
  { label: "관광소비(국내)", icon: React.createElement(ShoppingCartIcon) },
  { label: "관광소비(국외)", icon: React.createElement(GlobeIcon) },
  { label: "국가별 관광 방문객 수", icon: React.createElement(PieChartIcon) },
];
