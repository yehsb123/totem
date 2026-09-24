"use client";

import React, { useMemo } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Line,
} from "recharts";
import {
  UsersIcon,
  Share2Icon,
  ShoppingCartIcon,
  GlobeIcon,
  PieChartIcon,
  UsersIcon as GroupIcon,
} from "../icons";
import type { DashboardOverview } from "@totem/shared";
import { formatKoreanUnit } from "@/lib/format";
import { useDashboardData } from "../DashboardData";
import { PIE_COLORS } from "../constants";

// InsightCard 컴포넌트
const InsightCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col h-full">
    <div className="flex items-center mb-4">
      <h3 className="ml-4 text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="flex-grow">{children}</div>
  </div>
);

// StatCard 컴포넌트
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}
const StatCard = ({ title, value, icon }: StatCardProps) => (
  <div className="bg-white p-4 rounded-xl shadow-lg flex flex-col items-start justify-between h-32">
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white shadow-md mb-2">
      {icon}
    </div>
    <p className="text-sm text-gray-500 font-semibold">{title}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
  </div>
);

// 종합 현황판 컴포넌트
interface ComprehensiveDashboardProps {
  summaryMetrics: DashboardOverview;
  selectedMonth: string;
}

const ComprehensiveDashboard = ({
  summaryMetrics,
  selectedMonth,
}: ComprehensiveDashboardProps) => {
  const {
    monthlyVisitorsData,
    monthlyGenderAgeDistributionData,
    monthlyInternationalVisitors,
    getCompanionTypeByMonth,
    getTravelTypeByMonth,
    getDomesticSpendingByMonth,
    getInternationalSpendingByMonth,
  } = useDashboardData();
  const formattedTotalVisitors = summaryMetrics.totalVisitors.toLocaleString();
  const formattedTotalSpending =
    formatKoreanUnit(summaryMetrics.totalTourismSpending) + "원";
  const formattedSnsMentions =
    summaryMetrics.snsMentions > 0
      ? summaryMetrics.snsMentions.toLocaleString() + "회"
      : "데이터 없음";

  const visitorGrowthRate = useMemo(() => {
    const currentIndex = monthlyVisitorsData.findIndex(
      (item) => item.name === selectedMonth
    );
    if (currentIndex <= 0) return "N/A";
    const currentVisitors = monthlyVisitorsData[currentIndex].방문자수;
    const prevVisitors = monthlyVisitorsData[currentIndex - 1].방문자수;
    const rate = ((currentVisitors - prevVisitors) / prevVisitors) * 100;
    return `${rate.toFixed(1)}%`;
  }, [selectedMonth, monthlyVisitorsData]);

  const getVisitorGrowthIcon = () => {
    const rate = parseFloat(visitorGrowthRate);
    if (isNaN(rate))
      return (
        <span role="img" aria-label="growth-icon">
          ➖
        </span>
      );
    if (rate > 0)
      return (
        <span role="img" aria-label="growth-up-icon">
          📈
        </span>
      );
    if (rate < 0)
      return (
        <span role="img" aria-label="growth-down-icon">
          📉
        </span>
      );
    return (
      <span role="img" aria-label="growth-no-change-icon">
        ➖
      </span>
    );
  };

  const topSpendingCategory = useMemo(() => {
    const domesticData = getDomesticSpendingByMonth(selectedMonth);
    const internationalData = getInternationalSpendingByMonth(selectedMonth);
    const combinedData = [
      ...(domesticData || []),
      ...(internationalData || []),
    ];
    if (combinedData.length === 0) return "데이터 없음";
    const spendingMap = combinedData.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.spending;
      return acc;
    }, {} as Record<string, number>);
    const filteredEntries = Object.entries(spendingMap).filter(
      ([category]) => category !== "기타"
    );
    if (filteredEntries.length === 0)
      return spendingMap["기타"] ? "기타" : "데이터 없음";
    const sortedCategories = filteredEntries.sort(([, a], [, b]) => b - a);
    return sortedCategories[0]?.[0] || "데이터 없음";
  }, [selectedMonth, getDomesticSpendingByMonth, getInternationalSpendingByMonth]);

  const topCompanionType = useMemo(() => {
    const monthlyData = getCompanionTypeByMonth(selectedMonth);
    if (monthlyData.length === 0) return "데이터 없음";
    const filteredData = monthlyData.filter((item) => item.name !== "기타가족");
    if (filteredData.length === 0)
      return (
        monthlyData.find((item) => item.name === "기타가족")?.name ||
        "데이터 없음"
      );
    const topType = filteredData.reduce((prev, current) =>
      prev.value > current.value ? prev : current
    );
    return topType.name;
  }, [selectedMonth, getCompanionTypeByMonth]);

  const topGenderAge = useMemo(() => {
    const monthData = monthlyGenderAgeDistributionData.find(
      (d) => d.month === selectedMonth
    );
    if (!monthData) return "N/A";
    let topAgeGroup = "N/A";
    let maxTotalRatio = 0;
    monthData.distribution.forEach((item) => {
      const totalRatio = item.maleRatio + item.femaleRatio;
      if (totalRatio > maxTotalRatio) {
        maxTotalRatio = totalRatio;
        topAgeGroup = item.ageGroup;
      }
    });
    return topAgeGroup;
  }, [selectedMonth, monthlyGenderAgeDistributionData]);

  // --- 새 차트를 위한 데이터 가공 ---
  const combinedChartData = useMemo(() => {
    return monthlyVisitorsData.map((visitor) => {
      const domesticSpending = getDomesticSpendingByMonth(visitor.name).reduce(
        (sum, item) => sum + item.spending,
        0
      );
      const internationalSpending = getInternationalSpendingByMonth(
        visitor.name
      ).reduce((sum, item) => sum + item.spending, 0);
      return {
        name: visitor.name.slice(5) + "월",
        "총 방문자": visitor.방문자수,
        "총 소비액": domesticSpending + internationalSpending,
      };
    });
  }, [getDomesticSpendingByMonth, getInternationalSpendingByMonth, monthlyVisitorsData]);

  const visitorCompositionData = useMemo(() => {
    return monthlyVisitorsData.map((domestic) => {
      const international = monthlyInternationalVisitors.find(
        (intl) => intl.month === domestic.name
      );
      return {
        name: domestic.name.slice(5) + "월",
        내국인: domestic.방문자수,
        외국인: international ? international.totalVisitors : 0,
      };
    });
  }, [monthlyInternationalVisitors, monthlyVisitorsData]);

  //  관광 유형 도넛 차트 데이터
  const travelTypeDonutData = useMemo(
    () => getTravelTypeByMonth(selectedMonth),
    [selectedMonth, getTravelTypeByMonth]
  );

  //  가장 인기있는 관광 유형
  const topTravelType = useMemo(() => {
    if (!travelTypeDonutData || travelTypeDonutData.length === 0) {
      return "데이터 없음";
    }
    return [...travelTypeDonutData].sort((a, b) => b.value - a.value)[0].name;
  }, [travelTypeDonutData]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {selectedMonth} 종합현황판
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="월 방문자 수"
          value={`${formattedTotalVisitors}명`}
          icon={<UsersIcon className="text-white" />}
        />
        <StatCard
          title="전달 대비 방문자 증감률"
          value={visitorGrowthRate}
          icon={getVisitorGrowthIcon()}
        />
        <StatCard
          title="총 관광 소비액"
          value={`₩ ${formattedTotalSpending}`}
          icon={<ShoppingCartIcon className="text-white" />}
        />
        <StatCard
          title="인기 소비 품목"
          value={topSpendingCategory}
          icon={<PieChartIcon className="text-white" />}
        />
        <StatCard
          title="가장 많이 방문한 연령층"
          value={topGenderAge}
          icon={<GroupIcon className="text-white" />}
        />
        <StatCard
          title="인기 동반유형"
          value={topCompanionType}
          icon={<UsersIcon className="text-white" />}
        />
        <StatCard
          title="미디어 언급량"
          value={formattedSnsMentions}
          icon={<Share2Icon className="text-white" />}
        />
        <StatCard
          title="인기 관광유형 (Top 1)"
          value={topTravelType}
          icon={<GlobeIcon className="text-white" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <InsightCard title="월별 방문자 및 소비액 트렌드">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={combinedChartData}>
              <defs>
                <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#3B82F6"
                tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#FF8042"
                tickFormatter={(value) => `${(value / 100000000).toFixed(1)}억`}
              />
              <Tooltip
                formatter={(value, name) => [
                  `${Number(value).toLocaleString()}${
                    String(name) === "총 방문자" ? "명" : "원"
                  }`,
                  name,
                ]}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="총 방문자"
                fill="url(#colorBlue)"
                stroke="#3B82F6"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="총 소비액"
                stroke="#FF8042"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </InsightCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightCard title="월별 방문자 구성 (내국인/외국인)">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={visitorCompositionData}
              margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis
                tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
              />
              <Tooltip
                formatter={(value) => `${Number(value).toLocaleString()}명`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="내국인"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
              />
              <Area
                type="monotone"
                dataKey="외국인"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
              />
            </AreaChart>
          </ResponsiveContainer>
        </InsightCard>
        {/* --- 관광 유형을 보여주는 도넛 차트 --- */}
        <InsightCard title={`'${selectedMonth}' 주요 관광 유형`}>
          <div style={{ width: "100%", height: 300, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={travelTypeDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => {
                    const p = typeof percent === "number" ? percent : 0;
                    return `${name} ${(p * 100).toFixed(0)}%`;
                  }}
                >
                  {travelTypeDonutData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toLocaleString()} 건`,
                    "언급량",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-sm text-gray-500">Top 유형</p>
              <p className="text-2xl font-bold text-indigo-600">
                {topTravelType}
              </p>
            </div>
            {travelTypeDonutData.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {travelTypeDonutData.map((entry, index) => (
                  <div
                    key={`travel-legend-${index}`}
                    className="flex items-center text-sm text-gray-600"
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{
                        backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                      }}
                    />
                    {entry.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </InsightCard>
      </div>
    </div>
  );
};

export default ComprehensiveDashboard;
