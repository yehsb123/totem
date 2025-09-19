"use client";

import React, { useState, useMemo } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Treemap,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import ThreeDPieChart from "./3dPieChart";
import {
  CalendarIcon,
  LayoutDashboardIcon,
  UsersIcon,
  Share2Icon,
  ShoppingCartIcon,
  GlobeIcon,
  PieChartIcon,
  UsersIcon as GroupIcon,
} from "./icons";

// --- 데이터 파일 import ---
import {
  monthlyVisitorsData,
  monthlyGenderAgeDistributionData,
} from "./data/visitors";
import {
  jejuMentionsData,
  monthlyCompanionTypeData,
  monthlyTravelTypeData,
} from "./data/sns";
import { monthlyInternationalVisitors } from "./data/countries";
import {
  getSummaryMetrics,
  getDomesticSpendingByMonth,
  getInternationalSpendingByMonth,
} from "./data/all";

// --- 데이터 헬퍼 함수 ---
const getJejuMentionsForChart = (month: string) => {
  const endIndex = jejuMentionsData.findIndex((d) => d.name === month);
  if (endIndex === -1) return jejuMentionsData.slice(-12);
  const startIndex = Math.max(0, endIndex - 11);
  return jejuMentionsData.slice(startIndex, endIndex + 1);
};

const getCompanionTypeByMonth = (month: string) => {
  const monthData = monthlyCompanionTypeData.find(
    (data) => data.month === month
  );
  return monthData ? monthData.companionTypes : [];
};

const getTravelTypeByMonth = (month: string) => {
  const monthData = monthlyTravelTypeData.find((data) => data.month === month);
  return monthData ? monthData.travelTypes : [];
};

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
// --- 컴포넌트 정의 ---

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

// 차트 색상 설정
const PIE_COLORS = [
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
const COMPANION_PIE_COLORS = [
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
const TRAVEL_PIE_COLORS = ["#22c55e", "#f97316", "#8b5cf6", "#3b82f6"];

// 종합 현황판 컴포넌트
interface ComprehensiveDashboardProps {
  summaryMetrics: ReturnType<typeof getSummaryMetrics>;
  selectedMonth: string;
}

const ComprehensiveDashboard = ({
  summaryMetrics,
  selectedMonth,
}: ComprehensiveDashboardProps) => {
  const formattedTotalVisitors = summaryMetrics.totalVisitors.toLocaleString();
  const formattedTotalSpending =
    (summaryMetrics.totalTourismSpending / 100000000).toFixed(0) + "억";
  const formattedSnsMentions =
    summaryMetrics.totalSnsMentions > 0
      ? summaryMetrics.totalSnsMentions.toLocaleString() + "회"
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
  }, [selectedMonth]);

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
  }, [selectedMonth]);

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
  }, [selectedMonth]);

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
  }, [selectedMonth]);

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
  }, []);

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
  }, []);

  //  관광 유형 도넛 차트 데이터
  const travelTypeDonutData = useMemo(
    () => getTravelTypeByMonth(selectedMonth),
    [selectedMonth]
  );

  //  가장 인기있는 관광 유형
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
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString()}${
                    name === "총 방문자" ? "명" : "원"
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
                formatter={(value: number) => `${value.toLocaleString()}명`}
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
        {/* --- ✨ 관광 유형을 보여주는 새로운 도넛 차트 --- */}
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
                  formatter={(value: number) => [
                    `${value.toLocaleString()} 건`,
                    "언급량",
                  ]}
                />
                {/* 기본 Legend 사용 대신 아래 커스텀 범례를 사용합니다. */}
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

// 방문자 통계(국내) 컴포넌트
const VisitorStatsDomestic = ({ selectedMonth }: { selectedMonth: string }) => {
  const genderAgeData = useMemo(() => {
    const monthData = monthlyGenderAgeDistributionData.find(
      (d) => d.month === selectedMonth
    );
    return monthData ? monthData.distribution : [];
  }, [selectedMonth]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {selectedMonth} 방문자 통계 (국내)
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md h-96">
          <h3 className="font-bold text-gray-700 mb-2">월별 방문자 수</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyVisitorsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
              />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toLocaleString()}명`,
                  "방문자수",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="방문자수"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md h-96 flex flex-col items-center justify-center">
          <h3 className="font-bold text-gray-700 mb-2">성연령 분포</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={genderAgeData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ageGroup" />
              <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toFixed(1)}%`,
                  name === "maleRatio" ? "남성" : "여성",
                ]}
              />
              {/* 커스텀 범례 */}
              <g>
                <foreignObject x="10" y="10" width="200" height="40">
                  <div className="flex gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <span
                        className="inline-block w-3 h-3 rounded-sm"
                        style={{ background: "#36A2EB" }}
                      />
                      남성
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="inline-block w-3 h-3 rounded-sm"
                        style={{ background: "#FF6384" }}
                      />
                      여성
                    </div>
                  </div>
                </foreignObject>
              </g>
              <Bar dataKey="maleRatio" stackId="a" fill="#36A2EB" name="남성" />
              <Bar
                dataKey="femaleRatio"
                stackId="a"
                fill="#FF6384"
                name="여성"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// 소셜미디어 언급량 컴포넌트
