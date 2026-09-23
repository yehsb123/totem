"use client";

import React, { useState, useMemo } from "react";
import { CalendarIcon } from "./icons";
import { menuItems } from "./constants";
import { getSummaryMetrics, getInternationalSpendingByMonth } from "./data/all";

import ComprehensiveDashboard from "./components/ComprehensiveDashboard";
import VisitorStatsDomestic from "./components/VisitorStatsDomestic";
import SocialMediaMentions from "./components/SocialMediaMentions";
import TourismConsumptionDomestic from "./components/TourismConsumptionDomestic";
import TourismConsumptionForeign from "./components/TourismConsumptionForeign";
import CountryTourismRatio from "./components/CountryTourismRatio";

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
