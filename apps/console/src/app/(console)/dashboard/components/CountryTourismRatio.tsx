"use client";

import React, { useMemo } from "react";
import {
  Tooltip,
  ResponsiveContainer,
  Treemap,
  Cell,
} from "recharts";
import { useDashboardData } from "../DashboardData";

interface TreemapPayloadItem {
  payload: { name: string; value: number };
}

// 차트 조각 렌더러 — 컴포넌트 안에서 정의하면 렌더마다 새 타입이 되어 recharts 가 매번 다시 마운트한다
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

const CustomTreemapTooltip = ({
  active,
  payload,
  totalVisitors,
}: {
  active?: boolean;
  payload?: TreemapPayloadItem[];
  totalVisitors: number;
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


const CountryTourismRatio = ({ selectedMonth }: { selectedMonth: string }) => {
  const { monthlyInternationalVisitors } = useDashboardData();
  const selectedData = useMemo(
    () =>
      monthlyInternationalVisitors.find((item) => item.month === selectedMonth),
    [selectedMonth, monthlyInternationalVisitors]
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
                <Tooltip content={<CustomTreemapTooltip totalVisitors={totalVisitors} />} />
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

export default CountryTourismRatio;
