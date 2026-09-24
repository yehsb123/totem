"use client";

import React, { useMemo } from "react";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PIE_COLORS } from "../constants";

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
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString()}원`,
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

export default TourismConsumptionForeign;
