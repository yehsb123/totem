"use client";

import React, { useMemo } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import ThreeDPieChart from "../3dPieChart";
import {
  jejuMentionsData,
  monthlyCompanionTypeData,
  monthlyTravelTypeData,
} from "../data/sns";
import { COMPANION_PIE_COLORS, TRAVEL_PIE_COLORS } from "../constants";

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

export default SocialMediaMentions;