const SocialMediaMentions = ({ selectedMonth }: { selectedMonth: string }) => {
  const jejuMentionsChartData = useMemo(
    () => getJejuMentionsForChart(selectedMonth),
    [selectedMonth]
  );
  const companionTypeChartData = useMemo(
    () => getCompanionTypeByMonth(selectedMonth),
    [selectedMonth]
  );
  const travelTypeChartData = useMemo(
    () => getTravelTypeByMonth(selectedMonth),
    [selectedMonth]
  );

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {selectedMonth} 소셜미디어 언급량
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md h-80">
          <h3 className="font-bold text-gray-700 mb-2">
            SNS 제주도 언급량 (최근 12개월)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={jejuMentionsChartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                fontSize={12}
              />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toLocaleString()}회`,
                  "언급량",
                ]}
              />
              <Area
                type="monotone"
                dataKey="언급량"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorUv)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md h-80 flex flex-col items-center justify-center">
          <h3 className="font-bold text-gray-700 mb-2">동반유형</h3>
          <div className="w-full h-full relative">
            <ThreeDPieChart
              data={companionTypeChartData}
              colors={COMPANION_PIE_COLORS}
              radius={2.5}
              height={0.5}
            />
            {companionTypeChartData.length > 0 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white bg-opacity-80 p-2 rounded-md shadow-sm text-sm">
                <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {companionTypeChartData.map((entry, index) => (
                    <li
                      key={`legend-companion-${index}`}
                      className="flex items-center"
                    >
                      <span
                        style={{
                          backgroundColor:
                            COMPANION_PIE_COLORS[
                              index % COMPANION_PIE_COLORS.length
                            ],
                        }}
                        className="inline-block w-3 h-3 rounded-full mr-2"
                      ></span>
                      {entry.name} (
                      {(
                        (entry.value /
                          companionTypeChartData.reduce(
                            (sum, d) => sum + d.value,
                            1
                          )) *
                        100
                      ).toFixed(0)}
                      %)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md h-80 col-span-1 lg:col-span-2 flex flex-col items-center justify-center">
          <h3 className="font-bold text-gray-700 mb-2">여행유형</h3>
          <div className="w-full h-full relative">
            <ThreeDPieChart
              data={travelTypeChartData}
              colors={TRAVEL_PIE_COLORS}
              radius={2.5}
              height={0.5}
            />
            {travelTypeChartData.length > 0 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white bg-opacity-80 p-2 rounded-md shadow-sm text-sm">
                <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {travelTypeChartData.map((entry, index) => (
                    <li
                      key={`legend-travel-${index}`}
                      className="flex items-center"
                    >
                      <span
                        style={{
                          backgroundColor:
                            TRAVEL_PIE_COLORS[index % TRAVEL_PIE_COLORS.length],
                        }}
                        className="inline-block w-3 h-3 rounded-full mr-2"
                      ></span>
                      {entry.name} (
                      {(
                        (entry.value /
                          travelTypeChartData.reduce(
                            (sum, d) => sum + d.value,
                            1
                          )) *
                        100
                      ).toFixed(0)}
                      %)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 관광소비(국내) 컴포넌트
const TourismConsumptionDomestic = ({
  selectedMonth,
}: {
  selectedMonth: string;
}) => {
  const spendingData = useMemo(
    () => getDomesticSpendingByMonth(selectedMonth),
    [selectedMonth]
  );
  const totalSpending = useMemo(
    () => spendingData.reduce((sum, item) => sum + item.spending, 0),
    [spendingData]
  );
  const pieChartData = useMemo(() => {
    if (totalSpending === 0) return [];
    const sortedData = [...spendingData].sort(
      (a, b) => b.spending - a.spending
    );
    const top5 = sortedData.slice(0, 5);
    const otherSpending = sortedData
      .slice(5)
      .reduce((sum, item) => sum + item.spending, 0);
    const chartData = top5.map((item) => ({
      name: item.category,
      value: (item.spending / totalSpending) * 100,
      rawAmount: item.spending,
    }));
    if (otherSpending > 0) {
      chartData.push({
        name: "기타",
        value: (otherSpending / totalSpending) * 100,
        rawAmount: otherSpending,
      });
    }
    return chartData;
  }, [spendingData, totalSpending]);
  const tableData = useMemo(() => {
    if (totalSpending === 0) return [];
    return [...spendingData]
      .sort((a, b) => b.spending - a.spending)
      .map((item) => ({
        name: item.category,
        rawAmount: item.spending,
        ratio: ((item.spending / totalSpending) * 100).toFixed(1),
      }));
  }, [spendingData, totalSpending]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">관광소비 (국내)</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md h-96 flex flex-col items-center justify-center relative">
          <h3 className="font-bold text-gray-700 mb-2">
            업종별 국내 관광 소비 비중
          </h3>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => {
                    const p = typeof percent === "number" ? percent : 0;
                    return `${name} ${(p * 100).toFixed(0)}%`;
                  }}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 text-center">
              선택된 날짜에 해당하는 데이터가 없습니다.
            </div>
          )}
          {totalSpending > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-sm text-gray-500">총 소비액</p>
              <p className="text-xl font-bold text-blue-600">
                ₩ {totalSpending.toLocaleString()}
              </p>
            </div>
          )}
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md h-96 overflow-auto">
          <h3 className="font-bold text-gray-700 mb-2">
            업종별 국내 관광 소비 현황
          </h3>
          {tableData.length > 0 ? (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">업종</th>
                  <th className="py-3 px-6 text-left">소비액</th>
                  <th className="py-3 px-6 text-left">소비 비중</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {tableData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-100"
                  >
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {item.rawAmount.toLocaleString()}원
                    </td>
                    <td className="py-3 px-6 text-left">{item.ratio}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-gray-500 text-center mt-4">
              선택된 날짜에 해당하는 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 관광소비(국외) 컴포넌트
interface InternationalSpendingItem {
  category: string;
  spending: number;
}
const TourismConsumptionForeign = ({
  internationalSpendingByMonth,
}: {
  internationalSpendingByMonth: InternationalSpendingItem[];
}) => {
  const totalSpending = useMemo(
    () => internationalSpendingByMonth.reduce((sum, d) => sum + d.spending, 0),
    [internationalSpendingByMonth]
  );
  const pieChartData = useMemo(() => {
    if (totalSpending === 0) return [];
    const sortedData = [...internationalSpendingByMonth].sort(
      (a, b) => b.spending - a.spending
    );
    const top5 = sortedData.slice(0, 5);
    const otherSpending = sortedData
      .slice(5)
      .reduce((sum, item) => sum + item.spending, 0);
    const chartData = top5.map((item: InternationalSpendingItem) => ({
      name: item.category,
      value: (item.spending / totalSpending) * 100,
      rawAmount: item.spending,
    }));
    if (otherSpending > 0) {
      chartData.push({
        name: "기타",
        value: (otherSpending / totalSpending) * 100,
        rawAmount: otherSpending,
      });
    }
    return chartData;
  }, [internationalSpendingByMonth, totalSpending]);
  const tableData = useMemo(() => {
    if (totalSpending === 0) return [];
    return [...internationalSpendingByMonth]
      .sort((a, b) => b.spending - a.spending)
      .map((item) => ({
        name: item.category,
        value: item.spending,
        ratio: ((item.spending / totalSpending) * 100).toFixed(1),
      }));
  }, [internationalSpendingByMonth, totalSpending]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">관광소비 (국외)</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md h-96 flex flex-col items-center justify-center relative">
          <h3 className="font-bold text-gray-700 mb-2">
            업종별 국외 관광 소비 비중
          </h3>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => {
                    const p = typeof percent === "number" ? percent : 0;
                    return `${name} ${(p * 100).toFixed(0)}%`;
                  }}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name) => [
                    `${value.toLocaleString()}원`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 text-center">
              선택된 날짜에 해당하는 데이터가 없습니다.
            </div>
          )}
          {totalSpending > 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-sm text-gray-500">총 소비액</p>
              <p className="text-xl font-bold text-blue-600">
                ₩ {totalSpending.toLocaleString()}
              </p>
            </div>
          )}
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md h-96 overflow-auto">
          <h3 className="font-bold text-gray-700 mb-2">
            업종별 국외 관광 소비 현황
          </h3>
          {tableData.length > 0 ? (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">업종</th>
                  <th className="py-3 px-6 text-left">소비액</th>
                  <th className="py-3 px-6 text-left">소비 비중</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {tableData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-100"
                  >
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {item.value.toLocaleString()}원
                    </td>
                    <td className="py-3 px-6 text-left">{item.ratio}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-gray-500 text-center mt-4">
              선택된 날짜에 해당하는 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

//'국가별 관광 방문객 수' //

const CountryTourismRatio = ({ selectedMonth }: { selectedMonth: string }) => {
  const selectedData = useMemo(
    () =>
      monthlyInternationalVisitors.find((item) => item.month === selectedMonth),
    [selectedMonth]
  );

  const totalVisitors = selectedData ? selectedData.totalVisitors : 0;
  // 국가별 색상 객체 정의
  const countryColorMap: Record<string, string> = React.useMemo(
    () => ({
      중국: "#DE2910",
      대만: "#007bff",
      미국: "#28a745",
      일본: "#6f42c1",
      싱가포르: "#fd7e14",
      홍콩: "#dc3545",
      필리핀: "#17a2b8",
      인도네시아: "#ffc107",
      "그외의 나라": "#6c757d",
    }),
    []
  );
  // 상위 8개국 + '그외의 나라'로 데이터를 재가공하는 로직
  const aggregatedData = useMemo(() => {
    if (!selectedData) return { chartData: [], tableData: [] };

    const COUNTRIES_TO_SHOW = 8;
    const sortedRatios = [...selectedData.countryRatios].sort(
      (a, b) => b.ratio - a.ratio
    );

    let finalRatios = sortedRatios;
    if (sortedRatios.length > COUNTRIES_TO_SHOW) {
      const topCountries = sortedRatios.slice(0, COUNTRIES_TO_SHOW);
      const otherCountries = sortedRatios.slice(COUNTRIES_TO_SHOW);
      const otherRatioSum = otherCountries.reduce(
        (acc, country) => acc + country.ratio,
        0
      );
      finalRatios = [
        ...topCountries,
        { country: "그외의 나라", ratio: otherRatioSum },
      ];
    }
    const chartData = finalRatios.map((item) => ({
      name: item.country,
      value: (item.ratio / 100) * totalVisitors,
      // 국가 이름에 맞는 색상을 찾아 할당하고, 없으면 기본 회색을 사용
      color: countryColorMap[item.country] || "#A9A9A9",
    }));

    const tableData = finalRatios
      .map((item) => ({
        country: item.country,
        visitors: Math.round((item.ratio / 100) * totalVisitors),
        ratio: item.ratio,
      }))
      .sort((a, b) => b.visitors - a.visitors);

    return { chartData, tableData };
  }, [selectedData, totalVisitors, countryColorMap]);

  const { chartData, tableData } = aggregatedData;

  interface TreemapPayloadItem {
    payload: { name: string; value: number };
  }
  const pickTreemapLabelProps = (
    props: unknown
  ): {
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    value: number;
    color: string;
  } => {
    const obj = (props as Record<string, unknown>) || {};
    const x = Number(obj.x ?? 0);
    const y = Number(obj.y ?? 0);
    const width = Number(obj.width ?? 0);
    const height = Number(obj.height ?? 0);
    const name = String(obj.name ?? "");
    const value = Number(obj.value ?? 0);
    const color = String(
      (obj as Record<string, unknown>).fill ??
        (obj as Record<string, unknown>).color ??
        "#A9A9A9"
    );
    return { x, y, width, height, name, value, color };
  };
  const CustomTreemapTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: TreemapPayloadItem[];
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow-md text-sm">
          <p className="font-bold">{data.name}</p>
          <p>{`방문객 수: ${Math.round(data.value).toLocaleString()}명`}</p>
          <p>{`비율: ${((data.value / (totalVisitors || 1)) * 100).toFixed(
            1
          )}%`}</p>
        </div>
      );
    }
    return null;
  };

  const TreemapCustomLabel = (props: {
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    value: number;
    color: string;
  }) => {
    const { x, y, width, height, name, value, color } = props;
    if (width < 60 || height < 35) return null;
    const textX = x + width / 2;
    const textY = y + height / 2;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: "#fff",
            strokeWidth: 1,
            opacity: 0.9,
          }}
        />
        <text
          x={textX}
          y={textY - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14}
          fontWeight="1"
          fill="#fff"
          style={{ pointerEvents: "none" }}
        >
          {name}
        </text>
        <text
          x={textX}
          y={textY + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={12}
          fill="#fff"
          style={{ pointerEvents: "none" }}
        >
          {value ? `${(value / 1000).toFixed(1)}k` : "0k"}
        </text>
      </g>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        국가별 관광 방문객 수
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md h-[500px] flex flex-col">
          <h3 className="font-bold text-gray-700 mb-2 text-center">
            {selectedMonth} 해외 방문객 구성
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={chartData}
                dataKey="value"
                aspectRatio={1}
                stroke="#fff"
                content={(props) => {
                  const p = pickTreemapLabelProps(props);
                  return <TreemapCustomLabel {...p} />;
                }}
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <Tooltip content={<CustomTreemapTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500">
              선택된 날짜에 해당하는 데이터가 없습니다.
            </div>
          )}
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md h-[500px] overflow-auto">
          <h3 className="font-bold text-gray-700 mb-4 text-center">
            {selectedMonth} 해외 방문객 순위
          </h3>
          {tableData.length > 0 ? (
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-4 text-center">순위</th>
                  <th className="py-3 px-4 text-left">국가</th>
                  <th className="py-3 px-4 text-right">방문객 수</th>
                  <th className="py-3 px-4 text-right">비율</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {tableData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-100"
                  >
                    <td className="py-3 px-4 text-center">
                      <span className="font-medium">{index + 1}</span>
                    </td>
                    <td className="py-3 px-4 text-left whitespace-nowrap">
                      {item.country}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.visitors.toLocaleString()}명
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.ratio.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
      {totalVisitors > 0 && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            {selectedMonth} 총 해외 방문객
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {totalVisitors.toLocaleString()}명
          </p>
        </div>
      )}
    </div>
  );
};
// ==================================================================
// ===== 위 '국가별 관광 방문객 수' 컴포넌트만 수정되었습니다 =====
// ==================================================================

// 메뉴 아이템 설정
const menuItems = [
  { label: "종합 현황판", icon: <LayoutDashboardIcon /> },
  { label: "방문자 통계(국내)", icon: <UsersIcon /> },
  { label: "소셜미디어 언급량", icon: <Share2Icon /> },
  { label: "관광소비(국내)", icon: <ShoppingCartIcon /> },
  { label: "관광소비(국외)", icon: <GlobeIcon /> },
  { label: "국가별 관광 방문객 수", icon: <PieChartIcon /> },
];

// 메인 대시보드 컴포넌트
export default function App() {
  const [selectedSubMenu, setSelectedSubMenu] = useState("종합 현황판");
  const [selectedMonth, setSelectedMonth] = useState("2025-06");

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  };
  const handlePrevMonth = () => {
    const date = new Date(`${selectedMonth}-02`);
    date.setMonth(date.getMonth() - 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };
  const handleNextMonth = () => {
    const date = new Date(`${selectedMonth}-02`);
    date.setMonth(date.getMonth() + 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const summaryMetricsData = useMemo(
    () => getSummaryMetrics(selectedMonth),
    [selectedMonth]
  );

  const internationalSpendingData = useMemo(
    () => getInternationalSpendingByMonth(selectedMonth),
    [selectedMonth]
  );

  const renderContent = () => {
    switch (selectedSubMenu) {
      case "종합 현황판":
        return (
          <ComprehensiveDashboard
            summaryMetrics={summaryMetricsData}
            selectedMonth={selectedMonth}
          />
        );
      case "방문자 통계(국내)":
        return <VisitorStatsDomestic selectedMonth={selectedMonth} />;
      case "소셜미디어 언급량":
        return <SocialMediaMentions selectedMonth={selectedMonth} />;
      case "관광소비(국내)":
        return <TourismConsumptionDomestic selectedMonth={selectedMonth} />;
      case "관광소비(국외)":
        return (
          <TourismConsumptionForeign
            internationalSpendingByMonth={internationalSpendingData}
          />
        );
      case "국가별 관광 방문객 수":
        return <CountryTourismRatio selectedMonth={selectedMonth} />;
      default:
        return (
          <ComprehensiveDashboard
            summaryMetrics={summaryMetricsData}
            selectedMonth={selectedMonth}
          />
        );
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "#E0E7FF",
        fontFamily: "sans-serif",
        color: "#1a202c",
      }}
    >
      <header
        className="flex-shrink-0 bg-white shadow-sm sticky top-0 z-10 px-4 sm:px-6 lg:px-8"
        style={{
          height: "6vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
              border: "1px solid #ccc",
              borderRadius: "6px",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
            }}
          >
            <button
              onClick={handlePrevMonth}
              style={{
                background: "#f0f0f0",
                border: "none",
                padding: "8px 12px",
                cursor: "pointer",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              &#9664;
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              style={{
                height: "40px",
                width: "18vw",
                padding: "6px 10px",
                fontSize: "16px",
                color: "#000",
                backgroundColor: "#fff",
                border: "none",
                outline: "none",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "0",
                right: "40px",
                height: "100%",
                width: "34px",
                backgroundColor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <CalendarIcon size={20} className="text-gray-600" />
            </div>
            <button
              onClick={handleNextMonth}
              style={{
                background: "#f0f0f0",
                border: "none",
                padding: "8px 12px",
                cursor: "pointer",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              &#9654;
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div
          style={{
            width: "100%",
            backgroundColor: "white",
            borderRadius: "3px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            display: "flex",
            padding: "0.5vw",
            gap: "1vw",
          }}
        >
          <div style={{ width: "240px" }}>
            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={() => setSelectedSubMenu(item.label)}
                style={{
                  width: "100%",
                  padding: "14px 10px",
                  marginBottom: "12px",
                  fontSize: "18px",
                  fontWeight:
                    selectedSubMenu === item.label ? "bold" : "normal",
                  color: "#000",
                  border:
                    selectedSubMenu === item.label
                      ? "2px solid #61AEFA"
                      : "1px solid #e0e0e0",
                  backgroundColor: "#fff",
                  borderRadius: "4px",
                  boxShadow: "1px 1px 5px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex-1">
            <div className="bg-white p-6 rounded-lg shadow-inner">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
