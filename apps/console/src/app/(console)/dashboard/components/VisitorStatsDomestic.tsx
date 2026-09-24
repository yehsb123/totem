"use client";

import React, { useMemo } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import { useDashboardData } from "../DashboardData";

const VisitorStatsDomestic = ({ selectedMonth }: { selectedMonth: string }) => {
  const { monthlyVisitorsData, monthlyGenderAgeDistributionData } = useDashboardData();
  const genderAgeData = useMemo(() => {
    const monthData = monthlyGenderAgeDistributionData.find(
      (d) => d.month === selectedMonth
    );
    return monthData ? monthData.distribution : [];
  }, [selectedMonth, monthlyGenderAgeDistributionData]);

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
                formatter={(value) => [
                  `${Number(value).toLocaleString()}명`,
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
                formatter={(value, name) => [
                  `${Number(value).toFixed(1)}%`,
                  String(name) === "maleRatio" ? "남성" : "여성",
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

export default VisitorStatsDomestic;
